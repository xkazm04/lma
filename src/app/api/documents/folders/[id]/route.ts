import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import type { DocumentFolder } from '@/app/features/documents/lib/types';

// Mock data store (shared with parent route in real implementation via database)
const mockFolders: Map<string, DocumentFolder> = new Map();

/**
 * GET /api/documents/folders/[id] - Get a specific folder
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // In real implementation, query database
    const folder = mockFolders.get(id);

    if (!folder) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Folder not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<DocumentFolder>>({
      success: true,
      data: folder,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/documents/folders/[id] - Update a folder
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // In real implementation, query database
    const existingFolder = mockFolders.get(id);

    if (!existingFolder) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Folder not found',
          },
        },
        { status: 404 }
      );
    }

    // Update folder
    const updatedFolder: DocumentFolder = {
      ...existingFolder,
      ...body,
      id, // Prevent id from being changed
      updatedAt: new Date().toISOString(),
    };

    mockFolders.set(id, updatedFolder);

    return NextResponse.json<ApiResponse<DocumentFolder>>({
      success: true,
      data: updatedFolder,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/folders/[id] - Delete a folder
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const cascade = searchParams.get('cascade') === 'true';

    // In real implementation, query database
    const existingFolder = mockFolders.get(id);

    if (!existingFolder) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Folder not found',
          },
        },
        { status: 404 }
      );
    }

    // In real implementation:
    // 1. Check for child folders
    // 2. If cascade=true, delete all children
    // 3. Move documents to unfiled or delete based on preference
    // 4. Delete the folder

    mockFolders.delete(id);

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
