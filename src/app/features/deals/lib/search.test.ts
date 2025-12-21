import { describe, it, expect } from 'vitest';
import {
  normalizeSearchQuery,
  isEmptyQuery,
  matchesDealName,
  searchDeals,
  createSearchPredicate,
} from './search';

/**
 * Deal Search Behavior Tests
 *
 * These tests serve as living documentation of the intended search behavior.
 * They explicitly cover edge cases and prevent regression.
 *
 * DESIGN DECISIONS DOCUMENTED BY THESE TESTS:
 * 1. Search only matches deal_name, NOT description (intentional)
 * 2. Empty/whitespace queries match all deals
 * 3. Special characters are matched literally (no regex)
 * 4. Case-insensitive matching
 * 5. Partial substring matching
 */

// Test fixtures
const mockDeals = [
  { deal_name: 'Project Apollo - Term Loan Facility', description: 'USD 500M term loan' },
  { deal_name: 'XYZ Corp - Amendment No. 2', description: 'Covenant modifications' },
  { deal_name: 'Neptune Holdings - Refinancing', description: 'Complete refinancing' },
  { deal_name: 'Delta Corp - Consent Request', description: 'Dividend distribution consent' },
  { deal_name: 'Omega Group - Extension', description: 'Two-year maturity extension' },
];

describe('normalizeSearchQuery', () => {
  describe('handles null/undefined', () => {
    it('returns empty string for null', () => {
      expect(normalizeSearchQuery(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(normalizeSearchQuery(undefined)).toBe('');
    });
  });

  describe('trims whitespace', () => {
    it('trims leading spaces', () => {
      expect(normalizeSearchQuery('   apollo')).toBe('apollo');
    });

    it('trims trailing spaces', () => {
      expect(normalizeSearchQuery('apollo   ')).toBe('apollo');
    });

    it('trims both leading and trailing spaces', () => {
      expect(normalizeSearchQuery('   apollo   ')).toBe('apollo');
    });

    it('handles tabs and newlines', () => {
      expect(normalizeSearchQuery('\t\napollo\n\t')).toBe('apollo');
    });
  });

  describe('lowercases query', () => {
    it('converts uppercase to lowercase', () => {
      expect(normalizeSearchQuery('APOLLO')).toBe('apollo');
    });

    it('converts mixed case to lowercase', () => {
      expect(normalizeSearchQuery('ApOlLo')).toBe('apollo');
    });
  });

  describe('preserves special characters', () => {
    it('preserves hyphens', () => {
      expect(normalizeSearchQuery('term-loan')).toBe('term-loan');
    });

    it('preserves periods', () => {
      expect(normalizeSearchQuery('No. 2')).toBe('no. 2');
    });

    it('preserves parentheses', () => {
      expect(normalizeSearchQuery('(test)')).toBe('(test)');
    });

    it('preserves regex metacharacters without escaping', () => {
      expect(normalizeSearchQuery('.*+?^${}()|[]')).toBe('.*+?^${}()|[]');
    });
  });
});

describe('isEmptyQuery', () => {
  it('returns true for empty string', () => {
    expect(isEmptyQuery('')).toBe(true);
  });

  it('returns true for null', () => {
    expect(isEmptyQuery(null)).toBe(true);
  });

  it('returns true for undefined', () => {
    expect(isEmptyQuery(undefined)).toBe(true);
  });

  it('returns true for whitespace-only string', () => {
    expect(isEmptyQuery('   ')).toBe(true);
  });

  it('returns true for tabs-only string', () => {
    expect(isEmptyQuery('\t\t')).toBe(true);
  });

  it('returns true for newlines-only string', () => {
    expect(isEmptyQuery('\n\n')).toBe(true);
  });

  it('returns true for mixed whitespace', () => {
    expect(isEmptyQuery('  \t  \n  ')).toBe(true);
  });

  it('returns false for single character', () => {
    expect(isEmptyQuery('a')).toBe(false);
  });

  it('returns false for single space with character', () => {
    expect(isEmptyQuery(' a ')).toBe(false);
  });
});

describe('matchesDealName', () => {
  describe('case-insensitive matching', () => {
    it('matches lowercase query against mixed case name', () => {
      expect(matchesDealName('Project Apollo', 'apollo')).toBe(true);
    });

    it('matches when query is uppercase (should be normalized first)', () => {
      // Note: normalizedQuery should already be lowercase
      expect(matchesDealName('Project Apollo', 'APOLLO'.toLowerCase())).toBe(true);
    });
  });

  describe('substring matching', () => {
    it('matches at start of name', () => {
      expect(matchesDealName('Project Apollo', 'project')).toBe(true);
    });

    it('matches in middle of name', () => {
      expect(matchesDealName('Project Apollo', 'apollo')).toBe(true);
    });

    it('matches at end of name', () => {
      expect(matchesDealName('Term Loan Facility', 'facility')).toBe(true);
    });

    it('matches partial words', () => {
      expect(matchesDealName('Project Apollo', 'apo')).toBe(true);
    });

    it('matches across word boundaries', () => {
      expect(matchesDealName('XYZ Corp - Amendment', 'corp - am')).toBe(true);
    });
  });

  describe('empty query handling', () => {
    it('returns true for empty string query (matches all)', () => {
      expect(matchesDealName('Any Deal Name', '')).toBe(true);
    });
  });

  describe('no match cases', () => {
    it('returns false when query is not in name', () => {
      expect(matchesDealName('Project Apollo', 'xyz')).toBe(false);
    });

    it('returns false for similar but different text', () => {
      expect(matchesDealName('Project Apollo', 'apolo')).toBe(false);
    });
  });
});

describe('searchDeals', () => {
  describe('SPEC: Search Scope - deal_name only', () => {
    it('matches deals by deal_name', () => {
      const results = searchDeals(mockDeals, 'Apollo');
      expect(results).toHaveLength(1);
      expect(results[0].deal_name).toContain('Apollo');
    });

    it('does NOT match deals by description (intentional)', () => {
      // "500M" is in description but not in deal_name
      const results = searchDeals(mockDeals, '500M');
      expect(results).toHaveLength(0);
    });

    it('does NOT match deals by description keyword', () => {
      // "Dividend" is in description of Delta Corp but not in deal_name
      const results = searchDeals(mockDeals, 'Dividend');
      expect(results).toHaveLength(0);
    });
  });

  describe('SPEC: Empty/Whitespace Query Handling', () => {
    it('empty string returns all deals', () => {
      const results = searchDeals(mockDeals, '');
      expect(results).toHaveLength(mockDeals.length);
    });

    it('null returns all deals', () => {
      const results = searchDeals(mockDeals, null);
      expect(results).toHaveLength(mockDeals.length);
    });

    it('undefined returns all deals', () => {
      const results = searchDeals(mockDeals, undefined);
      expect(results).toHaveLength(mockDeals.length);
    });

    it('single space returns all deals', () => {
      const results = searchDeals(mockDeals, ' ');
      expect(results).toHaveLength(mockDeals.length);
    });

    it('multiple spaces return all deals', () => {
      const results = searchDeals(mockDeals, '     ');
      expect(results).toHaveLength(mockDeals.length);
    });

    it('tabs return all deals', () => {
      const results = searchDeals(mockDeals, '\t\t');
      expect(results).toHaveLength(mockDeals.length);
    });

    it('newlines return all deals', () => {
      const results = searchDeals(mockDeals, '\n\n');
      expect(results).toHaveLength(mockDeals.length);
    });

    it('mixed whitespace returns all deals', () => {
      const results = searchDeals(mockDeals, '  \t  \n  ');
      expect(results).toHaveLength(mockDeals.length);
    });
  });

  describe('SPEC: Case-Insensitive Matching', () => {
    it('lowercase query matches uppercase in name', () => {
      const results = searchDeals(mockDeals, 'xyz');
      expect(results).toHaveLength(1);
      expect(results[0].deal_name).toContain('XYZ');
    });

    it('uppercase query matches lowercase in name', () => {
      const results = searchDeals(mockDeals, 'CORP');
      expect(results).toHaveLength(2); // XYZ Corp and Delta Corp
    });

    it('mixed case query works', () => {
      const results = searchDeals(mockDeals, 'NePtUnE');
      expect(results).toHaveLength(1);
      expect(results[0].deal_name).toContain('Neptune');
    });
  });

  describe('SPEC: Special Character Handling (Literal Match)', () => {
    it('hyphen is matched literally', () => {
      // All deals contain "-" in their names
      const results = searchDeals(mockDeals, '-');
      expect(results).toHaveLength(mockDeals.length);
    });

    it('period is matched literally', () => {
      // "No. 2" is in XYZ Corp deal name
      const results = searchDeals(mockDeals, 'No.');
      expect(results).toHaveLength(1);
      expect(results[0].deal_name).toContain('No. 2');
    });

    it('regex metacharacter is matched literally, not as regex', () => {
      // Searching for ".*" should NOT match all (no regex interpretation)
      const results = searchDeals(mockDeals, '.*');
      expect(results).toHaveLength(0);
    });

    it('asterisk is matched literally', () => {
      const deals = [{ deal_name: 'Test * Deal' }];
      const results = searchDeals(deals, '*');
      expect(results).toHaveLength(1);
    });

    it('question mark is matched literally', () => {
      const deals = [{ deal_name: 'Test ? Deal' }];
      const results = searchDeals(deals, '?');
      expect(results).toHaveLength(1);
    });

    it('brackets are matched literally', () => {
      const deals = [{ deal_name: 'Test [A] Deal' }];
      const results = searchDeals(deals, '[A]');
      expect(results).toHaveLength(1);
    });

    it('parentheses are matched literally', () => {
      const deals = [{ deal_name: 'Test (Group) Deal' }];
      const results = searchDeals(deals, '(Group)');
      expect(results).toHaveLength(1);
    });
  });

  describe('SPEC: Single Character Queries', () => {
    it('single letter matches', () => {
      // "a" appears in Project Apollo, Delta, Omega
      const results = searchDeals(mockDeals, 'a');
      expect(results.length).toBeGreaterThan(0);
    });

    it('single number matches', () => {
      const results = searchDeals(mockDeals, '2');
      expect(results).toHaveLength(1);
      expect(results[0].deal_name).toContain('No. 2');
    });

    it('single special character matches', () => {
      const results = searchDeals(mockDeals, '-');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('SPEC: Empty Results (No Match)', () => {
    it('returns empty array when no deals match', () => {
      const results = searchDeals(mockDeals, 'NonExistentDeal12345');
      expect(results).toEqual([]);
    });

    it('returns empty array for typo in query', () => {
      const results = searchDeals(mockDeals, 'Apolo'); // Missing 'l'
      expect(results).toEqual([]);
    });
  });

  describe('SPEC: Query with Leading/Trailing Whitespace', () => {
    it('leading spaces are trimmed', () => {
      const results = searchDeals(mockDeals, '   apollo');
      expect(results).toHaveLength(1);
    });

    it('trailing spaces are trimmed', () => {
      const results = searchDeals(mockDeals, 'apollo   ');
      expect(results).toHaveLength(1);
    });

    it('both leading and trailing spaces are trimmed', () => {
      const results = searchDeals(mockDeals, '   apollo   ');
      expect(results).toHaveLength(1);
    });
  });

  describe('multiple word queries', () => {
    it('matches exact multi-word substring', () => {
      const results = searchDeals(mockDeals, 'Project Apollo');
      expect(results).toHaveLength(1);
    });

    it('matches partial multi-word substring', () => {
      const results = searchDeals(mockDeals, 'XYZ Corp');
      expect(results).toHaveLength(1);
    });

    it('spaces in query must match spaces in name', () => {
      // "ProjectApollo" without space should NOT match "Project Apollo"
      const results = searchDeals(mockDeals, 'ProjectApollo');
      expect(results).toHaveLength(0);
    });
  });

  describe('edge case: empty deals array', () => {
    it('returns empty array when deals array is empty', () => {
      const results = searchDeals([], 'apollo');
      expect(results).toEqual([]);
    });

    it('returns empty array for empty query on empty deals', () => {
      const results = searchDeals([], '');
      expect(results).toEqual([]);
    });
  });
});

describe('createSearchPredicate', () => {
  it('returns a function', () => {
    const predicate = createSearchPredicate('apollo');
    expect(typeof predicate).toBe('function');
  });

  it('predicate returns true for matching deals', () => {
    const predicate = createSearchPredicate('apollo');
    expect(predicate(mockDeals[0])).toBe(true);
  });

  it('predicate returns false for non-matching deals', () => {
    const predicate = createSearchPredicate('apollo');
    expect(predicate(mockDeals[1])).toBe(false);
  });

  it('empty query predicate matches all', () => {
    const predicate = createSearchPredicate('');
    mockDeals.forEach(deal => {
      expect(predicate(deal)).toBe(true);
    });
  });

  it('null query predicate matches all', () => {
    const predicate = createSearchPredicate(null);
    mockDeals.forEach(deal => {
      expect(predicate(deal)).toBe(true);
    });
  });

  it('can be used with Array.filter', () => {
    const predicate = createSearchPredicate('corp');
    const results = mockDeals.filter(predicate);
    expect(results).toHaveLength(2); // XYZ Corp and Delta Corp
  });
});
