/**
 * Multi-provider LLM configuration.
 * Each provider has its own API URL and model list.
 */

export type ProviderId = 'deepseek' | 'openai' | 'anthropic' | 'google' | 'openrouter' | 'fireworks' | 'minimax' | 'custom';

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  nameZh: string;
  apiUrl: string;
  defaultModel: string;
  models: string[];
  apiKeyPrefix: string;
  apiKeyHint: string;
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    nameZh: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-chat-v3-0324', 'deepseek-r1-distill-llama-70b'],
    apiKeyPrefix: 'sk-',
    apiKeyHint: 'sk-...',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    nameZh: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'o3', 'o3-mini', 'o4-mini'],
    apiKeyPrefix: 'sk-',
    apiKeyHint: 'sk-...',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    nameZh: 'Anthropic',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-sonnet-4-20250514',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022', 'claude-opus-4-20250514', 'claude-3-5-sonnet-20241022'],
    apiKeyPrefix: 'sk-ant-',
    apiKeyHint: 'sk-ant-...',
  },
  google: {
    id: 'google',
    name: 'Google Gemini',
    nameZh: 'Google Gemini',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    defaultModel: 'gemini-2.0-flash',
    models: ['gemini-2.5-pro-preview-05-06', 'gemini-2.5-flash-preview-05-20', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'],
    apiKeyPrefix: 'AI',
    apiKeyHint: 'AIza...',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    nameZh: 'OpenRouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'openai/gpt-4o-mini',
    models: [
      'openai/gpt-4o',
      'openai/gpt-4.1',
      'openai/o3-mini',
      'anthropic/claude-sonnet-4-20250514',
      'anthropic/claude-opus-4-20250514',
      'google/gemini-2.5-pro-preview',
      'deepseek/deepseek-chat',
      'deepseek/deepseek-r1',
      'meta-llama/llama-4-maverick',
      'qwen/qwen3-235b-a22b',
    ],
    apiKeyPrefix: 'sk-or-',
    apiKeyHint: 'sk-or-...',
  },
  fireworks: {
    id: 'fireworks',
    name: 'Fireworks AI',
    nameZh: 'Fireworks AI',
    apiUrl: 'https://api.fireworks.ai/inference/v1/chat/completions',
    defaultModel: 'accounts/fireworks/models/llama4-maverick-instruct-basic',
    models: [
      'accounts/fireworks/models/llama4-maverick-instruct-basic',
      'accounts/fireworks/models/llama-v3p3-70b-instruct',
      'accounts/fireworks/models/qwen3-235b-a22b',
      'accounts/fireworks/models/deepseek-r1',
    ],
    apiKeyPrefix: 'fw_',
    apiKeyHint: 'fw_...',
  },
  minimax: {
    id: 'minimax',
    name: 'MiniMax',
    nameZh: 'MiniMax',
    apiUrl: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
    defaultModel: 'MiniMax-Text-01',
    models: ['MiniMax-Text-01', 'MiniMax-M1', 'abab6.5s-chat'],
    apiKeyPrefix: '',
    apiKeyHint: 'MM API Key',
  },
  custom: {
    id: 'custom',
    name: 'Custom (OpenAI-compatible)',
    nameZh: '自定义（OpenAI 兼容）',
    apiUrl: '',
    defaultModel: '',
    models: [],
    apiKeyPrefix: '',
    apiKeyHint: 'Any API Key',
  },
};

/**
 * Detect provider from API key prefix
 */
export function detectProvider(apiKey: string): ProviderId {
  if (apiKey.startsWith('sk-or-')) return 'openrouter';
  if (apiKey.startsWith('sk-ant-')) return 'anthropic';
  if (apiKey.startsWith('fw_')) return 'fireworks';
  if (apiKey.startsWith('AIza')) return 'google';
  // DeepSeek and OpenAI both start with sk-, check length/pattern heuristics
  // DeepSeek keys are typically shorter
  if (apiKey.startsWith('sk-') && apiKey.length < 40) return 'deepseek';
  if (apiKey.startsWith('sk-')) return 'openai';
  return 'deepseek'; // fallback
}
