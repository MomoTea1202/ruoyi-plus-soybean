import { useI18n } from 'vue-i18n';
import { loadLocaleMessages } from '@/locales';

export async function changeLanguage(lang: string) {
  const { locale } = useI18n();
  await loadLocaleMessages(lang);
  locale.value = lang;
  localStorage.setItem('lang', lang);
}
