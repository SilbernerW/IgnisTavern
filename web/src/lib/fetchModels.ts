import { PROVIDERS, ProviderId } from './providers';

export interface ModelInfo {
  id: string;
  name?: string;
  created?: number;
}

/**
 * Fetch available models from a provider's API using the user's API key.
 * Falls back to the static suggestions list if the API call fails.
 */
export async function fetchModels(
  providerId: ProviderId,
  apiKey: string,
  customApiUrl?: string
): Promise<ModelInfo[]> {
  if (!apiKey) return [];

  try {
    switch (providerId) {
      case 'openai':
        return fetchOpenAIModels(apiKey);
      case 'anthropic':
        // Anthropic doesn't have a public models list endpoint, return static
        return PROVIDERS.anthropic.models.map(id => ({ id }));
      case 'google':
        return fetchGoogleModels(apiKey);
      case 'deepseek':
        return fetchDeepSeekModels(apiKey);
      case 'openrouter':
        return fetchOpenRouterModels(apiKey);
      case 'fireworks':
        return fetchFireworksModels(apiKey);
      case 'minimax':
        // MiniMax doesn't have a standard models endpoint
        return PROVIDERS.minimax.models.map(id => ({ id }));
      case 'custom':
        return fetchCustomModels(customApiUrl || '', apiKey);
      default:
        return [];
    }
  } catch {
    // Fallback to static list
    const provider = PROVIDERS[providerId];
    return provider.models.map(id => ({ id }));
  }
}

async function fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error('Failed to fetch models');
  const data = await res.json();
  const models: ModelInfo[] = (data.data || [])
    .filter((m: any) =>
      // Filter to chat/completion models only
      m.id.includes('gpt') ||
      m.id.includes('o1') ||
      m.id.includes('o3') ||
      m.id.includes('o4') ||
      m.id.includes('chat')
    )
    .sort((a: any, b: any) => (b.created || 0) - (a.created || 0))
    .map((m: any) => ({ id: m.id, name: m.id, created: m.created }));
  return models;
}

async function fetchDeepSeekModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch('https://api.deepseek.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error('Failed to fetch models');
  const data = await res.json();
  return (data.data || [])
    .map((m: any) => ({ id: m.id, name: m.id }))
    .sort((a: ModelInfo, b: ModelInfo) => a.id.localeCompare(b.id));
}

async function fetchGoogleModels(apiKey: string): Promise<ModelInfo[]> {
  // Google uses a different endpoint format
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  if (!res.ok) throw new Error('Failed to fetch models');
  const data = await res.json();
  return (data.models || [])
    .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m: any) => ({
      id: m.name.replace('models/', ''),
      name: m.displayName,
    }))
    .sort((a: ModelInfo, b: ModelInfo) => a.id.localeCompare(b.id));
}

async function fetchOpenRouterModels(apiKey: string): Promise<ModelInfo[]> {
  // OpenRouter has a public models endpoint (key optional but helps with rate limits)
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
  });
  if (!res.ok) throw new Error('Failed to fetch models');
  const data = await res.json();
  return (data.data || [])
    .map((m: any) => ({ id: m.id, name: m.name || m.id }))
    .sort((a: ModelInfo, b: ModelInfo) => a.id.localeCompare(b.id));
}

async function fetchFireworksModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch('https://api.fireworks.ai/inference/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error('Failed to fetch models');
  const data = await res.json();
  return (data.data || [])
    .map((m: any) => ({ id: m.id, name: m.id }))
    .sort((a: ModelInfo, b: ModelInfo) => a.id.localeCompare(b.id));
}

async function fetchCustomModels(apiUrl: string, apiKey: string): Promise<ModelInfo[]> {
  if (!apiUrl) return [];
  // Try the standard /models endpoint
  const baseUrl = apiUrl.replace(/\/chat\/completions\/?$/, '').replace(/\/v1\/?$/, '');
  const res = await fetch(`${baseUrl}/v1/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error('Failed to fetch models');
  const data = await res.json();
  return (data.data || [])
    .map((m: any) => ({ id: m.id, name: m.id }))
    .sort((a: ModelInfo, b: ModelInfo) => a.id.localeCompare(b.id));
}
