import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import type {
  MoveDocumentRequest,
  BulkMoveDocumentsRequest,
} from '@/app/features/documents/lib/types';

/**
 * POST /api/documents/folders/move - Move document(s) to a folder
 *
 * Supports both single document and bulk move operations.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a bulk move or single move
    const isBulkMove = Array.isArray(body.documentIds);

    if (isBulkMove) {
      // Bulk move operation
      const bulkRequest = body as BulkMoveDocumentsRequest;

      if (!bulkRequest.documentIds || bulkRequest.documentIds.length === 0) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'At least one document ID is required',
            },
          },
          { status: 400 }
        );
      }

      // In real implementation:
      // 1. Verify all documents exist
      // 2. Verify target folder exists (if not null)
      // 3. Update document records with new folder ID
      // 4. Update folder document counts

      return NextResponse.json<ApiResponse<{ moved: number }>>({
        success: true,
        data: {
          moved: bulkRequest.documentIds.length,
        },
      });
    } else {
      // Single document move
      const singleRequest = body as MoveDocumentRequest;

      if (!singleRequest.documentId) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Document ID is required',
            },
          },
          { status: 400 }
        );
      }

      // In real implementation:
      // 1. Verify document exists
      // 2. Verify target folder exists (if not null)
      // 3. Update document record with new folder ID
      // 4. Update old and new folder document counts

      return NextResponse.json<ApiResponse<{ documentId: string; folderId: string | null }>>({
        success: true,
        data: {
          documentId: singleRequest.documentId,
          folderId: singleRequest.targetFolderId,
        },
      });
    }
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
