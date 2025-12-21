/**
 * Document Type Auto-Detection
 *
 * Analyzes document content to automatically detect the document type
 * and recommend the most appropriate extraction template.
 */

import type { DocumentTypeDetection, LoanDocumentType, ExtractionTemplate } from './template-types';
import { systemTemplates, getTemplateById } from './templates';

/**
 * Keyword weights for more accurate matching
 */
interface KeywordWeight {
  keyword: string;
  weight: number;
  exclusive?: boolean; // If true, strongly indicates this type over others
}

/**
 * Enhanced keyword definitions with weights
 */
const templateKeywordWeights: Record<string, KeywordWeight[]> = {
  'term-loan-standard': [
    { keyword: 'term loan', weight: 2.0, exclusive: true },
    { keyword: 'term facility', weight: 1.8 },
    { keyword: 'amortization', weight: 1.5 },
    { keyword: 'scheduled repayment', weight: 1.5 },
    { keyword: 'principal payments', weight: 1.3 },
    { keyword: 'term a', weight: 1.5, exclusive: true },
    { keyword: 'term b', weight: 1.5, exclusive: true },
    { keyword: 'tla', weight: 1.8, exclusive: true },
    { keyword: 'tlb', weight: 1.8, exclusive: true },
    { keyword: 'amortizing', weight: 1.4 },
    { keyword: 'mandatory prepayment', weight: 1.0 },
  ],
  'revolving-credit-standard': [
    { keyword: 'revolving', weight: 2.0, exclusive: true },
    { keyword: 'revolver', weight: 2.0, exclusive: true },
    { keyword: 'revolving credit', weight: 2.2, exclusive: true },
    { keyword: 'rcf', weight: 1.8, exclusive: true },
    { keyword: 'revolving facility', weight: 2.0 },
    { keyword: 'availability', weight: 1.0 },
    { keyword: 'drawdown', weight: 1.2 },
    { keyword: 'reborrowing', weight: 1.5 },
    { keyword: 'swingline', weight: 1.3 },
    { keyword: 'letter of credit sublimit', weight: 1.2 },
    { keyword: 'commitment reduction', weight: 1.0 },
  ],
  'syndicated-facility-standard': [
    { keyword: 'syndicated', weight: 1.8 },
    { keyword: 'syndicate', weight: 1.5 },
    { keyword: 'lenders', weight: 0.8 },
    { keyword: 'required lenders', weight: 1.5 },
    { keyword: 'pro rata', weight: 1.3 },
    { keyword: 'commitment schedule', weight: 1.5 },
    { keyword: 'schedule of commitments', weight: 1.5 },
    { keyword: 'arrangers', weight: 1.2 },
    { keyword: 'bookrunner', weight: 1.3 },
    { keyword: 'lead arranger', weight: 1.3 },
    { keyword: 'mandated lead arranger', weight: 1.4 },
    { keyword: 'agent bank', weight: 1.0 },
    { keyword: 'majority lenders', weight: 1.2 },
  ],
  'bridge-loan-standard': [
    { keyword: 'bridge', weight: 2.0, exclusive: true },
    { keyword: 'bridge loan', weight: 2.2, exclusive: true },
    { keyword: 'bridge facility', weight: 2.2, exclusive: true },
    { keyword: 'interim financing', weight: 1.8 },
    { keyword: 'short-term', weight: 0.8 },
    { keyword: 'conversion', weight: 1.0 },
    { keyword: 'takeout', weight: 1.2 },
    { keyword: '364 day', weight: 1.5, exclusive: true },
    { keyword: '364-day', weight: 1.5, exclusive: true },
    { keyword: 'permanent financing', weight: 1.2 },
    { keyword: 'term out', weight: 1.3 },
  ],
  'amendment-standard': [
    { keyword: 'amendment', weight: 2.0, exclusive: true },
    { keyword: 'amended and restated', weight: 2.2, exclusive: true },
    { keyword: 'first amendment', weight: 2.0, exclusive: true },
    { keyword: 'second amendment', weight: 2.0, exclusive: true },
    { keyword: 'third amendment', weight: 2.0, exclusive: true },
    { keyword: 'waiver', weight: 1.5 },
    { keyword: 'consent', weight: 1.0 },
    { keyword: 'hereby amend', weight: 1.8, exclusive: true },
    { keyword: 'modification', weight: 1.3 },
    { keyword: 'omnibus amendment', weight: 2.0, exclusive: true },
    { keyword: 'covenant relief', weight: 1.5 },
    { keyword: 'deleted and replaced', weight: 1.5 },
  ],
};

/**
 * Normalize text for keyword matching
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Count keyword occurrences with weighted scoring
 */
function calculateWeightedScore(
  normalizedText: string,
  keywords: KeywordWeight[]
): { score: number; matchedKeywords: string[]; hasExclusive: boolean } {
  let score = 0;
  const matchedKeywords: string[] = [];
  let hasExclusive = false;

  for (const { keyword, weight, exclusive } of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    // Count occurrences (capped at 3 to avoid over-counting)
    const regex = new RegExp(normalizedKeyword.replace(/\s+/g, '\\s+'), 'gi');
    const matches = normalizedText.match(regex);
    const count = Math.min(matches?.length || 0, 3);

    if (count > 0) {
      score += count * weight;
      matchedKeywords.push(keyword);
      if (exclusive) {
        hasExclusive = true;
      }
    }
  }

  return { score, matchedKeywords, hasExclusive };
}

/**
 * Detect document type from text content
 */
export function detectDocumentType(documentText: string): DocumentTypeDetection {
  const normalizedText = normalizeText(documentText);

  // Calculate scores for each template
  const templateScores: Array<{
    templateId: string;
    template: ExtractionTemplate;
    score: number;
    matchedKeywords: string[];
    hasExclusive: boolean;
  }> = [];

  for (const template of systemTemplates) {
    const keywords = templateKeywordWeights[template.id] || [];
    const { score, matchedKeywords, hasExclusive } = calculateWeightedScore(normalizedText, keywords);

    templateScores.push({
      templateId: template.id,
      template,
      score,
      matchedKeywords,
      hasExclusive,
    });
  }

  // Sort by score descending, preferring exclusive matches
  templateScores.sort((a, b) => {
    // If one has exclusive match and other doesn't, prefer exclusive
    if (a.hasExclusive && !b.hasExclusive) return -1;
    if (!a.hasExclusive && b.hasExclusive) return 1;
    // Otherwise sort by score
    return b.score - a.score;
  });

  const topMatch = templateScores[0];
  const totalScore = templateScores.reduce((sum, t) => sum + t.score, 0);

  // Calculate confidence as proportion of total score (normalized)
  const confidence = totalScore > 0 ? Math.min(topMatch.score / (totalScore * 0.5), 1) : 0;

  // Get alternative templates (those with >30% of top score)
  const alternatives = templateScores
    .slice(1)
    .filter((t) => t.score > 0 && t.score > topMatch.score * 0.3)
    .map((t) => ({
      templateId: t.templateId,
      confidence: totalScore > 0 ? Math.min(t.score / (totalScore * 0.5), 1) : 0,
      reason: `Matched ${t.matchedKeywords.length} keywords: ${t.matchedKeywords.slice(0, 3).join(', ')}${t.matchedKeywords.length > 3 ? '...' : ''}`,
    }));

  return {
    detectedType: topMatch.template.documentType,
    confidence: Math.round(confidence * 100) / 100,
    matchedKeywords: topMatch.matchedKeywords,
    recommendedTemplateId: topMatch.templateId,
    alternativeTemplates: alternatives,
  };
}

/**
 * Detect document type from file name (quick heuristic)
 */
export function detectFromFileName(fileName: string): LoanDocumentType | null {
  const normalizedName = fileName.toLowerCase();

  if (normalizedName.includes('amendment') || normalizedName.includes('amend')) {
    return 'amendment';
  }
  if (normalizedName.includes('revolver') || normalizedName.includes('revolving')) {
    return 'revolving_credit';
  }
  if (normalizedName.includes('term loan') || normalizedName.includes('termloan')) {
    return 'term_loan';
  }
  if (normalizedName.includes('bridge')) {
    return 'bridge_loan';
  }
  if (normalizedName.includes('syndicated') || normalizedName.includes('syndicate')) {
    return 'syndicated_facility';
  }

  return null;
}

/**
 * Combine file name and content detection for best accuracy
 */
export function detectDocumentTypeWithFileName(
  documentText: string,
  fileName: string
): DocumentTypeDetection {
  // First try content-based detection
  const contentDetection = detectDocumentType(documentText);

  // Check file name for hints
  const fileNameType = detectFromFileName(fileName);

  // If file name matches content detection, boost confidence
  if (fileNameType) {
    const matchingTemplate = systemTemplates.find((t) => t.documentType === fileNameType);
    if (matchingTemplate) {
      if (matchingTemplate.id === contentDetection.recommendedTemplateId) {
        // File name confirms content detection - boost confidence
        return {
          ...contentDetection,
          confidence: Math.min(contentDetection.confidence + 0.15, 1),
        };
      } else {
        // File name suggests different type - consider both
        // If file name type has reasonable content score, might prefer it
        const fileNameScore = contentDetection.alternativeTemplates.find(
          (t) => t.templateId === matchingTemplate.id
        );

        if (fileNameScore && fileNameScore.confidence > 0.3) {
          // File name type is also a reasonable match from content
          return {
            ...contentDetection,
            alternativeTemplates: [
              {
                templateId: matchingTemplate.id,
                confidence: fileNameScore.confidence + 0.1,
                reason: `File name suggests this type (${fileName})`,
              },
              ...contentDetection.alternativeTemplates.filter(
                (t) => t.templateId !== matchingTemplate.id
              ),
            ],
          };
        }
      }
    }
  }

  return contentDetection;
}

/**
 * Should auto-apply the detected template?
 */
export function shouldAutoApplyTemplate(detection: DocumentTypeDetection): boolean {
  const template = getTemplateById(detection.recommendedTemplateId);
  if (!template) return false;

  return detection.confidence >= template.autoApplyThreshold;
}

/**
 * Get human-readable description of detection result
 */
export function getDetectionDescription(detection: DocumentTypeDetection): string {
  const confidenceLevel =
    detection.confidence >= 0.8
      ? 'high'
      : detection.confidence >= 0.6
        ? 'moderate'
        : 'low';

  const keywordSummary =
    detection.matchedKeywords.length > 0
      ? `Based on keywords: ${detection.matchedKeywords.slice(0, 5).join(', ')}${detection.matchedKeywords.length > 5 ? '...' : ''}`
      : 'No strong keyword matches found';

  return `Detected ${detection.detectedType.replace(/_/g, ' ')} with ${confidenceLevel} confidence (${Math.round(detection.confidence * 100)}%). ${keywordSummary}`;
}
