import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';
import type { DocumentFolder, CreateFolderRequest } from '@/app/features/documents/lib/types';

// Mock data store (in real implementation, this would be database queries)
const mockFolders: DocumentFolder[] = [
  {
    id: 'folder-1',
    organizationId: 'org-1',
    parentId: null,
    name: 'Project Apollo',
    description: 'Senior Secured Term Loan documentation',
    color: '#3B82F6',
    icon: 'briefcase',
    isSmartFolder: true,
    classificationRules: [
      {
        id: 'rule-1-1',
        fieldType: 'deal_reference',
        operator: 'contains',
        value: 'Apollo',
        caseSensitive: false,
        priority: 1,
      },
    ],
    matchAnyRule: true,
    documentCount: 2,
    childFolderCount: 3,
    createdBy: 'user-1',
    createdAt: '2024-11-01T10:00:00Z',
    updatedAt: '2024-12-05T10:30:00Z',
    displayOrder: 1,
  },
];

/**
 * GET /api/documents/folders - List all folders
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get('parentId');
    const includeChildren = searchParams.get('includeChildren') === 'true';

    let folders = [...mockFolders];

    // Filter by parent if specified
    if (parentId !== null) {
      folders = folders.filter((f) =>
        parentId === '' ? f.parentId === null : f.parentId === parentId
      );
    }

    return NextResponse.json<ApiResponse<DocumentFolder[]>>({
      success: true,
      data: folders,
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
 * POST /api/documents/folders - Create a new folder
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateFolderRequest = await request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Folder name is required',
          },
        },
        { status: 400 }
      );
    }

    // Create new folder (mock implementation)
    const newFolder: DocumentFolder = {
      id: `folder-${Date.now()}`,
      organizationId: 'org-1', // In real app, get from auth context
      parentId: body.parentId,
      name: body.name.trim(),
      description: body.description,
      color: body.color || '#6B7280',
      icon: body.icon || 'folder',
      isSmartFolder: body.isSmartFolder || false,
      classificationRules: body.classificationRules?.map((rule, index) => ({
        ...rule,
        id: `rule-${Date.now()}-${index}`,
      })),
      matchAnyRule: body.matchAnyRule,
      documentCount: 0,
      childFolderCount: 0,
      createdBy: 'current-user', // In real app, get from auth context
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      displayOrder: mockFolders.filter((f) => f.parentId === body.parentId).length + 1,
    };

    // In real implementation, save to database
    mockFolders.push(newFolder);

    return NextResponse.json<ApiResponse<DocumentFolder>>(
      {
        success: true,
        data: newFolder,
      },
      { status: 201 }
    );
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
