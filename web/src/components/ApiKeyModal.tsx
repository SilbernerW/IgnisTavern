'use client';

import { useState, useEffect, useCallback } from 'react';
import { PROVIDERS, ProviderId } from '@/lib/providers';
import { ModelInfo, fetchModels } from '@/lib/fetchModels';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (settings: { apiKey: string; provider: string; model: string; customApiUrl: string }) => void;
  currentKey?: string;
  currentProvider?: string;
  currentModel?: string;
  currentCustomApiUrl?: string;
  language: 'zh' | 'en';
}

export default function ApiKeyModal({
  isOpen,
  onClose,
  onSave,
  currentKey,
  currentProvider,
  currentModel,
  currentCustomApiUrl,
  language,
}: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [providerId, setProviderId] = useState<ProviderId>('deepseek');
  const [model, setModel] = useState('');
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [liveModels, setLiveModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelFetchError, setModelFetchError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setApiKey(currentKey || '');
      setProviderId((currentProvider as ProviderId) || 'deepseek');
      setModel(currentModel || '');
      setCustomApiUrl(currentCustomApiUrl || '');
      setLiveModels([]);
      setModelFetchError('');
    }
  }, [isOpen, currentKey, currentProvider, currentModel, currentCustomApiUrl]);

  // Fetch models when provider or apiKey changes
  const refreshModels = useCallback(async () => {
    if (!apiKey) {
      setLiveModels([]);
      return;
    }
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

  // Auto-fetch when provider or apiKey changes
  useEffect(() => {
    if (isOpen && apiKey) {
      const timer = setTimeout(refreshModels, 500); // debounce
      return () => clearTimeout(timer);
    }
  }, [isOpen, providerId, apiKey, customApiUrl, refreshModels]);

  if (!isOpen) return null;

  const provider = PROVIDERS[providerId];
  const providerList = Object.values(PROVIDERS);

  // Merge live models with static suggestions (live takes priority)
  const allModels: ModelInfo[] = liveModels.length > 0
    ? liveModels
    : provider.models.map(id => ({ id, name: id }));

  // Filter models by search text
  const filteredModels = model
    ? allModels.filter(m => m.id.toLowerCase().includes(model.toLowerCase()))
    : allModels;

  const texts = {
    zh: {
      title: 'API 设置',
      description: '选择 AI 提供商并配置你的 API Key',
      provider: '提供商',
      apiKey: 'API Key',
      model: '模型（直接输入或从列表选择）',
      customUrl: '自定义 API 地址',
      cancel: '取消',
      save: '保存',
      note: '你的 Key 仅存储在本地浏览器中',
      freeNote: '留空 API Key 将使用免费保底模型',
      securityNote: '🔒 安全：你的 Key 只在浏览器中直接调用 AI 服务，不经过我们的服务器',
      fetchingModels: '正在获取模型列表...',
      modelsFound: (n: number) => `找到 ${n} 个可用模型`,
      noModels: '暂无模型列表，请手动输入模型名',
      suggestions: '可用模型',
      modelPlaceholder: '输入模型名称，如 gpt-4o、MiniMax-M1 ...',
    },
    en: {
      title: 'API Settings',
      description: 'Choose an AI provider and configure your API Key',
      provider: 'Provider',
      apiKey: 'API Key',
      model: 'Model (type any name or pick from list)',
      customUrl: 'Custom API URL',
      cancel: 'Cancel',
      save: 'Save',
      note: 'Your key is stored only in your browser',
      freeNote: 'Leave API Key empty to use the free fallback model',
      securityNote: '🔒 Secure: Your key calls the AI service directly from your browser, never passing through our server',
      fetchingModels: 'Fetching model list...',
      modelsFound: (n: number) => `${n} models available`,
      noModels: 'No model list available, please type the model name manually',
      suggestions: 'Available models',
      modelPlaceholder: 'Type model name, e.g. gpt-4o, MiniMax-M1 ...',
    },
  };

  const t = texts[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border-2 border-amber-600 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl text-amber-400 mb-2">{t.title}</h2>
        <p className="text-amber-200/70 text-sm mb-6">{t.description}</p>

        <div className="space-y-4">
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

          {/* Model — free text + live suggestions */}
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

            {/* Status indicator */}
            {apiKey && (
              <div className="mt-1.5 text-xs text-amber-500/60">
                {loadingModels
                  ? t.fetchingModels
                  : liveModels.length > 0
                    ? t.modelsFound(liveModels.length)
                    : modelFetchError || t.noModels}
              </div>
            )}

            {/* Suggestions dropdown */}
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
          <p className="text-xs text-amber-600/60">{t.freeNote}</p>
          <p className="text-xs text-green-500/50">{t.securityNote}</p>
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
                apiKey: apiKey.trim(),
                provider: providerId,
                model: model.trim() || provider.defaultModel,
                customApiUrl: customApiUrl.trim(),
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
