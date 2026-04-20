const SETTINGS_KEY = 'ignis_tavern_settings';

export interface AppSettings {
  language: 'zh' | 'en';
  apiKey: string;
  provider: string;
  model: string;
  customApiUrl: string;
  apiMode: 'default' | 'custom';
}

export const defaultSettings: AppSettings = {
  language: 'zh',
  apiKey: '',
  provider: 'siliconflow',
  model: 'deepseek-ai/DeepSeek-V3.2',
  customApiUrl: '',
  apiMode: 'default',
};

export function loadSettings(): AppSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return { ...defaultSettings };
    return { ...defaultSettings, ...JSON.parse(data) };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = loadSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}
