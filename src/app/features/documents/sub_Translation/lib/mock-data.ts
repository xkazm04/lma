/**
 * Document Translation Module - Mock Data
 *
 * Provides mock data for document translation features including:
 * - Translation jobs
 * - Language pairs
 * - Translation quality scores
 * - Glossary terms
 */

import {
  documents,
  DOCUMENT_IDS,
  pastDate,
  futureDate,
} from '@/lib/shared/registry';

// =============================================================================
// Types
// =============================================================================

export interface TranslationLanguage {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
}

export interface TranslationJob {
  id: string;
  documentId: string;
  documentName: string;
  sourceLanguage: TranslationLanguage;
  targetLanguage: TranslationLanguage;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  qualityScore: number | null;
  wordCount: number;
  translatedWordCount: number;
  createdAt: string;
  completedAt: string | null;
  requestedBy: string;
  reviewedBy: string | null;
  glossaryApplied: boolean;
  preserveFormatting: boolean;
}

export interface GlossaryTerm {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLanguage: string;
  targetLanguage: string;
  category: 'legal' | 'financial' | 'technical' | 'general';
  approved: boolean;
  usageCount: number;
}

export interface TranslationSegment {
  id: string;
  sourceText: string;
  translatedText: string;
  confidence: number;
  glossaryMatches: string[];
  status: 'auto' | 'reviewed' | 'edited';
}

export interface TranslationQualityReport {
  jobId: string;
  overallScore: number;
  fluencyScore: number;
  accuracyScore: number;
  terminologyScore: number;
  styleScore: number;
  issues: Array<{
    type: 'terminology' | 'grammar' | 'style' | 'accuracy';
    severity: 'low' | 'medium' | 'high';
    description: string;
    segment: string;
    suggestion: string;
  }>;
}

// =============================================================================
// Supported Languages
// =============================================================================

export const supportedLanguages: TranslationLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', rtl: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
];

export function getLanguage(code: string): TranslationLanguage | undefined {
  return supportedLanguages.find((l) => l.code === code);
}

// =============================================================================
// Translation Jobs Mock Data
// =============================================================================

export const mockTranslationJobs: TranslationJob[] = [
  {
    id: 'trans-1',
    documentId: DOCUMENT_IDS.APOLLO_FACILITY_AGREEMENT,
    documentName: 'Facility Agreement - Project Apollo.pdf',
    sourceLanguage: getLanguage('en')!,
    targetLanguage: getLanguage('de')!,
    status: 'completed',
    progress: 100,
    qualityScore: 94,
    wordCount: 45000,
    translatedWordCount: 45000,
    createdAt: pastDate(7) + 'T09:00:00Z',
    completedAt: pastDate(5) + 'T14:30:00Z',
    requestedBy: 'Sarah Johnson',
    reviewedBy: 'Hans Mueller',
    glossaryApplied: true,
    preserveFormatting: true,
  },
  {
    id: 'trans-2',
    documentId: DOCUMENT_IDS.NEPTUNE_REVOLVER,
    documentName: 'Revolving Credit Agreement - Neptune Ltd.pdf',
    sourceLanguage: getLanguage('en')!,
    targetLanguage: getLanguage('fr')!,
    status: 'in_progress',
    progress: 65,
    qualityScore: null,
    wordCount: 62000,
    translatedWordCount: 40300,
    createdAt: pastDate(2) + 'T11:00:00Z',
    completedAt: null,
    requestedBy: 'Michael Chen',
    reviewedBy: null,
    glossaryApplied: true,
    preserveFormatting: true,
  },
  {
    id: 'trans-3',
    documentId: DOCUMENT_IDS.ECOTECH_GREEN_BOND,
    documentName: 'Green Bond Framework - EcoTech Ltd.pdf',
    sourceLanguage: getLanguage('en')!,
    targetLanguage: getLanguage('zh')!,
    status: 'pending',
    progress: 0,
    qualityScore: null,
    wordCount: 28000,
    translatedWordCount: 0,
    createdAt: pastDate(0) + 'T15:00:00Z',
    completedAt: null,
    requestedBy: 'David Kim',
    reviewedBy: null,
    glossaryApplied: false,
    preserveFormatting: true,
  },
  {
    id: 'trans-4',
    documentId: DOCUMENT_IDS.XYZ_AMENDMENT,
    documentName: 'Amendment No. 1 - XYZ Corp Term Loan.docx',
    sourceLanguage: getLanguage('en')!,
    targetLanguage: getLanguage('es')!,
    status: 'completed',
    progress: 100,
    qualityScore: 91,
    wordCount: 8500,
    translatedWordCount: 8500,
    createdAt: pastDate(10) + 'T10:00:00Z',
    completedAt: pastDate(9) + 'T16:00:00Z',
    requestedBy: 'Sarah Johnson',
    reviewedBy: 'Carlos Martinez',
    glossaryApplied: true,
    preserveFormatting: true,
  },
  {
    id: 'trans-5',
    documentId: DOCUMENT_IDS.OMEGA_FACILITY_AGREEMENT,
    documentName: 'Acquisition Facility Agreement - Omega Holdings.pdf',
    sourceLanguage: getLanguage('en')!,
    targetLanguage: getLanguage('ja')!,
    status: 'failed',
    progress: 23,
    qualityScore: null,
    wordCount: 72000,
    translatedWordCount: 16560,
    createdAt: pastDate(5) + 'T08:00:00Z',
    completedAt: null,
    requestedBy: 'David Kim',
    reviewedBy: null,
    glossaryApplied: false,
    preserveFormatting: true,
  },
];

// =============================================================================
// Glossary Terms Mock Data
// =============================================================================

export const mockGlossaryTerms: GlossaryTerm[] = [
  // English to German
  { id: 'gloss-1', sourceText: 'Facility Agreement', targetText: 'Kreditvertrag', sourceLanguage: 'en', targetLanguage: 'de', category: 'legal', approved: true, usageCount: 156 },
  { id: 'gloss-2', sourceText: 'Leverage Ratio', targetText: 'Verschuldungsgrad', sourceLanguage: 'en', targetLanguage: 'de', category: 'financial', approved: true, usageCount: 89 },
  { id: 'gloss-3', sourceText: 'Covenant', targetText: 'Kreditauflage', sourceLanguage: 'en', targetLanguage: 'de', category: 'legal', approved: true, usageCount: 234 },
  { id: 'gloss-4', sourceText: 'Borrower', targetText: 'Kreditnehmer', sourceLanguage: 'en', targetLanguage: 'de', category: 'legal', approved: true, usageCount: 312 },
  { id: 'gloss-5', sourceText: 'Administrative Agent', targetText: 'Verwaltungsstelle', sourceLanguage: 'en', targetLanguage: 'de', category: 'legal', approved: true, usageCount: 67 },

  // English to French
  { id: 'gloss-6', sourceText: 'Facility Agreement', targetText: 'Contrat de Crédit', sourceLanguage: 'en', targetLanguage: 'fr', category: 'legal', approved: true, usageCount: 145 },
  { id: 'gloss-7', sourceText: 'Interest Coverage Ratio', targetText: 'Ratio de Couverture des Intérêts', sourceLanguage: 'en', targetLanguage: 'fr', category: 'financial', approved: true, usageCount: 78 },
  { id: 'gloss-8', sourceText: 'Event of Default', targetText: 'Cas de Défaut', sourceLanguage: 'en', targetLanguage: 'fr', category: 'legal', approved: true, usageCount: 198 },

  // English to Spanish
  { id: 'gloss-9', sourceText: 'Revolving Credit', targetText: 'Crédito Rotativo', sourceLanguage: 'en', targetLanguage: 'es', category: 'financial', approved: true, usageCount: 112 },
  { id: 'gloss-10', sourceText: 'Syndicated Loan', targetText: 'Préstamo Sindicado', sourceLanguage: 'en', targetLanguage: 'es', category: 'financial', approved: true, usageCount: 87 },

  // English to Chinese
  { id: 'gloss-11', sourceText: 'Green Bond', targetText: '绿色债券', sourceLanguage: 'en', targetLanguage: 'zh', category: 'financial', approved: true, usageCount: 45 },
  { id: 'gloss-12', sourceText: 'ESG', targetText: '环境、社会和治理', sourceLanguage: 'en', targetLanguage: 'zh', category: 'technical', approved: true, usageCount: 67 },

  // English to Japanese
  { id: 'gloss-13', sourceText: 'Term Loan', targetText: 'タームローン', sourceLanguage: 'en', targetLanguage: 'ja', category: 'financial', approved: true, usageCount: 56 },
  { id: 'gloss-14', sourceText: 'Maturity Date', targetText: '満期日', sourceLanguage: 'en', targetLanguage: 'ja', category: 'financial', approved: true, usageCount: 89 },
];

// =============================================================================
// Translation Segments Mock Data (for detailed view)
// =============================================================================

export const mockTranslationSegments: Record<string, TranslationSegment[]> = {
  'trans-1': [
    {
      id: 'seg-1',
      sourceText: 'This Facility Agreement is entered into as of the date set forth on the signature page hereof.',
      translatedText: 'Dieser Kreditvertrag wird zum auf der Unterschriftsseite angegebenen Datum geschlossen.',
      confidence: 0.96,
      glossaryMatches: ['Kreditvertrag'],
      status: 'reviewed',
    },
    {
      id: 'seg-2',
      sourceText: 'The Borrower hereby irrevocably and unconditionally agrees to pay to the Administrative Agent.',
      translatedText: 'Der Kreditnehmer verpflichtet sich hiermit unwiderruflich und bedingungslos, an die Verwaltungsstelle zu zahlen.',
      confidence: 0.94,
      glossaryMatches: ['Kreditnehmer', 'Verwaltungsstelle'],
      status: 'reviewed',
    },
    {
      id: 'seg-3',
      sourceText: 'The Maximum Leverage Ratio shall not exceed 4.50 to 1.00 at any time.',
      translatedText: 'Der maximale Verschuldungsgrad darf zu keinem Zeitpunkt 4,50 zu 1,00 überschreiten.',
      confidence: 0.92,
      glossaryMatches: ['Verschuldungsgrad'],
      status: 'auto',
    },
  ],
};

// =============================================================================
// Quality Reports Mock Data
// =============================================================================

export const mockQualityReports: Record<string, TranslationQualityReport> = {
  'trans-1': {
    jobId: 'trans-1',
    overallScore: 94,
    fluencyScore: 96,
    accuracyScore: 93,
    terminologyScore: 95,
    styleScore: 92,
    issues: [
      {
        type: 'terminology',
        severity: 'low',
        description: 'Consider using "Finanzkennzahl" instead of "Verhältnis" for financial ratio context',
        segment: 'seg-3',
        suggestion: 'Die maximale Finanzkennzahl...',
      },
      {
        type: 'style',
        severity: 'low',
        description: 'Passive voice could be converted to active for better readability',
        segment: 'seg-2',
        suggestion: 'Use active construction where possible',
      },
    ],
  },
  'trans-4': {
    jobId: 'trans-4',
    overallScore: 91,
    fluencyScore: 93,
    accuracyScore: 90,
    terminologyScore: 92,
    styleScore: 89,
    issues: [
      {
        type: 'accuracy',
        severity: 'medium',
        description: 'Date format should follow Spanish conventions',
        segment: 'seg-1',
        suggestion: 'Use DD/MM/YYYY format',
      },
    ],
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

export function getTranslationJob(id: string): TranslationJob | undefined {
  return mockTranslationJobs.find((j) => j.id === id);
}

export function getJobsByDocument(documentId: string): TranslationJob[] {
  return mockTranslationJobs.filter((j) => j.documentId === documentId);
}

export function getJobsByStatus(status: TranslationJob['status']): TranslationJob[] {
  return mockTranslationJobs.filter((j) => j.status === status);
}

export function getGlossaryForLanguagePair(source: string, target: string): GlossaryTerm[] {
  return mockGlossaryTerms.filter(
    (t) => t.sourceLanguage === source && t.targetLanguage === target
  );
}

export function getSegmentsForJob(jobId: string): TranslationSegment[] {
  return mockTranslationSegments[jobId] || [];
}

export function getQualityReport(jobId: string): TranslationQualityReport | undefined {
  return mockQualityReports[jobId];
}

// =============================================================================
// Statistics
// =============================================================================

export function getTranslationStats() {
  const jobs = mockTranslationJobs;
  const completed = jobs.filter((j) => j.status === 'completed');
  const avgQuality = completed.reduce((sum, j) => sum + (j.qualityScore || 0), 0) / completed.length;

  return {
    totalJobs: jobs.length,
    completedJobs: completed.length,
    inProgressJobs: jobs.filter((j) => j.status === 'in_progress').length,
    pendingJobs: jobs.filter((j) => j.status === 'pending').length,
    failedJobs: jobs.filter((j) => j.status === 'failed').length,
    averageQualityScore: Math.round(avgQuality),
    totalWordsTranslated: jobs.reduce((sum, j) => sum + j.translatedWordCount, 0),
    glossaryTerms: mockGlossaryTerms.length,
    supportedLanguages: supportedLanguages.length,
  };
}
