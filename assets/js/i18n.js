import { get, set } from './storage.js';

const dict = {
  fa: {
    home: 'خانه',
    music: 'موسیقی',
    web: 'وب',
    tools: 'ابزارها',
    media: 'مدیا',
    settings: 'تنظیمات',
    search_placeholder: 'جستجو در ابزارها...',
    privacy_note: 'همه داده‌ها فقط روی مرورگر شما ذخیره می‌شوند.',
  },
  en: {
    home: 'Home',
    music: 'Music',
    web: 'Web',
    tools: 'Tools',
    media: 'Media',
    settings: 'Settings',
    search_placeholder: 'Search tools...',
    privacy_note: 'All data stays only in your browser.',
  }
};

let lang = 'fa';

export function initI18n() {
  lang = get('lang', 'fa');
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  return lang;
}

export function t(key) {
  return (dict[lang] && dict[lang][key]) || key;
}

export function setLang(l) {
  lang = l === 'en' ? 'en' : 'fa';
  set('lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  return lang;
}

export function getLang() {
  return lang;
}
