/**
 * Multi-provider LLM configuration.
 * Each provider has its own API URL and model list.
 * Last updated: 2026-04-20
 */

export type ProviderId = 'openrouter' | 'siliconflow' | 'deepseek' | 'openai' | 'anthropic' | 'google' | 'fireworks' | 'minimax' | 'custom';

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
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    nameZh: 'OpenRouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'minimax/minimax-m2.7:free',
    models: [
      // Free models
      'minimax/minimax-m2.7:free',
      'google/gemini-2.0-flash-exp:free',
      'meta-llama/llama-4-maverick:free',
      // Premium models
      'openai/gpt-5.4',
      'openai/gpt-5.4-mini',
      'openai/o4-mini',
      'anthropic/claude-opus-4.7',
      'anthropic/claude-sonnet-4-20250514',
      'google/gemini-3-pro',
      'google/gemini-2.5-flash-preview-05-20',
      'deepseek/deepseek-chat-v3-0324',
      'deepseek/deepseek-r1',
      'z-ai/glm-5.1',
      'moonshotai/kimi-k2.5',
      'minimax/minimax-m2.7',
      'qwen/qwen3-235b-a22b',
    ],
    apiKeyPrefix: 'sk-or-',
    apiKeyHint: 'sk-or-...',
  },
  siliconflow: {
    id: 'siliconflow',
    name: 'SiliconFlow',
    nameZh: '硅基流动',
    apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    models: [
      'deepseek-ai/DeepSeek-V3',
      'deepseek-ai/DeepSeek-R1',
      'Qwen/Qwen3-235B-A22B',
      'Qwen/Qwen3-30B-A3B',
      'THUDM/GLM-5.1-0414',
      'Pro/deepseek-ai/DeepSeek-V3',
    ],
    apiKeyPrefix: 'sk-',
    apiKeyHint: 'sk-...',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    nameZh: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    apiKeyPrefix: 'sk-',
    apiKeyHint: 'sk-...',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    nameZh: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-5.4-mini',
    models: ['gpt-5.4', 'gpt-5.4-mini', 'o4-mini'],
    apiKeyPrefix: 'sk-',
    apiKeyHint: 'sk-...',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    nameZh: 'Anthropic',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-opus-4.7',
    models: ['claude-opus-4.7', 'claude-sonnet-4-20250514'],
    apiKeyPrefix: 'sk-ant-',
    apiKeyHint: 'sk-ant-...',
  },
  google: {
    id: 'google',
    name: 'Google Gemini',
    nameZh: 'Google Gemini',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    defaultModel: 'gemini-3-pro',
    models: ['gemini-3-pro', 'gemini-2.5-flash-preview-05-20', 'gemini-2.0-flash'],
    apiKeyPrefix: 'AI',
    apiKeyHint: 'AIza...',
  },
  fireworks: {
    id: 'fireworks',
    name: 'Fireworks AI',
    nameZh: 'Fireworks AI',
    apiUrl: 'https://api.fireworks.ai/inference/v1/chat/completions',
    defaultModel: 'accounts/fireworks/models/qwen3-235b-a22b',
    models: [
      'accounts/fireworks/models/qwen3-235b-a22b',
      'accounts/fireworks/models/deepseek-r1',
      'accounts/fireworks/models/llama-v3p3-70b-instruct',
    ],
    apiKeyPrefix: 'fw_',
    apiKeyHint: 'fw_...',
  },
  minimax: {
    id: 'minimax',
    name: 'MiniMax',
    nameZh: 'MiniMax',
    apiUrl: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
    defaultModel: 'MiniMax-M2.7',
    models: ['MiniMax-M2.7', 'MiniMax-M1', 'MiniMax-Text-01'],
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
  if (apiKey.startsWith('sk-') && apiKey.length < 40) return 'deepseek';
  if (apiKey.startsWith('sk-')) return 'openai';
  return 'openrouter';
}
