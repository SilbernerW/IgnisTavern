import { NextRequest, NextResponse } from 'next/server';
import { buildGMPrompt } from '@/lib/agents/gm';
import { streamChatCompletion } from '@/lib/llm';

/**
 * Server-side chat API with automatic provider fallback.
 *
 * Priority:
 *   1. User's own API key (if provided)
 *   2. SiliconFlow (DeepSeek V3.2) — primary fallback
 *   3. OpenRouter (MiniMax M2.5 free) — secondary fallback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, language, phase, provider, model, userApiKey, customApiUrl } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid messages' }, { status: 400 });
    }

    // Build system prompt (same for all providers)
    const systemPrompt = buildGMPrompt(language || 'zh', (phase || 'character_creation') as any);
    const llmMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    // Determine which provider(s) to try
    const attempts: { apiKey: string; provider: string; model: string; customApiUrl?: string }[] = [];

    if (userApiKey) {
      // User's own key — try it directly
      attempts.push({
        apiKey: userApiKey,
        provider: provider || 'openrouter',
        model: model || 'minimax/minimax-m2.5:free',
        customApiUrl,
      });
    } else {
      // No user key — try primary then secondary fallback
      const sfKey = process.env.FALLBACK_API_KEY_SILICONFLOW;
      const orKey = process.env.FALLBACK_API_KEY_OPENROUTER;

      if (sfKey) {
        attempts.push({
          apiKey: sfKey,
          provider: process.env.FALLBACK_PROVIDER || 'siliconflow',
          model: process.env.FALLBACK_MODEL || 'deepseek-ai/DeepSeek-V3.2',
        });
      }
      if (orKey) {
        attempts.push({
          apiKey: orKey,
          provider: process.env.FALLBACK_PROVIDER_2 || 'openrouter',
          model: process.env.FALLBACK_MODEL_2 || 'minimax/minimax-m2.5:free',
        });
      }
    }

    if (attempts.length === 0) {
      return NextResponse.json(
        { error: 'No API key available. Please provide your own API key.' },
        { status: 401 }
      );
    }

    // Try each provider in order, fallback on failure
    let lastError = '';
    for (const attempt of attempts) {
      const encoder = new TextEncoder();
      let hasContent = false;
      let streamError = '';

      const stream = new ReadableStream({
        async start(controller) {
          try {
            await streamChatCompletion(
              {
                apiKey: attempt.apiKey,
                messages: llmMessages,
                model: attempt.model,
                provider: attempt.provider as any,
                customApiUrl: attempt.customApiUrl,
              },
              (chunk) => {
                hasContent = true;
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
            streamError = error.message || 'Stream error';
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: streamError })}\n\n`)
            );
            controller.close();
          }
        },
      });

      // If this is the last attempt or it succeeded, return the stream
      if (attempts.indexOf(attempt) === attempts.length - 1) {
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      }

      // For non-last attempts, collect the stream and check for errors
      // If error, try next provider; if success, return the collected content
      const chunks: string[] = [];
      let streamFailed = false;

      const reader = stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                streamFailed = true;
                lastError = parsed.error;
              } else if (parsed.content) {
                chunks.push(parsed.content);
              }
            } catch {}
          }
        }
      } catch {
        streamFailed = true;
      }

      if (!streamFailed && chunks.length > 0) {
        // Success! Return the collected chunks as a new stream
        const resultStream = new ReadableStream({
          start(controller) {
            const enc = new TextEncoder();
            for (const chunk of chunks) {
              controller.enqueue(enc.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
            }
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            controller.close();
          },
        });
        return new Response(resultStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      }

      // Failed — try next provider
      console.log(`Provider ${attempt.provider} failed: ${lastError}. Trying next...`);
    }

    // All providers failed
    return NextResponse.json(
      { error: lastError || 'All providers failed' },
      { status: 502 }
    );
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
