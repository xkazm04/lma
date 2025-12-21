/**
 * LLM Response Parsing Tests
 *
 * These tests serve as living documentation of how LLM JSON responses are parsed.
 * They cover the many formats Claude may return and ensure reliable extraction.
 *
 * DESIGN DECISIONS DOCUMENTED BY THESE TESTS:
 * 1. Direct JSON (no wrapping) is parsed first for efficiency
 * 2. Markdown code fences (```json, ```, ```JSON) are stripped before parsing
 * 3. JSON embedded in surrounding explanatory text is extracted
 * 4. Nested objects with escaped quotes and braces in strings are handled correctly
 * 5. When multiple JSON objects exist, the first valid one is returned
 * 6. Empty, null, undefined inputs throw "Invalid response" error
 * 7. Plain text without JSON throws "Failed to parse LLM response as JSON"
 * 8. Malformed/truncated JSON throws parsing error (no silent failures)
 * 9. Unicode characters and emoji in JSON strings are preserved
 * 10. Newline escapes (\n) within JSON string values are correctly unescaped
 * 11. Real-world ESG and KPI response formats are validated for production use
 */

import { describe, it, expect } from 'vitest';
import { parseJSONFromLLMResponse } from './client';

describe('parseJSONFromLLMResponse', () => {
  describe('direct JSON parsing', () => {
    it('parses valid JSON object directly', () => {
      const response = '{"name": "test", "value": 123}';
      const result = parseJSONFromLLMResponse<{ name: string; value: number }>(response);
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('parses valid JSON array directly', () => {
      const response = '[1, 2, 3]';
      const result = parseJSONFromLLMResponse<number[]>(response);
      expect(result).toEqual([1, 2, 3]);
    });

    it('handles whitespace around JSON', () => {
      const response = '  \n  {"key": "value"}  \n  ';
      const result = parseJSONFromLLMResponse<{ key: string }>(response);
      expect(result).toEqual({ key: 'value' });
    });
  });

  describe('markdown fence stripping', () => {
    it('extracts JSON from ```json code block', () => {
      const response = '```json\n{"status": "success"}\n```';
      const result = parseJSONFromLLMResponse<{ status: string }>(response);
      expect(result).toEqual({ status: 'success' });
    });

    it('extracts JSON from ```JSON code block (uppercase)', () => {
      const response = '```JSON\n{"status": "success"}\n```';
      const result = parseJSONFromLLMResponse<{ status: string }>(response);
      expect(result).toEqual({ status: 'success' });
    });

    it('extracts JSON from bare ``` code block', () => {
      const response = '```\n{"data": [1, 2, 3]}\n```';
      const result = parseJSONFromLLMResponse<{ data: number[] }>(response);
      expect(result).toEqual({ data: [1, 2, 3] });
    });

    it('handles markdown with surrounding text', () => {
      const response = 'Here is the JSON:\n\n```json\n{"result": true}\n```\n\nLet me know if you need anything else.';
      const result = parseJSONFromLLMResponse<{ result: boolean }>(response);
      expect(result).toEqual({ result: true });
    });

    it('handles code block with no newline after language', () => {
      const response = '```json{"inline": true}```';
      const result = parseJSONFromLLMResponse<{ inline: boolean }>(response);
      expect(result).toEqual({ inline: true });
    });
  });

  describe('text before and after JSON', () => {
    it('extracts JSON with preceding explanation', () => {
      const response = 'Based on my analysis, here is the result:\n{"answer": 42, "confidence": 0.95}';
      const result = parseJSONFromLLMResponse<{ answer: number; confidence: number }>(response);
      expect(result).toEqual({ answer: 42, confidence: 0.95 });
    });

    it('extracts JSON with trailing explanation', () => {
      const response = '{"status": "complete", "items": 5}\n\nThis shows that all 5 items were processed successfully.';
      const result = parseJSONFromLLMResponse<{ status: string; items: number }>(response);
      expect(result).toEqual({ status: 'complete', items: 5 });
    });

    it('extracts JSON with both preceding and trailing text', () => {
      const response = 'Analysis:\n{"risk": "low", "score": 85}\nRecommendation: Proceed with caution.';
      const result = parseJSONFromLLMResponse<{ risk: string; score: number }>(response);
      expect(result).toEqual({ risk: 'low', score: 85 });
    });
  });

  describe('nested JSON structures', () => {
    it('handles deeply nested objects', () => {
      const response = '{"outer": {"middle": {"inner": {"value": "deep"}}}}';
      const result = parseJSONFromLLMResponse<{ outer: { middle: { inner: { value: string } } } }>(response);
      expect(result.outer.middle.inner.value).toBe('deep');
    });

    it('handles nested arrays and objects', () => {
      const response = '{"data": [{"id": 1}, {"id": 2}], "meta": {"total": 2}}';
      const result = parseJSONFromLLMResponse<{ data: { id: number }[]; meta: { total: number } }>(response);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('handles strings containing braces', () => {
      const response = '{"template": "function() { return {x: 1}; }", "count": 1}';
      const result = parseJSONFromLLMResponse<{ template: string; count: number }>(response);
      expect(result.template).toBe('function() { return {x: 1}; }');
      expect(result.count).toBe(1);
    });

    it('handles escaped quotes in strings', () => {
      const response = '{"message": "He said \\"hello\\"", "valid": true}';
      const result = parseJSONFromLLMResponse<{ message: string; valid: boolean }>(response);
      expect(result.message).toBe('He said "hello"');
      expect(result.valid).toBe(true);
    });
  });

  describe('real-world LLM response patterns', () => {
    it('handles ESG analysis response format', () => {
      const response = `Based on the facility data, here's my analysis:

\`\`\`json
{
  "overall_status": "at_risk",
  "kpi_gaps": [
    {
      "kpi_name": "Carbon Emissions",
      "current_gap": 15000,
      "gap_percentage": 12.5,
      "risk_level": "high",
      "recommendations": ["Increase renewable energy usage", "Optimize transportation"]
    }
  ],
  "priority_actions": [
    {
      "action": "Review emissions data",
      "urgency": "immediate",
      "impact": "high"
    }
  ]
}
\`\`\`

Let me know if you need more details on any specific KPI.`;

      interface ESGResponse {
        overall_status: string;
        kpi_gaps: Array<{
          kpi_name: string;
          current_gap: number;
          gap_percentage: number;
          risk_level: string;
          recommendations: string[];
        }>;
        priority_actions: Array<{
          action: string;
          urgency: string;
          impact: string;
        }>;
      }

      const result = parseJSONFromLLMResponse<ESGResponse>(response);
      expect(result.overall_status).toBe('at_risk');
      expect(result.kpi_gaps).toHaveLength(1);
      expect(result.kpi_gaps[0].kpi_name).toBe('Carbon Emissions');
      expect(result.priority_actions[0].urgency).toBe('immediate');
    });

    it('handles KPI prediction response', () => {
      const response = `{
  "kpi_predictions": [
    {
      "kpi_name": "GHG Emissions",
      "current_value": 50000,
      "predicted_value": 48000,
      "confidence": "high",
      "trend": "improving"
    }
  ],
  "margin_impact": {
    "predicted_adjustment_bps": -10,
    "financial_impact": {
      "annual_interest_cost_change": -25000
    }
  }
}`;

      interface PredictionResponse {
        kpi_predictions: Array<{
          kpi_name: string;
          current_value: number;
          predicted_value: number;
          confidence: string;
          trend: string;
        }>;
        margin_impact: {
          predicted_adjustment_bps: number;
          financial_impact: {
            annual_interest_cost_change: number;
          };
        };
      }

      const result = parseJSONFromLLMResponse<PredictionResponse>(response);
      expect(result.kpi_predictions[0].trend).toBe('improving');
      expect(result.margin_impact.predicted_adjustment_bps).toBe(-10);
    });
  });

  describe('edge cases and error handling', () => {
    it('throws on empty string', () => {
      expect(() => parseJSONFromLLMResponse('')).toThrow('Invalid response');
    });

    it('throws on null input', () => {
      expect(() => parseJSONFromLLMResponse(null as unknown as string)).toThrow('Invalid response');
    });

    it('throws on undefined input', () => {
      expect(() => parseJSONFromLLMResponse(undefined as unknown as string)).toThrow('Invalid response');
    });

    it('throws on non-JSON text', () => {
      expect(() => parseJSONFromLLMResponse('This is just plain text without any JSON')).toThrow(
        'Failed to parse LLM response as JSON'
      );
    });

    it('throws on malformed JSON', () => {
      expect(() => parseJSONFromLLMResponse('{invalid: json}')).toThrow(
        'Failed to parse LLM response as JSON'
      );
    });

    it('throws on truncated JSON', () => {
      expect(() => parseJSONFromLLMResponse('{"incomplete": ')).toThrow(
        'Failed to parse LLM response as JSON'
      );
    });

    it('handles JSON with Unicode characters', () => {
      const response = '{"greeting": "こんにちは", "emoji": "🎉"}';
      const result = parseJSONFromLLMResponse<{ greeting: string; emoji: string }>(response);
      expect(result.greeting).toBe('こんにちは');
      expect(result.emoji).toBe('🎉');
    });

    it('handles newlines within JSON strings', () => {
      const response = '{"text": "line1\\nline2\\nline3"}';
      const result = parseJSONFromLLMResponse<{ text: string }>(response);
      expect(result.text).toBe('line1\nline2\nline3');
    });

    it('handles multiple JSON objects and returns the first valid one', () => {
      const response = 'First object: {"a": 1}\nSecond object: {"b": 2}';
      const result = parseJSONFromLLMResponse<{ a: number }>(response);
      expect(result).toEqual({ a: 1 });
    });
  });

  describe('problematic patterns that caused bugs', () => {
    it('handles JSON followed by explanation with braces in text', () => {
      // This pattern was causing issues with greedy regex
      const response = '{"result": "success"}\n\nNote: The function() { return x; } pattern is common.';
      const result = parseJSONFromLLMResponse<{ result: string }>(response);
      expect(result).toEqual({ result: 'success' });
    });

    it('handles markdown JSON with explanation containing JSON-like text', () => {
      const response = `\`\`\`json
{"data": true}
\`\`\`

For example, you might see responses like {"error": true} in error cases.`;
      const result = parseJSONFromLLMResponse<{ data: boolean }>(response);
      expect(result).toEqual({ data: true });
    });
  });
});
