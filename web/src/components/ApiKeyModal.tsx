'use client';

import { useState, useEffect, useCallback } from 'react';
import { PROVIDERS, ProviderId } from '@/lib/providers';
import { ModelInfo, fetchModels } from '@/lib/fetchModels';

type ApiMode = 'default' | 'custom';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (settings: { apiKey: string; provider: string; model: string; customApiUrl: string; mode: ApiMode }) => void;
  currentKey?: string;
  currentProvider?: string;
  currentModel?: string;
  currentCustomApiUrl?: string;
  currentMode?: ApiMode;
  language: 'zh' | 'en';
}

const FALLBACK_INFO = {
  zh: {
    provider: '硅基流动 + OpenRouter 双线',
    model: 'DeepSeek V3.2 → MiniMax M2.5',
    desc: '自动切换：主用硅基流动，失败时切 OpenRouter',
    speed: '~2-5 秒/回复',
    quality: '⭐⭐⭐⭐',
  },
  en: {
    provider: 'SiliconFlow + OpenRouter Dual',
    model: 'DeepSeek V3.2 → MiniMax M2.5',
    desc: 'Auto-switch: primary SiliconFlow, fallback OpenRouter',
    speed: '~2-5 sec/response',
    quality: '⭐⭐⭐⭐',
  },
};

export default function ApiKeyModal({
  isOpen,
  onClose,
  onSave,
  currentKey,
  currentProvider,
  currentModel,
  currentCustomApiUrl,
  currentMode,
  language,
}: ApiKeyModalProps) {
  const [mode, setMode] = useState<ApiMode>('default');
  const [apiKey, setApiKey] = useState('');
  const [providerId, setProviderId] = useState<ProviderId>('openrouter');
  const [model, setModel] = useState('');
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [liveModels, setLiveModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelFetchError, setModelFetchError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const detectedMode = currentMode || (currentKey ? 'custom' : 'default');
      setMode(detectedMode);
      setApiKey(currentKey || '');
      setProviderId((currentProvider as ProviderId) || 'openrouter');
      setModel(currentModel || '');
      setCustomApiUrl(currentCustomApiUrl || '');
      setLiveModels([]);
      setModelFetchError('');
    }
  }, [isOpen, currentKey, currentProvider, currentModel, currentCustomApiUrl, currentMode]);

  const refreshModels = useCallback(async () => {
    if (!apiKey) { setLiveModels([]); return; }
    setLoadingModels(true);
    setModelFetchError('');
    try {
      const models = await fetchModels(providerId, apiKey, customApiUrl);
      setLiveModels(models);
    } catch {
      setLiveModels([]);
      setModelFetchError(language === 'zh' ? '无法获取模型列表，请手动输入' : 'Failed to fetch models, please type manually');
    } finally {
      setLoadingModels(false);
    }
  }, [providerId, apiKey, customApiUrl, language]);

  useEffect(() => {
    if (isOpen && apiKey && mode === 'custom') {
      const timer = setTimeout(refreshModels, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, providerId, apiKey, customApiUrl, refreshModels, mode]);

  if (!isOpen) return null;

  const provider = PROVIDERS[providerId];
  const providerList = Object.values(PROVIDERS);
  const fb = FALLBACK_INFO[language];

  const allModels: ModelInfo[] = liveModels.length > 0
    ? liveModels
    : provider.models.map(id => ({ id, name: id }));

  const filteredModels = model
    ? allModels.filter(m => m.id.toLowerCase().includes(model.toLowerCase()))
    : allModels;

  const texts = {
    zh: {
      title: 'API 设置',
      modeLabel: '运行模式',
      modeDefault: '默认模式',
      modeDefaultDesc: '使用免费保底模型，无需配置',
      modeCustom: '自定义模式',
      modeCustomDesc: '使用自己的 API Key，体验更佳',
      defaultBanner: '⚠️ 默认模式使用双线保底（硅基流动 DeepSeek V3.2 + OpenRouter MiniMax M2.5），可能会出现角色设定偏差。建议切换自定义模式，使用更强的模型（如 GPT-5.4、Claude Opus 4.7 等）获得最佳体验！',
      fallbackInfo: '保底模型信息',
      fallbackProvider: '提供商',
      fallbackModel: '模型',
      fallbackDesc: '说明',
      fallbackSpeed: '速度',
      fallbackQuality: '质量',
      provider: '提供商',
      apiKey: 'API Key',
      model: '模型（直接输入或从列表选择）',
      customUrl: '自定义 API 地址',
      cancel: '取消',
      save: '保存',
      note: '🔒 安全：你的 Key 只在请求时使用，不会被存储在服务器上',
      fetchingModels: '正在获取模型列表...',
      modelsFound: (n: number) => `找到 ${n} 个可用模型`,
      noModels: '暂无模型列表，请手动输入模型名',
      suggestions: '可用模型',
      modelPlaceholder: '输入模型名称，如 deepseek-chat、gpt-4o ...',
    },
    en: {
      title: 'API Settings',
      modeLabel: 'Run Mode',
      modeDefault: 'Default',
      modeDefaultDesc: 'Use free fallback model, no setup needed',
      modeCustom: 'Custom',
      modeCustomDesc: 'Use your own API key for better experience',
      defaultBanner: '⚠️ Default mode uses dual fallback (SiliconFlow DeepSeek V3.2 + OpenRouter MiniMax M2.5), may produce inaccurate settings. Switch to Custom mode with stronger models (e.g. GPT-5.4, Claude Opus 4.7) for best experience!',
      fallbackInfo: 'Fallback Model Info',
      fallbackProvider: 'Provider',
      fallbackModel: 'Model',
      fallbackDesc: 'Description',
      fallbackSpeed: 'Speed',
      fallbackQuality: 'Quality',
      provider: 'Provider',
      apiKey: 'API Key',
      model: 'Model (type any name or pick from list)',
      customUrl: 'Custom API URL',
      cancel: 'Cancel',
      save: 'Save',
      note: '🔒 Secure: Your key is only used for the request, never stored on our server',
      fetchingModels: 'Fetching model list...',
      modelsFound: (n: number) => `${n} models available`,
      noModels: 'No model list available, please type the model name manually',
      suggestions: 'Available models',
      modelPlaceholder: 'Type model name, e.g. deepseek-chat, gpt-4o ...',
    },
  };

  const t = texts[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border-2 border-amber-600 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl text-amber-400 mb-2">{t.title}</h2>

        <div className="space-y-4">
          {/* Mode Toggle */}
          <div>
            <label className="block text-amber-200/80 text-sm mb-2 font-medium">
              {t.modeLabel}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('default')}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  mode === 'default'
                    ? 'border-amber-500 bg-amber-900/40 text-amber-300'
                    : 'border-amber-700/30 bg-slate-800/50 text-amber-200/50 hover:border-amber-600/50'
                }`}
              >
                <div className="font-bold">🆓 {t.modeDefault}</div>
                <div className="text-xs mt-0.5 opacity-70">{t.modeDefaultDesc}</div>
              </button>
              <button
                onClick={() => setMode('custom')}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  mode === 'custom'
                    ? 'border-amber-500 bg-amber-900/40 text-amber-300'
                    : 'border-amber-700/30 bg-slate-800/50 text-amber-200/50 hover:border-amber-600/50'
                }`}
              >
                <div className="font-bold">🔑 {t.modeCustom}</div>
                <div className="text-xs mt-0.5 opacity-70">{t.modeCustomDesc}</div>
              </button>
            </div>
          </div>

          {/* Default Mode: Show fallback info + prominent suggestion */}
          {mode === 'default' && (
            <>
              {/* Prominent suggestion banner */}
              <div className="rounded-lg bg-gradient-to-r from-amber-900/50 to-orange-900/40 border border-amber-500/50 p-3.5">
                <div className="text-amber-200 text-sm leading-relaxed">
                  {t.defaultBanner}
                </div>
                <button
                  onClick={() => setMode('custom')}
                  className="mt-3 w-full px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-500
                           text-white rounded-lg font-bold text-sm
                           hover:from-amber-500 hover:to-orange-400 transition-all
                           shadow-lg shadow-orange-900/40"
                >
                  🔑 {language === 'zh' ? '切换到自定义模式' : 'Switch to Custom Mode'}
                </button>
              </div>

              {/* Fallback model info card */}
              <div className="rounded-lg bg-slate-800/60 border border-amber-700/20 p-3.5">
                <div className="text-amber-400/80 text-xs font-bold uppercase tracking-wider mb-2">
                  {t.fallbackInfo}
                </div>
                <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                  <span className="text-amber-500/50">{t.fallbackProvider}</span>
                  <span className="text-amber-200/70">{fb.provider}</span>
                  <span className="text-amber-500/50">{t.fallbackModel}</span>
                  <span className="text-amber-200/70 font-mono text-xs">{fb.model}</span>
                  <span className="text-amber-500/50">{t.fallbackDesc}</span>
                  <span className="text-amber-200/70">{fb.desc}</span>
                  <span className="text-amber-500/50">{t.fallbackSpeed}</span>
                  <span className="text-amber-200/70">{fb.speed}</span>
                  <span className="text-amber-500/50">{t.fallbackQuality}</span>
                  <span className="text-amber-200/70">{fb.quality}</span>
                </div>
              </div>
            </>
          )}

          {/* Custom Mode: Full provider/key/model config */}
          {mode === 'custom' && (
            <>
              {/* Provider */}
              <div>
                <label className="block text-amber-200/80 text-sm mb-2 font-medium">
                  {t.provider}
                </label>
                <select
                  value={providerId}
                  onChange={(e) => {
                    setProviderId(e.target.value as ProviderId);
                    const newProvider = PROVIDERS[e.target.value as ProviderId];
                    setModel(newProvider.defaultModel);
                    setLiveModels([]);
                  }}
                  className="w-full px-4 py-3 bg-slate-800 border border-amber-700/50 rounded-lg
                           text-amber-100 focus:outline-none focus:border-amber-500 transition-colors
                           appearance-none cursor-pointer"
                >
                  {providerList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {language === 'zh' ? p.nameZh : p.name}
                    </option>
                  ))}
                </select>
                {/* Setup note */}
                {provider.setupNoteZh && (
                  <div className={`mt-1.5 text-xs px-3 py-2 rounded-lg ${provider.setupNoteZh.startsWith('✅') ? 'bg-green-900/20 text-green-400/70' : 'bg-amber-900/20 text-amber-400/70'}`}>
                    {language === 'zh' ? provider.setupNoteZh : (provider.setupNoteEn || provider.setupNoteZh)}
                  </div>
                )}
              </div>

              {/* Custom URL */}
              {providerId === 'custom' && (
                <div>
                  <label className="block text-amber-200/80 text-sm mb-2">
                    {t.customUrl}
                  </label>
                  <input
                    type="url"
                    value={customApiUrl}
                    onChange={(e) => setCustomApiUrl(e.target.value)}
                    placeholder="https://api.example.com/v1/chat/completions"
                    className="w-full px-4 py-3 bg-slate-800 border border-amber-700/50 rounded-lg
                             text-amber-100 placeholder-amber-700/50
                             focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              )}

              {/* API Key */}
              <div>
                <label className="block text-amber-200/80 text-sm mb-2">
                  {t.apiKey}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider.apiKeyHint}
                  className="w-full px-4 py-3 bg-slate-800 border border-amber-700/50 rounded-lg
                           text-amber-100 placeholder-amber-700/50
                           focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Model */}
              <div className="relative">
                <label className="block text-amber-200/80 text-sm mb-2">
                  {t.model}
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    setShowModelSuggestions(true);
                  }}
                  onFocus={() => setShowModelSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowModelSuggestions(false), 200)}
                  placeholder={t.modelPlaceholder}
                  className="w-full px-4 py-3 bg-slate-800 border border-amber-700/50 rounded-lg
                           text-amber-100 placeholder-amber-700/50
                           focus:outline-none focus:border-amber-500 transition-colors"
                />
                {apiKey && (
                  <div className="mt-1.5 text-xs text-amber-500/60">
                    {loadingModels
                      ? t.fetchingModels
                      : liveModels.length > 0
                        ? t.modelsFound(liveModels.length)
                        : modelFetchError || t.noModels}
                  </div>
                )}
                {showModelSuggestions && filteredModels.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-amber-700/50 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                    <div className="px-3 py-1.5 text-xs text-amber-500/60 font-medium border-b border-amber-700/30 sticky top-0 bg-slate-800">
                      {t.suggestions} ({filteredModels.length})
                    </div>
                    {filteredModels.slice(0, 50).map((m) => (
                      <button
                        key={m.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setModel(m.id);
                          setShowModelSuggestions(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                          ${model === m.id
                            ? 'text-amber-400 bg-amber-900/30'
                            : 'text-amber-100/80 hover:bg-amber-900/20 hover:text-amber-300'}
                        `}
                      >
                        <span className="font-mono">{m.id}</span>
                        {m.name && m.name !== m.id && (
                          <span className="ml-2 text-amber-500/40 text-xs">({m.name})</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-amber-600/60">{t.note}</p>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-amber-700/50 text-amber-200/70 rounded-lg
                     hover:bg-amber-900/30 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={() => {
              onSave?.({
                apiKey: mode === 'custom' ? apiKey.trim() : '',
                provider: mode === 'custom' ? providerId : 'openrouter',
                model: mode === 'custom' ? (model.trim() || provider.defaultModel) : 'deepseek-ai/DeepSeek-V3.2',
                customApiUrl: mode === 'custom' ? customApiUrl.trim() : '',
                mode,
              });
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-700 to-orange-600
                     text-white rounded-lg font-medium
                     hover:from-amber-600 hover:to-orange-500
                     transition-all shadow-lg shadow-orange-900/30"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
