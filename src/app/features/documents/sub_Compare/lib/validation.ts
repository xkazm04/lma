
/**
 * Validation rules for document comparison
 */

/**
 * Checks if two documents can be compared.
 * Rules:
 * - Must be different documents (different IDs)
 * - Must strictly differ (doc1 !== doc2)
 */
export function isValidDocumentPair(doc1Id: string, doc2Id: string): boolean {
    if (!doc1Id || !doc2Id) return false;
    return doc1Id !== doc2Id;
}
