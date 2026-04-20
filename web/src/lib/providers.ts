/**
 * Multi-provider LLM configuration.
 * Last updated: 2026-04-20
 */

export type ProviderId = 'openrouter' | 'siliconflow' | 'custom';

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
};

export function detectProvider(apiKey: string): ProviderId {
  if (apiKey.startsWith('sk-or-')) return 'openrouter';
  return 'siliconflow';
}
