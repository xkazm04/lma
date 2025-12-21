import Anthropic from '@anthropic-ai/sdk';

// Initialize the Anthropic client
// The SDK automatically reads from ANTHROPIC_API_KEY environment variable
let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic();
  }
  return anthropicClient;
}

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TEMPERATURE = 0.3;

export async function generateCompletion(
  systemPrompt: string,
  userMessage: string,
  options: LLMOptions = {}
): Promise<string> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: options.model || DEFAULT_MODEL,
    max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
    temperature: options.temperature || DEFAULT_TEMPERATURE,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  // Extract text from response
  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from LLM');
  }

  return textBlock.text;
}

/**
 * Strip markdown code fences from LLM response.
 * Handles various formats: ```json, ```, ```javascript, etc.
 */
function stripMarkdownFences(text: string): string {
  // Match markdown code blocks with any language specifier or none
  // Supports: ```json\n...\n```, ```\n...\n```, etc.
  const fenceMatch = text.match(/```(?:json|JSON|javascript|js)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  return text.trim();
}

/**
 * Find balanced JSON structure starting at a given position.
 * Returns the JSON string if found, or null if not balanced.
 */
function extractBalancedJSON(text: string, startChar: '{' | '['): string | null {
  const endChar = startChar === '{' ? '}' : ']';
  const startIndex = text.indexOf(startChar);

  if (startIndex === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === startChar || char === (startChar === '{' ? '[' : '{')) {
        // Handle nested structures of opposite type too
        if (char === startChar) {
          depth++;
        }
      } else if (char === endChar || char === (endChar === '}' ? ']' : '}')) {
        if (char === endChar) {
          depth--;
          if (depth === 0) {
            return text.slice(startIndex, i + 1);
          }
        }
      }
    }
  }

  return null;
}

/**
 * Validate that a string is valid JSON and return parsed result.
 * Returns null if parsing fails.
 */
function tryParseJSON<T>(text: string): T | null {
  try {
    const trimmed = text.trim();
    if (!trimmed) {
      return null;
    }
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

/**
 * Extract JSON from LLM response text using multiple strategies:
 * 1. Strip markdown fences and try direct parse
 * 2. Look for ```json code blocks specifically
 * 3. Extract balanced JSON object
 * 4. Extract balanced JSON array
 * 5. Fall back to greedy extraction as last resort
 *
 * This implementation handles:
 * - Markdown-wrapped JSON (```json ... ```)
 * - JSON with trailing explanations
 * - Nested JSON structures
 * - JSON preceded by explanatory text
 */
export function parseJSONFromLLMResponse<T>(response: string): T {
  if (!response || typeof response !== 'string') {
    throw new Error('Invalid response: expected non-empty string');
  }

  // Strategy 1: Strip markdown fences first and try direct parse
  const stripped = stripMarkdownFences(response);
  const directParse = tryParseJSON<T>(stripped);
  if (directParse !== null) {
    return directParse;
  }

  // Strategy 2: Try parsing the original response directly (already valid JSON)
  const originalParse = tryParseJSON<T>(response.trim());
  if (originalParse !== null) {
    return originalParse;
  }

  // Strategy 3: Extract balanced JSON object (handles text before/after JSON)
  const balancedObject = extractBalancedJSON(stripped, '{');
  if (balancedObject) {
    const objectParse = tryParseJSON<T>(balancedObject);
    if (objectParse !== null) {
      return objectParse;
    }
  }

  // Strategy 4: Extract balanced JSON array
  const balancedArray = extractBalancedJSON(stripped, '[');
  if (balancedArray) {
    const arrayParse = tryParseJSON<T>(balancedArray);
    if (arrayParse !== null) {
      return arrayParse;
    }
  }

  // Strategy 5: Try from original response (in case stripping removed too much)
  const balancedObjectOriginal = extractBalancedJSON(response, '{');
  if (balancedObjectOriginal && balancedObjectOriginal !== balancedObject) {
    const objectParse = tryParseJSON<T>(balancedObjectOriginal);
    if (objectParse !== null) {
      return objectParse;
    }
  }

  // Strategy 6: Fall back to greedy regex as last resort (non-greedy won't work here)
  // This handles malformed responses where balanced extraction failed
  const greedyObjectMatch = response.match(/\{[\s\S]*\}/);
  if (greedyObjectMatch) {
    const greedyParse = tryParseJSON<T>(greedyObjectMatch[0]);
    if (greedyParse !== null) {
      return greedyParse;
    }
  }

  const greedyArrayMatch = response.match(/\[[\s\S]*\]/);
  if (greedyArrayMatch) {
    const greedyParse = tryParseJSON<T>(greedyArrayMatch[0]);
    if (greedyParse !== null) {
      return greedyParse;
    }
  }

  throw new Error('Failed to parse LLM response as JSON. Response may not contain valid JSON structure.');
}

export async function generateStructuredOutput<T>(
  systemPrompt: string,
  userMessage: string,
  options: LLMOptions = {}
): Promise<T> {
  const response = await generateCompletion(systemPrompt, userMessage, options);
  return parseJSONFromLLMResponse<T>(response);
}

/**
 * LLM error metadata for logging and fallback generation
 */
export interface LLMErrorContext {
  error: Error;
  errorCode?: string;
  timestamp: string;
  operation: string;
}

/**
 * Configuration for withLLMFallback wrapper
 */
export interface LLMFallbackConfig<TResult, TContext> {
  /** Human-readable name for logging */
  operation: string;
  /** Function to generate fallback result when LLM fails */
  fallbackFactory: (context: TContext, errorContext: LLMErrorContext) => TResult;
  /** Optional callback for error logging/monitoring */
  onError?: (errorContext: LLMErrorContext, inputContext: TContext) => void;
}

/**
 * Generic wrapper for LLM functions that provides consistent error handling,
 * logging, and fallback generation when the Claude API fails or is unavailable.
 *
 * @example
 * ```ts
 * const result = await withLLMFallback(
 *   () => generateStructuredOutput<MyType>(systemPrompt, userPrompt),
 *   myInputContext,
 *   {
 *     operation: 'answerESGQuestion',
 *     fallbackFactory: (ctx, err) => ({
 *       question: ctx.question,
 *       answer: 'Unable to process',
 *       confidence: 0,
 *     }),
 *   }
 * );
 * ```
 */
export async function withLLMFallback<TResult, TContext>(
  llmFn: () => Promise<TResult>,
  context: TContext,
  config: LLMFallbackConfig<TResult, TContext>
): Promise<TResult> {
  try {
    return await llmFn();
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));

    // Extract error code if available (Anthropic API errors)
    let errorCode: string | undefined;
    if (error && typeof error === 'object' && 'status' in error) {
      errorCode = String((error as { status?: number }).status);
    }

    const errorContext: LLMErrorContext = {
      error: errorObj,
      errorCode,
      timestamp: new Date().toISOString(),
      operation: config.operation,
    };

    // Log the error for monitoring
    console.error(`[LLM Fallback] ${config.operation} failed:`, {
      message: errorObj.message,
      code: errorCode,
      timestamp: errorContext.timestamp,
    });

    // Call optional error callback for custom logging/monitoring
    if (config.onError) {
      config.onError(errorContext, context);
    }

    // Generate and return fallback
    return config.fallbackFactory(context, errorContext);
  }
}
