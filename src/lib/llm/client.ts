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

export async function generateStructuredOutput<T>(
  systemPrompt: string,
  userMessage: string,
  options: LLMOptions = {}
): Promise<T> {
  const response = await generateCompletion(systemPrompt, userMessage, options);

  // Extract JSON from response
  const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : response;

  try {
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    // Try to find JSON object or array in the response
    const objectMatch = response.match(/\{[\s\S]*\}/);
    const arrayMatch = response.match(/\[[\s\S]*\]/);

    if (objectMatch) {
      return JSON.parse(objectMatch[0]) as T;
    }
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]) as T;
    }

    throw new Error(`Failed to parse LLM response as JSON: ${error}`);
  }
}
