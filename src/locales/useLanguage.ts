import { loadLocaleMessages } from '@/locales';

export async function changeLanguage(lang: string, setLang: (lang: string) => void) {
  await loadLocaleMessages(lang);
  setLang(lang); // externally set locale.value = lang
  localStorage.setItem('lang', lang);
}
