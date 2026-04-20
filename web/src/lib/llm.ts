import { PROVIDERS, ProviderId, detectProvider } from './providers';

interface ChatCompletionOptions {
  apiKey: string;
  messages: { role: string; content: string }[];
  model?: string;
  provider?: ProviderId;
  customApiUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Stream a chat completion. Works with any OpenAI-compatible API.
 * Anthropic uses a different format, handled separately.
 */
export async function streamChatCompletion(
  optionsInput: ChatCompletionOptions,
  onChunk: (text: string) => void,
  onDone: () => void
): Promise<void> {
  const {
    apiKey,
    messages,
    model,
    provider: explicitProvider,
    customApiUrl,
    temperature = 0.4,
    maxTokens = 4096,
  } = optionsInput;

  // Detect or use explicit provider
  const providerId = explicitProvider || detectProvider(apiKey);
  const provider = PROVIDERS[providerId];

  // Anthropic has a different API format
  if (providerId === 'anthropic') {
    return streamAnthropic(optionsInput, onChunk, onDone);
  }

  // MiniMax has a slightly different format but close enough to OpenAI
  let apiUrl = providerId === 'custom' && customApiUrl
    ? customApiUrl
    : provider.apiUrl;

  const modelName = model || provider.defaultModel;

  // Cloudflare needs account_id in URL — extract from apiKey format "account_id:api_token"
  let authToken = apiKey;
  if (providerId === 'cloudflare') {
    const parts = apiKey.split(':');
    if (parts.length === 2) {
      apiUrl = apiUrl.replace('{account_id}', parts[0]);
      authToken = parts[1];
    }
  }

  // GitHub Models needs different auth header
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(providerId === 'github'
      ? { Authorization: `Bearer ${apiKey}`, 'X-GitHub-Api-Version': '2022-11-28' }
      : providerId === 'cloudflare'
        ? { Authorization: `Bearer ${authToken}` }
        : { Authorization: `Bearer ${apiKey}` }),
    ...(providerId === 'openrouter' ? {
      'HTTP-Referer': 'https://ignis-tavern.vercel.app',
      'X-Title': 'Ignis Tavern',
    } : {}),
  };

  // Timeout controller — 30 seconds max wait for first response
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: modelName,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
      // Disable reasoning/thinking for faster responses (Qwen3.x etc)
      ...(providerId === 'siliconflow' ? { enable_thinking: false } : {}),
      // OpenRouter: pass provider options for free models
      ...(providerId === 'openrouter' ? {
        // Some models support reasoning, disable for speed
        provider: { allow_fallbacks: true },
      } : {}),
    }),
    signal: controller.signal,
  });

  clearTimeout(timeout);

  if (!response.ok) {
    let errorMsg = `API request failed: ${response.status}`;
    try {
      const error = await response.json();
      errorMsg = error.error?.message || error.message || errorMsg;
    } catch {}
    // Common error hints
    if (response.status === 401 || response.status === 403) {
      errorMsg += ' (API key may be invalid or balance depleted)';
    } else if (response.status === 429) {
      errorMsg += ' (Rate limited — please try again in a moment)';
    }
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
      if (data === '[DONE]') {
        onDone();
        return;
      }

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;
        if (delta) {
          // Skip reasoning_content — only send actual content to the UI
          // Qwen3.x models put thinking in reasoning_content, answer in content
          const content = delta.content;
          if (content) {
            onChunk(content);
          }
          // If only reasoning_content and no content yet, skip silently
          // The user will see nothing until the model starts generating content
        }
      } catch {
        // Skip malformed JSON
      }
    }
  }

  onDone();
}

/**
 * Anthropic streaming (different API format)
 */
async function streamAnthropic(
  options: ChatCompletionOptions,
  onChunk: (text: string) => void,
  onDone: () => void
): Promise<void> {
  const { apiKey, messages, model, temperature = 0.4, maxTokens = 4096 } = options;
  const provider = PROVIDERS.anthropic;
  const modelName = model || provider.defaultModel;

  // Anthropic requires system message separate from messages array
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const chatMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role, content: m.content }));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const response = await fetch(provider.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: modelName,
      system: systemMessage,
      messages: chatMessages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeout);

  if (!response.ok) {
    let errorMsg = `Anthropic API error: ${response.status}`;
    try {
      const error = await response.json();
      errorMsg = error.error?.message || errorMsg;
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
      if (!trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          onChunk(parsed.delta.text);
        } else if (parsed.type === 'message_stop') {
          onDone();
          return;
        }
      } catch {
        // Skip
      }
    }
  }

  onDone();
}

/**
 * Non-streaming chat completion
 */
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<string> {
  let fullText = '';
  await streamChatCompletion(options, (chunk) => { fullText += chunk; }, () => {});
  return fullText;
}
