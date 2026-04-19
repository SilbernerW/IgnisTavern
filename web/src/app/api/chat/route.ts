import { NextRequest, NextResponse } from 'next/server';
import { buildGMPrompt } from '@/lib/agents/gm';
import { streamChatCompletion } from '@/lib/llm';
import { ProviderId } from '@/lib/providers';

/**
 * Server-side chat API — ONLY used for the fallback (free) model.
 * User API keys are handled directly in the browser (see api.ts streamDirectFromBrowser).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, language, phase, provider, model } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid messages' },
        { status: 400 }
      );
    }

    // This endpoint only handles fallback — no user key accepted
    const apiKey = process.env.FALLBACK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No fallback API key configured on server. Please provide your own API key.' },
        { status: 401 }
      );
    }

    // Build system prompt
    const systemPrompt = buildGMPrompt(language || 'zh', phase || 'character_creation');

    const llmMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamChatCompletion(
            {
              apiKey,
              messages: llmMessages,
              model: model || undefined,
              provider: (provider as ProviderId) || undefined,
            },
            (chunk) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
              );
            },
            () => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
              );
              controller.close();
            }
          );
        } catch (error: any) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: error.message || 'Stream error' })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
