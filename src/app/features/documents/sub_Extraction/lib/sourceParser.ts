/**
 * Utilities for parsing field source references and calculating highlight regions
 */
import type { BoundingBox } from '../../lib/types';

export interface HighlightRegion {
  pageNumber: number;
  text?: string;
  // Bounding box coordinates as percentages (0-100) of the page
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ParsedSource {
  pageNumber: number;
  section?: string;
  line?: number;
  paragraph?: number;
}

/**
 * Parse a source string like "Page 5, Section 3.1" or "Page 78, Line 15"
 * into structured data including page number and section information.
 */
export function parseSourceString(source: string): ParsedSource {
  const result: ParsedSource = {
    pageNumber: 1,
  };

  // Extract page number - handles formats like:
  // "Page 1, Line 5", "Page 78, Section 7.1(a)", "Page 145, Section 12.1"
  const pageMatch = source.match(/Page\s*(\d+)/i);
  if (pageMatch) {
    result.pageNumber = parseInt(pageMatch[1], 10);
  }

  // Extract section reference
  const sectionMatch = source.match(/Section\s*([\d.]+(?:\([a-z]\))?)/i);
  if (sectionMatch) {
    result.section = sectionMatch[1];
  }

  // Extract line number
  const lineMatch = source.match(/Line\s*(\d+)/i);
  if (lineMatch) {
    result.line = parseInt(lineMatch[1], 10);
  }

  // Extract paragraph
  const paragraphMatch = source.match(/Paragraph\s*(\d+)/i);
  if (paragraphMatch) {
    result.paragraph = parseInt(paragraphMatch[1], 10);
  }

  return result;
}

/**
 * Calculate a highlight region for a field based on its source reference.
 * If a bounding box is provided, uses those precise coordinates.
 * Otherwise, generates plausible positions based on the source string.
 */
export function calculateHighlightRegion(
  source: string,
  fieldName: string,
  boundingBox?: BoundingBox
): HighlightRegion {
  const parsed = parseSourceString(source);

  // If bounding box is provided from extraction, use it directly
  if (boundingBox) {
    return {
      pageNumber: parsed.pageNumber,
      text: fieldName,
      x: boundingBox.x,
      y: boundingBox.y,
      width: boundingBox.width,
      height: boundingBox.height,
    };
  }

  // Generate deterministic but varied positions based on field name hash
  const hash = fieldName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Base Y position varies based on line/section/paragraph info
  let baseY = 20;
  if (parsed.line) {
    // Lines are roughly 3% of page height apart
    baseY = 15 + (parsed.line * 3) % 60;
  } else if (parsed.section) {
    // Sections are spread throughout the page
    const sectionNum = parseFloat(parsed.section.replace(/[^0-9.]/g, '')) || 1;
    baseY = 15 + ((sectionNum * 17) % 65);
  } else if (parsed.paragraph) {
    baseY = 15 + (parsed.paragraph * 8) % 70;
  }

  // Add some variation based on field name
  const yOffset = (hash % 10) - 5;
  const finalY = Math.max(5, Math.min(85, baseY + yOffset));

  return {
    pageNumber: parsed.pageNumber,
    text: fieldName,
    x: 5,
    y: finalY,
    width: 90,
    height: 8,
  };
}

/**
 * Get all unique page numbers from a set of extraction categories
 */
export function getUniquePages(categories: Array<{ fields: Array<{ source: string }> }>): number[] {
  const pages = new Set<number>();

  categories.forEach((category) => {
    category.fields.forEach((field) => {
      const parsed = parseSourceString(field.source);
      pages.add(parsed.pageNumber);
    });
  });

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Get the maximum page number referenced in the extraction data.
 * Used to determine total pages for the PDF preview.
 */
export function getMaxPageNumber(categories: Array<{ fields: Array<{ source: string }> }>): number {
  let maxPage = 1;

  categories.forEach((category) => {
    category.fields.forEach((field) => {
      const parsed = parseSourceString(field.source);
      if (parsed.pageNumber > maxPage) {
        maxPage = parsed.pageNumber;
      }
    });
  });

  // Add some buffer pages beyond the max referenced
  return Math.max(maxPage + 5, 150);
}
