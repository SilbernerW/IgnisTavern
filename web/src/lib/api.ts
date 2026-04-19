import { ChatMessage } from './gameState';
import { PROVIDERS, ProviderId, detectProvider } from './providers';
import { streamAnthropicBrowser } from './llm-browser';

import type { GamePhase } from './agents/gm-client';

const API_BASE = '/api';

/**
 * Send a message to the LLM.
 * - If user has their own API key: call the provider DIRECTLY from browser (no server)
 * - If using fallback: go through server proxy
 */
export async function* streamChatMessage(
  messages: ChatMessage[],
  language: string,
  userApiKey?: string,
  phase?: string,
  provider?: string,
  model?: string,
  customApiUrl?: string
): AsyncGenerator<string, void, unknown> {
  if (userApiKey) {
    // User's own key → direct browser call (never touches our server)
    yield* streamDirectFromBrowser(messages, language, userApiKey, phase, provider, model, customApiUrl);
  } else {
    // Fallback → server proxy (our key stays on server)
    yield* streamViaServer(messages, language, phase, provider, model);
  }
}

/**
 * Direct browser call — user's key never passes through our server.
 * Handles OpenAI-compatible and Anthropic APIs.
 */
async function* streamDirectFromBrowser(
  messages: ChatMessage[],
  language: string,
  apiKey: string,
  phase: string | undefined,
  providerId: string | undefined,
  model: string | undefined,
  customApiUrl: string | undefined
): AsyncGenerator<string, void, unknown> {
  const detectedProvider = providerId ? (providerId as ProviderId) : detectProvider(apiKey);
  const provider = PROVIDERS[detectedProvider];
  const modelName = model || provider.defaultModel;

  // Build system prompt client-side for direct calls
  const { buildGMPromptClient } = await import('./agents/gm-client');
  const systemPrompt = buildGMPromptClient(language, (phase || 'character_creation') as GamePhase);

  const llmMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  // Anthropic has a different API format
  if (detectedProvider === 'anthropic') {
    yield* streamAnthropicBrowser(apiKey, modelName, llmMessages);
    return;
  }

  // OpenAI-compatible streaming (works for DeepSeek, OpenAI, Google, OpenRouter, Fireworks, MiniMax, Custom)
  const apiUrl = detectedProvider === 'custom' && customApiUrl
    ? customApiUrl
    : provider.apiUrl;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(detectedProvider === 'openrouter' ? {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Ignis Tavern',
      } : {}),
    },
    body: JSON.stringify({
      model: modelName,
      messages: llmMessages,
      temperature: 0.8,
      max_tokens: 2000,
      stream: true,
    }),
  });

  if (!response.ok) {
    let errorMsg = `API error: ${response.status}`;
    try {
      const error = await response.json();
      errorMsg = error.error?.message || error.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // Skip
      }
    }
  }
}

/**
 * Server proxy — for fallback (no user key). Our key stays on server.
 */
async function* streamViaServer(
  messages: ChatMessage[],
  language: string,
  phase?: string,
  provider?: string,
  model?: string
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, language, phase, provider, model }),
    // No userApiKey sent — server will use FALLBACK_API_KEY
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send message');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        try {
          const parsed = JSON.parse(data);
          if (parsed.done) return;
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.content) yield parsed.content;
        } catch (e) {
          if (e instanceof Error && !e.message.includes('JSON')) throw e;
        }
      }
    }
  }
}

/**
 * Non-streaming version
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  language: string,
  userApiKey?: string,
  phase?: string,
  provider?: string,
  model?: string,
  customApiUrl?: string
): Promise<string> {
  let fullText = '';
  for await (const chunk of streamChatMessage(messages, language, userApiKey, phase, provider, model, customApiUrl)) {
    fullText += chunk;
  }
  return fullText;
}
