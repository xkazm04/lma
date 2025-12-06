import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse, LoanDocument } from '@/types';

// GET /api/documents - List all documents
export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await createClient();

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    let query = supabase
      .from('loan_documents')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('processing_status', status);
    }
    if (type && type !== 'all') {
      query = query.eq('document_type', type);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('uploaded_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: error.message,
        },
      }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<LoanDocument[]>>({
      success: true,
      data: data || [],
      meta: {
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      },
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

// POST /api/documents - Upload a new document
export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase: any = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string || 'other';

    if (!file) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'File is required',
        },
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid file type. Only PDF and Word documents are allowed.',
        },
      }, { status: 400 });
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'File size exceeds 50MB limit',
        },
      }, { status: 400 });
    }

    // Get user's organization ID (in real app, this would come from user profile)
    const organizationId = 'default-org'; // Placeholder

    // Generate storage path
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const storagePath = `${organizationId}/${fileName}`;

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('loan-documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: uploadError.message,
        },
      }, { status: 500 });
    }

    // Create document record
    const { data: document, error: dbError } = await supabase
      .from('loan_documents')
      .insert({
        organization_id: organizationId,
        uploaded_by: user.id,
        original_filename: file.name,
        storage_path: storagePath,
        document_type: documentType,
        processing_status: 'pending',
        file_size: file.size,
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file on error
      await supabase.storage.from('loan-documents').remove([storagePath]);

      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: dbError.message,
        },
      }, { status: 500 });
    }

    // TODO: Trigger document processing job
    // await triggerDocumentProcessing(document.id);

    return NextResponse.json<ApiResponse<LoanDocument>>({
      success: true,
      data: document,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}
