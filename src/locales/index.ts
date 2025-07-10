import type { App } from 'vue';
import axios from 'axios';
import { type Composer, createI18n } from 'vue-i18n';
import { getServiceBaseURL } from '@/utils/service';

let i18n: ReturnType<typeof createI18n>;

const loadedLanguages = new Set<string>();

export async function loadLocaleMessages(lang: string) {
  if (loadedLanguages.has(lang)) return;

  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

  const { data } = await axios.get(`${baseURL}/sys/api/locale/getLocaleJson/${lang}`);
  (i18n.global as Composer).setLocaleMessage(lang, data);
  loadedLanguages.add(lang);
}

export async function setupI18n(app: App) {
  const locale = localStorage.getItem('lang') || 'zh-CN';

  i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'zh-CN',
    messages: {}
  });

  await loadLocaleMessages(locale);

  app.use(i18n);
}

// ✅ Smart overload-safe helper
export const $t = (key: string, params?: Record<string, unknown>) => {
  if (!i18n) {
    console.warn('[i18n] $t called before setupI18n() — returning key as fallback');
    return key;
  }

  const composer = i18n.global as Composer;
  return params ? composer.t(key, params) : composer.t(key);
};
