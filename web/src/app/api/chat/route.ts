import { NextRequest, NextResponse } from 'next/server';
import { buildGMPrompt } from '@/lib/agents/gm';
import { streamChatCompletion } from '@/lib/llm';

// ── In-memory daily rate limit (per IP, resets at UTC midnight) ──
const dailyLimit = 10;
const usageMap = new Map<string, { count: number; date: string }>();

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  const entry = usageMap.get(ip);

  if (!entry || entry.date !== today) {
    usageMap.set(ip, { count: 1, date: today });
    return { allowed: true, remaining: dailyLimit - 1 };
  }

  if (entry.count >= dailyLimit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: dailyLimit - entry.count };
}

/**
 * Server-side chat API with auto provider fallback + daily rate limit.
 *
 * Priority (no user key):
 *   1. OpenRouter (MiniMax M2.5 free) — primary
 *   2. SiliconFlow (DeepSeek V3.2) — fallback
 *
 * Rate limit: 10 free requests per IP per day
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, language, phase, provider, model, userApiKey, customApiUrl } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid messages' }, { status: 400 });
    }

    // User's own key = no rate limit
    if (!userApiKey) {
      const ip = getClientIp(request);
      const { allowed, remaining } = checkRateLimit(ip);
      if (!allowed) {
        return NextResponse.json({
          error: 'daily_limit',
          remaining: 0,
          limit: dailyLimit,
          message: language === 'zh'
            ? `今日免费额度已用完（${dailyLimit}次/天）。请配置自己的 API Key 继续游戏！`
            : `Daily free limit reached (${dailyLimit}/day). Please configure your own API key to continue!`,
        }, { status: 429 });
      }
    }

    // Build system prompt (progressive loading — only includes files relevant to current phase)
    const currentPhase = (phase || 'character_creation') as any;
    const systemPrompt = buildGMPrompt(language || 'zh', currentPhase);

    // For the opening phase, inject a scene-trigger user message if this is the first turn
    // after character creation. This gives the model a clear signal to narrate the opening scene.
    const lang = language === 'zh' ? 'zh' : 'en';
    let llmMessages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Check if this is the very first user message in the opening phase
    // (character creation is now UI-driven, so the first message in opening
    // is always the trigger from the front-end)
    const userMessages = messages.filter(m => m.role === 'user');
    if (currentPhase === 'character_creation' && userMessages.length <= 1) {
      // First turn in character creation — inject welcome trigger
      const trigger = lang === 'zh'
        ? '开始游戏。请输出欢迎词。'
        : 'Start the game. Please output a welcome message.';
      llmMessages.push({ role: 'user', content: trigger });
    } else if (currentPhase === 'opening' && userMessages.length <= 1) {
      // First turn in opening phase — inject scene trigger as the user message
      const trigger = lang === 'zh'
        ? '角色已创建完成。请按照场景文件原文，开始第一幕开场叙事。'
        : 'Character creation is complete. Begin the Act I opening scene, using the scene file text verbatim.';
      llmMessages.push({ role: 'user', content: trigger });
    } else {
      llmMessages.push(...messages);
    }

    // Determine provider attempts
    const attempts: { apiKey: string; provider: string; model: string; customApiUrl?: string }[] = [];

    if (userApiKey) {
      attempts.push({
        apiKey: userApiKey,
        provider: provider || 'openrouter',
        model: model || 'minimax/minimax-m2.5:free',
        customApiUrl,
      });
    } else {
      const orKey = process.env.FALLBACK_API_KEY_OPENROUTER;
      const sfKey = process.env.FALLBACK_API_KEY_SILICONFLOW;

      if (orKey) {
        attempts.push({
          apiKey: orKey,
          provider: process.env.FALLBACK_PROVIDER || 'openrouter',
          model: process.env.FALLBACK_MODEL || 'minimax/minimax-m2.5:free',
        });
      }
      if (sfKey) {
        attempts.push({
          apiKey: sfKey,
          provider: process.env.FALLBACK_PROVIDER_2 || 'siliconflow',
          model: process.env.FALLBACK_MODEL_2 || 'deepseek-ai/DeepSeek-V3.2',
        });
      }
    }

    if (attempts.length === 0) {
      return NextResponse.json(
        { error: 'No API key available. Please provide your own API key.' },
        { status: 401 }
      );
    }

    // Try each provider, fallback on failure
    let lastError = '';
    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      const isLast = i === attempts.length - 1;

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

      // If last attempt, just return the stream directly
      if (isLast) {
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      }

      // For non-last attempts, collect and check for errors
      const chunks: string[] = [];
      let streamFailed = false;
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          for (const line of text.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.error) { streamFailed = true; lastError = parsed.error; }
              else if (parsed.content) chunks.push(parsed.content);
            } catch {}
          }
        }
      } catch { streamFailed = true; }

      if (!streamFailed && chunks.length > 0) {
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
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
        });
      }

      console.log(`Provider ${attempt.provider} failed: ${lastError}. Trying next...`);
    }

    return NextResponse.json({ error: lastError || 'All providers failed' }, { status: 502 });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
