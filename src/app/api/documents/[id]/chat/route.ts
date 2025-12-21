import { NextRequest, NextResponse } from 'next/server';
import { generateStructuredOutput } from '@/lib/llm';
import type { ApiResponse } from '@/types';
import type { DocumentChatResponse, DocumentChatMessage } from '@/app/features/documents/lib/types';

const DOCUMENT_CHAT_PROMPT = `You are an expert document analyst assistant helping users understand loan documents.

You are scoped to a specific document and should answer questions about:
- Extracted fields and their meanings
- Document structure and content
- Clarifications about specific terms, dates, or values
- Comparisons between different sections
- Verification of extracted data

Guidelines:
- Be specific and cite page numbers or sections when possible
- Explain financial and legal terms in plain language
- If you're unsure, say so and suggest what to look for
- Reference the document context in your answers

Respond in JSON format:
{
  "answer": "Your detailed answer...",
  "sources": [
    {
      "page": 1,
      "section": "Section 1.1 - Definitions",
      "excerpt": "Relevant text excerpt..."
    }
  ],
  "confidence": 0.85
}`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const body = await request.json();

    const { question, history } = body as {
      question: string;
      history?: DocumentChatMessage[];
    };

    if (!question || typeof question !== 'string') {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'question is required',
        },
      }, { status: 400 });
    }

    // Build conversation context from history
    let conversationContext = '';
    if (history && history.length > 0) {
      conversationContext = '\nPrevious conversation:\n';
      history.slice(-5).forEach((msg) => {
        conversationContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      conversationContext += '\n';
    }

    const userMessage = `Document ID: ${documentId}
${conversationContext}
User's Question: ${question}

Please provide a helpful answer about this document, citing specific pages or sections where relevant.`;

    const result = await generateStructuredOutput<DocumentChatResponse>(
      DOCUMENT_CHAT_PROMPT,
      userMessage,
      { temperature: 0.4 }
    );

    // Ensure sources have proper structure
    const sources = (result.sources || []).map(source => ({
      page: source.page || 1,
      section: source.section,
      excerpt: source.excerpt || '',
    }));

    const response: DocumentChatResponse = {
      answer: result.answer || 'I apologize, but I was unable to generate a response. Please try rephrasing your question.',
      sources,
      confidence: result.confidence || 0.5,
    };

    return NextResponse.json<ApiResponse<DocumentChatResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error in document chat:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while processing your question',
      },
    }, { status: 500 });
  }
}
