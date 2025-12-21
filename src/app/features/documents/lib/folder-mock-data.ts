import type { DocumentFolder, FolderTreeNode, FolderSuggestion } from './types';

/**
 * Mock folder data representing a typical loan document organization structure
 */
export const mockFolders: DocumentFolder[] = [
  // Root-level folders organized by deal
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
      {
        id: 'rule-1-2',
        fieldType: 'borrower_name',
        operator: 'contains',
        value: 'Apollo',
        caseSensitive: false,
        priority: 2,
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
  {
    id: 'folder-2',
    organizationId: 'org-1',
    parentId: null,
    name: 'Neptune Revolving Credit',
    description: 'Neptune Ltd revolving credit facility',
    color: '#10B981',
    icon: 'building',
    isSmartFolder: true,
    classificationRules: [
      {
        id: 'rule-2-1',
        fieldType: 'borrower_name',
        operator: 'contains',
        value: 'Neptune',
        caseSensitive: false,
        priority: 1,
      },
    ],
    matchAnyRule: true,
    documentCount: 1,
    childFolderCount: 2,
    createdBy: 'user-1',
    createdAt: '2024-11-05T14:00:00Z',
    updatedAt: '2024-12-02T17:00:00Z',
    displayOrder: 2,
  },
  {
    id: 'folder-3',
    organizationId: 'org-1',
    parentId: null,
    name: 'XYZ Corp Term Loan',
    description: 'XYZ Corporation term loan documentation',
    color: '#F59E0B',
    icon: 'file-stack',
    isSmartFolder: true,
    classificationRules: [
      {
        id: 'rule-3-1',
        fieldType: 'borrower_name',
        operator: 'contains',
        value: 'XYZ',
        caseSensitive: false,
        priority: 1,
      },
    ],
    matchAnyRule: true,
    documentCount: 1,
    childFolderCount: 2,
    createdBy: 'user-1',
    createdAt: '2024-11-10T09:00:00Z',
    updatedAt: '2024-12-04T14:25:00Z',
    displayOrder: 3,
  },
  // Sub-folders under Project Apollo
  {
    id: 'folder-1-1',
    organizationId: 'org-1',
    parentId: 'folder-1',
    name: 'Original Agreements',
    description: 'Initial facility agreements and schedules',
    color: '#3B82F6',
    icon: 'file-text',
    isSmartFolder: true,
    classificationRules: [
      {
        id: 'rule-1-1-1',
        fieldType: 'document_type',
        operator: 'equals',
        value: 'facility_agreement',
        caseSensitive: false,
        priority: 1,
      },
    ],
    matchAnyRule: false,
    documentCount: 1,
    childFolderCount: 0,
    createdBy: 'user-1',
    createdAt: '2024-11-01T10:05:00Z',
    updatedAt: '2024-12-05T10:35:00Z',
    displayOrder: 1,
  },
  {
    id: 'folder-1-2',
    organizationId: 'org-1',
    parentId: 'folder-1',
    name: 'Amendments',
    description: 'Amendment documents',
    color: '#3B82F6',
    icon: 'file-edit',
    isSmartFolder: true,
    classificationRules: [
      {
        id: 'rule-1-2-1',
        fieldType: 'document_type',
        operator: 'equals',
        value: 'amendment',
        caseSensitive: false,
        priority: 1,
      },
    ],
    matchAnyRule: false,
    documentCount: 1,
    childFolderCount: 0,
    createdBy: 'user-1',
    createdAt: '2024-11-01T10:06:00Z',
    updatedAt: '2024-12-04T14:25:00Z',
    displayOrder: 2,
  },
  {
    id: 'folder-1-3',
    organizationId: 'org-1',
    parentId: 'folder-1',
    name: 'Consents & Waivers',
    description: 'Consent letters and waiver documents',
    color: '#3B82F6',
    icon: 'check-circle',
    isSmartFolder: true,
    classificationRules: [
      {
        id: 'rule-1-3-1',
        fieldType: 'document_type',
        operator: 'equals',
        value: 'consent',
        caseSensitive: false,
        priority: 1,
      },
    ],
    matchAnyRule: false,
    documentCount: 0,
    childFolderCount: 0,
    createdBy: 'user-1',
    createdAt: '2024-11-01T10:07:00Z',
    updatedAt: '2024-11-01T10:07:00Z',
    displayOrder: 3,
  },
  // Sub-folders under Neptune
  {
    id: 'folder-2-1',
    organizationId: 'org-1',
    parentId: 'folder-2',
    name: 'Credit Agreement',
    description: 'Main credit agreement and schedules',
    color: '#10B981',
    icon: 'file-text',
    isSmartFolder: true,
    classificationRules: [
      {
        id: 'rule-2-1-1',
        fieldType: 'document_type',
        operator: 'equals',
        value: 'facility_agreement',
        caseSensitive: false,
        priority: 1,
      },
    ],
    matchAnyRule: false,
    documentCount: 1,
    childFolderCount: 0,
    createdBy: 'user-1',
    createdAt: '2024-11-05T14:05:00Z',
    updatedAt: '2024-12-02T17:00:00Z',
    displayOrder: 1,
  },
  {
    id: 'folder-2-2',
    organizationId: 'org-1',
    parentId: 'folder-2',
    name: 'Assignments',
    description: 'Assignment and transfer documents',
    color: '#10B981',
    icon: 'users',
    isSmartFolder: true,
    classificationRules: [
      {
        id: 'rule-2-2-1',
        fieldType: 'document_type',
        operator: 'equals',
        value: 'assignment',
        caseSensitive: false,
        priority: 1,
      },
    ],
    matchAnyRule: false,
    documentCount: 0,
    childFolderCount: 0,
    createdBy: 'user-1',
    createdAt: '2024-11-05T14:06:00Z',
    updatedAt: '2024-11-05T14:06:00Z',
    displayOrder: 2,
  },
  // Sub-folders under XYZ Corp
  {
    id: 'folder-3-1',
    organizationId: 'org-1',
    parentId: 'folder-3',
    name: 'Loan Documents',
    description: 'Primary loan documentation',
    color: '#F59E0B',
    icon: 'file-text',
    isSmartFolder: false,
    documentCount: 1,
    childFolderCount: 0,
    createdBy: 'user-1',
    createdAt: '2024-11-10T09:05:00Z',
    updatedAt: '2024-12-04T14:25:00Z',
    displayOrder: 1,
  },
  {
    id: 'folder-3-2',
    organizationId: 'org-1',
    parentId: 'folder-3',
    name: 'Compliance Reports',
    description: 'Periodic compliance and financial reports',
    color: '#F59E0B',
    icon: 'clipboard-list',
    isSmartFolder: false,
    documentCount: 0,
    childFolderCount: 0,
    createdBy: 'user-1',
    createdAt: '2024-11-10T09:06:00Z',
    updatedAt: '2024-11-10T09:06:00Z',
    displayOrder: 2,
  },
  // Special folders
  {
    id: 'folder-consents',
    organizationId: 'org-1',
    parentId: null,
    name: 'All Consents',
    description: 'Smart folder for all consent documents across deals',
    color: '#8B5CF6',
    icon: 'folder-check',
    isSmartFolder: true,
    classificationRules: [
      {
        id: 'rule-consents-1',
        fieldType: 'document_type',
        operator: 'equals',
        value: 'consent',
        caseSensitive: false,
        priority: 1,
      },
    ],
    matchAnyRule: false,
    documentCount: 1,
    childFolderCount: 0,
    createdBy: 'user-1',
    createdAt: '2024-11-15T10:00:00Z',
    updatedAt: '2024-12-03T09:15:00Z',
    displayOrder: 4,
  },
  {
    id: 'folder-assignments',
    organizationId: 'org-1',
    parentId: null,
    name: 'All Assignments',
    description: 'Smart folder for all assignment documents',
    color: '#EC4899',
    icon: 'folder-sync',
    isSmartFolder: true,
    classificationRules: [
      {
        id: 'rule-assignments-1',
        fieldType: 'document_type',
        operator: 'equals',
        value: 'assignment',
        caseSensitive: false,
        priority: 1,
      },
    ],
    matchAnyRule: false,
    documentCount: 1,
    childFolderCount: 0,
    createdBy: 'user-1',
    createdAt: '2024-11-15T10:05:00Z',
    updatedAt: '2024-12-01T11:05:00Z',
    displayOrder: 5,
  },
];

/**
 * Mock document-to-folder mapping (document ID -> folder ID)
 */
export const mockDocumentFolderMap: Record<string, string | null> = {
  '1': 'folder-1-1', // Facility Agreement - Project Apollo -> Project Apollo/Original Agreements
  '2': 'folder-1-2', // Amendment No. 1 - XYZ Corp -> Project Apollo/Amendments (for demo, in real app would be in XYZ folder)
  '3': 'folder-consents', // Consent Request - ABC Holdings -> All Consents
  '4': 'folder-2-1', // Revolving Credit Agreement - Neptune -> Neptune/Credit Agreement
  '5': 'folder-assignments', // Assignment Agreement - Delta -> All Assignments
};

/**
 * Build folder tree from flat folder list
 */
export function buildFolderTree(folders: DocumentFolder[]): FolderTreeNode[] {
  const folderMap = new Map<string, FolderTreeNode>();
  const rootFolders: FolderTreeNode[] = [];

  // First pass: create tree nodes
  folders.forEach((folder) => {
    folderMap.set(folder.id, {
      ...folder,
      children: [],
      totalDocumentCount: folder.documentCount,
    });
  });

  // Second pass: build tree structure
  folders.forEach((folder) => {
    const node = folderMap.get(folder.id)!;
    if (folder.parentId === null) {
      rootFolders.push(node);
    } else {
      const parent = folderMap.get(folder.parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  // Third pass: calculate total document counts
  function calculateTotalDocs(node: FolderTreeNode): number {
    let total = node.documentCount;
    for (const child of node.children) {
      total += calculateTotalDocs(child);
    }
    node.totalDocumentCount = total;
    return total;
  }

  rootFolders.forEach(calculateTotalDocs);

  // Sort children by display order
  function sortChildren(node: FolderTreeNode) {
    node.children.sort((a, b) => a.displayOrder - b.displayOrder);
    node.children.forEach(sortChildren);
  }

  rootFolders.sort((a, b) => a.displayOrder - b.displayOrder);
  rootFolders.forEach(sortChildren);

  return rootFolders;
}

/**
 * Get the full path of a folder
 */
export function getFolderPath(folderId: string, folders: DocumentFolder[]): string {
  const folderMap = new Map(folders.map((f) => [f.id, f]));
  const path: string[] = [];
  let current = folderMap.get(folderId);

  while (current) {
    path.unshift(current.name);
    current = current.parentId ? folderMap.get(current.parentId) : undefined;
  }

  return path.join(' / ');
}

/**
 * Mock AI folder suggestions for documents
 */
export function getMockFolderSuggestions(
  documentId: string,
  documentName: string,
  documentType: string
): FolderSuggestion[] {
  const suggestions: FolderSuggestion[] = [];

  // Extract likely borrower/deal name from filename
  const nameLower = documentName.toLowerCase();

  if (nameLower.includes('apollo')) {
    suggestions.push({
      folderId: 'folder-1',
      folderName: 'Project Apollo',
      folderPath: 'Project Apollo',
      confidence: 0.95,
      reasoning: 'Document name contains "Apollo" which matches the Project Apollo deal folder',
      matchedRules: [
        {
          ruleId: 'rule-1-1',
          fieldType: 'deal_reference',
          matchedValue: 'Apollo',
        },
      ],
      extractedData: {
        dealReference: 'Project Apollo',
        documentType,
      },
    });
  }

  if (nameLower.includes('neptune')) {
    suggestions.push({
      folderId: 'folder-2',
      folderName: 'Neptune Revolving Credit',
      folderPath: 'Neptune Revolving Credit',
      confidence: 0.92,
      reasoning: 'Document name contains "Neptune" which matches the Neptune deal folder',
      matchedRules: [
        {
          ruleId: 'rule-2-1',
          fieldType: 'borrower_name',
          matchedValue: 'Neptune',
        },
      ],
      extractedData: {
        borrowerName: 'Neptune Ltd',
        documentType,
      },
    });
  }

  if (nameLower.includes('xyz')) {
    suggestions.push({
      folderId: 'folder-3',
      folderName: 'XYZ Corp Term Loan',
      folderPath: 'XYZ Corp Term Loan',
      confidence: 0.90,
      reasoning: 'Document name contains "XYZ" which matches the XYZ Corp deal folder',
      matchedRules: [
        {
          ruleId: 'rule-3-1',
          fieldType: 'borrower_name',
          matchedValue: 'XYZ',
        },
      ],
      extractedData: {
        borrowerName: 'XYZ Corp',
        documentType,
      },
    });
  }

  // Add document type based suggestions
  if (documentType === 'consent') {
    suggestions.push({
      folderId: 'folder-consents',
      folderName: 'All Consents',
      folderPath: 'All Consents',
      confidence: 0.88,
      reasoning: 'Document type is "consent" which matches the All Consents smart folder',
      matchedRules: [
        {
          ruleId: 'rule-consents-1',
          fieldType: 'document_type',
          matchedValue: 'consent',
        },
      ],
      extractedData: {
        documentType: 'consent',
      },
    });
  }

  if (documentType === 'assignment') {
    suggestions.push({
      folderId: 'folder-assignments',
      folderName: 'All Assignments',
      folderPath: 'All Assignments',
      confidence: 0.88,
      reasoning: 'Document type is "assignment" which matches the All Assignments smart folder',
      matchedRules: [
        {
          ruleId: 'rule-assignments-1',
          fieldType: 'document_type',
          matchedValue: 'assignment',
        },
      ],
      extractedData: {
        documentType: 'assignment',
      },
    });
  }

  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence);

  return suggestions;
}

/**
 * Available folder colors for the create folder dialog
 */
export const folderColors = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#6B7280', label: 'Gray' },
  { value: '#14B8A6', label: 'Teal' },
];

/**
 * Available folder icons
 */
export const folderIcons = [
  { value: 'folder', label: 'Folder' },
  { value: 'briefcase', label: 'Briefcase' },
  { value: 'building', label: 'Building' },
  { value: 'file-stack', label: 'File Stack' },
  { value: 'file-text', label: 'Document' },
  { value: 'file-edit', label: 'Amendment' },
  { value: 'check-circle', label: 'Approval' },
  { value: 'users', label: 'People' },
  { value: 'clipboard-list', label: 'Checklist' },
  { value: 'folder-check', label: 'Verified Folder' },
  { value: 'folder-sync', label: 'Sync Folder' },
];
