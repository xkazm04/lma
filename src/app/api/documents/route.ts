import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { LoanDocument } from '@/types';
import {
  respondSuccess,
  ErrorBuilder,
  getOrCreateRequestId,
  createUnauthorizedError,
} from '@/lib/utils';

// GET /api/documents - List all documents
export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const path = request.nextUrl.pathname;

  try {
    const supabase = await createClient();

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
      return ErrorBuilder.database(`Failed to fetch documents: ${error.message}`)
        .withRequestId(requestId)
        .withPath(path)
        .withMethod('GET')
        .withContext({ status, type, page, pageSize, dbErrorCode: error.code })
        .build();
    }

    return respondSuccess<LoanDocument[]>(data || [], {
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch {
    return ErrorBuilder.internal()
      .withRequestId(requestId)
      .withPath(path)
      .withMethod('GET')
      .build();
  }
}

// POST /api/documents - Upload a new document
export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const path = request.nextUrl.pathname;

  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return createUnauthorizedError('You must be logged in to upload documents', path);
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string || 'other';

    if (!file) {
      return ErrorBuilder.validation('File is required')
        .withRequestId(requestId)
        .withPath(path)
        .withMethod('POST')
        .withFieldError('file', 'No file was provided in the request')
        .withSuggestion(
          'Include a file in the form data',
          'Use the "file" field name when uploading',
          'formData.append("file", selectedFile)'
        )
        .build();
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return ErrorBuilder.validation('Invalid file type')
        .withRequestId(requestId)
        .withPath(path)
        .withMethod('POST')
        .withFieldError('file', 'Only PDF and Word documents are allowed', {
          received: file.type,
          expected: 'application/pdf, application/msword, or application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })
        .withSuggestion(
          'Upload a supported file format',
          'Convert your document to PDF or Word format before uploading'
        )
        .build();
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return ErrorBuilder.validation('File size exceeds limit')
        .withRequestId(requestId)
        .withPath(path)
        .withMethod('POST')
        .withFieldError('file', `File size (${fileSizeMB}MB) exceeds the 50MB limit`, {
          received: file.size,
          expected: 'Maximum 52428800 bytes (50MB)',
        })
        .withSuggestion(
          'Reduce the file size before uploading',
          'Try compressing the PDF or splitting it into smaller documents'
        )
        .build();
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
      return ErrorBuilder.upload(`Failed to upload file: ${uploadError.message}`)
        .withRequestId(requestId)
        .withPath(path)
        .withMethod('POST')
        .withContext({ fileName: file.name, fileSize: file.size, fileType: file.type })
        .withSuggestion(
          'Storage service may be temporarily unavailable',
          'Wait a moment and try uploading again'
        )
        .build();
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

      return ErrorBuilder.database(`Failed to create document record: ${dbError.message}`)
        .withRequestId(requestId)
        .withPath(path)
        .withMethod('POST')
        .withContext({ fileName: file.name, operation: 'create_record' })
        .build();
    }

    // TODO: Trigger document processing job
    // await triggerDocumentProcessing(document.id);

    return respondSuccess<LoanDocument>(document, { status: 201 });
  } catch {
    return ErrorBuilder.internal()
      .withRequestId(requestId)
      .withPath(path)
      .withMethod('POST')
      .build();
  }
}
