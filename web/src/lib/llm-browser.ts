/**
 * Anthropic streaming from browser (different API format).
 */
export async function* streamAnthropicBrowser(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[]
): AsyncGenerator<string, void, unknown> {
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const chatMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role, content: m.content }));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      system: systemMessage,
      messages: chatMessages,
      temperature: 0.8,
      max_tokens: 2000,
      stream: true,
    }),
  });

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
          yield parsed.delta.text;
        } else if (parsed.type === 'message_stop') {
          return;
        }
      } catch {
        // Skip
      }
    }
  }
}
