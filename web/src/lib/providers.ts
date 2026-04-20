/**
 * Multi-provider LLM configuration.
 * Last updated: 2026-04-20
 */

export type ProviderId = 'openrouter' | 'siliconflow' | 'deepseek' | 'openai' | 'anthropic' | 'google' | 'minimax' | 'custom';

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  nameZh: string;
  apiUrl: string;
  defaultModel: string;
  models: string[];
  apiKeyPrefix: string;
  apiKeyHint: string;
  setupNoteZh?: string;
  setupNoteEn?: string;
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    nameZh: 'OpenRouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'minimax/minimax-m2.5:free',
    models: [
      // Free
      'minimax/minimax-m2.5:free',
      'openrouter/free',
      'qwen/qwen3-coder:free',
      'nvidia/nemotron-3-super-120b-a12b:free',
      'google/gemma-4-31b-it:free',
      'openai/gpt-oss-120b:free',
      'z-ai/glm-4.5-air:free',
      // Premium
      'openai/gpt-5.4',
      'openai/gpt-5.4-mini',
      'anthropic/claude-opus-4.7',
      'google/gemini-3-pro',
      'deepseek/deepseek-chat',
      'deepseek/deepseek-r1',
      'z-ai/glm-5.1',
      'moonshotai/kimi-k2.5',
      'minimax/minimax-m2.7',
      'qwen/qwen3.6-plus',
    ],
    apiKeyPrefix: 'sk-or-',
    apiKeyHint: 'sk-or-...',
    setupNoteZh: '✅ 免费！大量免费模型可用，注册即送额度',
    setupNoteEn: '✅ Free! Many free models, credits on signup',
  },

  siliconflow: {
    id: 'siliconflow',
    name: 'SiliconFlow',
    nameZh: '硅基流动',
    apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
    defaultModel: 'deepseek-ai/DeepSeek-V3.2',
    models: [
      'deepseek-ai/DeepSeek-V3.2',
      'deepseek-ai/DeepSeek-V3',
      'deepseek-ai/DeepSeek-R1',
      'Qwen/Qwen3-235B-A22B',
      'Qwen/Qwen3-30B-A3B',
      'THUDM/GLM-5.1-0414',
      'Pro/deepseek-ai/DeepSeek-V3',
    ],
    apiKeyPrefix: 'sk-',
    apiKeyHint: 'sk-... (siliconflow.cn)',
    setupNoteZh: '⚠️ 注册送代金券，大模型需余额',
    setupNoteEn: '⚠️ Signup credits, larger models require balance',
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

  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    nameZh: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    apiKeyPrefix: 'sk-',
    apiKeyHint: 'sk-... (deepseek.com)',
  },

  openai: {
    id: 'openai',
    name: 'OpenAI',
    nameZh: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-5.4-mini',
    models: ['gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano'],
    apiKeyPrefix: 'sk-',
    apiKeyHint: 'sk-... (platform.openai.com)',
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
    apiKeyHint: 'AIza... (aistudio.google.com)',
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
};

export function detectProvider(apiKey: string): ProviderId {
  if (apiKey.startsWith('sk-or-')) return 'openrouter';
  if (apiKey.startsWith('sk-ant-')) return 'anthropic';
  if (apiKey.startsWith('AIza')) return 'google';
  if (apiKey.startsWith('sk-') && apiKey.length < 40) return 'deepseek';
  if (apiKey.startsWith('sk-')) return 'openai';
  return 'openrouter';
}
