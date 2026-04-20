/**
 * Multi-provider LLM configuration.
 * Last updated: 2026-04-20
 */

export type ProviderId = 'openrouter' | 'github' | 'cloudflare' | 'siliconflow' | 'deepseek' | 'openai' | 'anthropic' | 'google' | 'fireworks' | 'minimax' | 'custom';

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  nameZh: string;
  apiUrl: string;
  defaultModel: string;
  models: string[];
  apiKeyPrefix: string;
  apiKeyHint: string;
  /** Extra notes shown in the API key modal */
  setupNoteZh?: string;
  setupNoteEn?: string;
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  // ── Free providers (recommended for fallback) ──

  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    nameZh: 'OpenRouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'openrouter/free',
    models: [
      'openrouter/free',
      'minimax/minimax-m2.5:free',
      'qwen/qwen3-coder:free',
      'nvidia/nemotron-3-super-120b-a12b:free',
      'google/gemma-4-31b-it:free',
      'openai/gpt-oss-120b:free',
      'z-ai/glm-4.5-air:free',
      'openai/gpt-5.4',
      'openai/gpt-5.4-mini',
      'openai/gpt-5.4-nano',
      'anthropic/claude-opus-4.7',
      'google/gemini-3-pro',
      'deepseek/deepseek-chat',
      'deepseek/deepseek-r1',
      'z-ai/glm-5.1',
      'moonshotai/kimi-k2.5',
      'minimax/minimax-m2.7',
      'qwen/qwen3.6-plus',
      'x-ai/grok-4.20-multi-agent',
    ],
    apiKeyPrefix: 'sk-or-',
    apiKeyHint: 'sk-or-...',
    setupNoteZh: '✅ 免费！大量免费模型可用，注册即送额度',
    setupNoteEn: '✅ Free! Many free models available, credits on signup',
  },

  github: {
    id: 'github',
    name: 'GitHub Models',
    nameZh: 'GitHub Models',
    apiUrl: 'https://models.github.ai/inference/chat/completions',
    defaultModel: 'openai/gpt-4.1-mini',
    models: [
      'openai/gpt-4.1',
      'openai/gpt-4.1-mini',
      'openai/gpt-4.1-nano',
      'meta/llama-4-maverick',
      'deepseek/deepseek-v3',
      'mistralai/mistral-large',
      'cohere/command-r-plus',
      'ai21-labs/jamba-1.5-large',
    ],
    apiKeyPrefix: 'ghp_',
    apiKeyHint: 'ghp_... (GitHub PAT with models scope)',
    setupNoteZh: '✅ 免费！用 GitHub 账号创建 PAT (models scope) 即可，github.com/settings/tokens',
    setupNoteEn: '✅ Free! Create a GitHub PAT with models scope at github.com/settings/tokens',
  },

  cloudflare: {
    id: 'cloudflare',
    name: 'Cloudflare Workers AI',
    nameZh: 'Cloudflare Workers AI',
    // Cloudflare needs account_id in the URL — we'll handle this in llm.ts
    apiUrl: 'https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions',
    defaultModel: '@cf/meta/llama-3.1-8b-instruct',
    models: [
      '@cf/meta/llama-3.1-8b-instruct',
      '@cf/openai/gpt-oss-120b',
      '@cf/mistral/mistral-7b-instruct',
      '@cf/qwen/qwen1.5-14b-chat-awq',
    ],
    apiKeyPrefix: '',
    apiKeyHint: 'Cloudflare API Token',
    setupNoteZh: '✅ 免费！需要 Cloudflare Account ID + API Token，dash.cloudflare.com',
    setupNoteEn: '✅ Free! Needs Cloudflare Account ID + API Token from dash.cloudflare.com',
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
    ],
    apiKeyPrefix: 'sk-',
    apiKeyHint: 'sk-... (siliconflow.cn)',
    setupNoteZh: '⚠️ 注册送额度，部分小模型免费，大模型需充值',
    setupNoteEn: '⚠️ Signup credits, some small models free, larger models require top-up',
  },

  // ── Paid providers ──

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

  fireworks: {
    id: 'fireworks',
    name: 'Fireworks AI',
    nameZh: 'Fireworks AI',
    apiUrl: 'https://api.fireworks.ai/inference/v1/chat/completions',
    defaultModel: 'accounts/fireworks/models/qwen3-235b-a22b',
    models: [
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
  if (apiKey.startsWith('ghp_')) return 'github';
  if (apiKey.startsWith('sk-ant-')) return 'anthropic';
  if (apiKey.startsWith('fw_')) return 'fireworks';
  if (apiKey.startsWith('AIza')) return 'google';
  if (apiKey.startsWith('sk-') && apiKey.length < 40) return 'deepseek';
  if (apiKey.startsWith('sk-')) return 'openai';
  return 'openrouter';
}
