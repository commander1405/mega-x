import { initRouter, register } from './router.js';
import { initTheme, toggleTheme } from './theme.js';
import { initI18n } from './i18n.js';
import { renderHome } from './pages/home.js';
import { renderTools } from './pages/tools.js';
import { renderMusic } from './pages/music.js';
import { renderWeb } from './pages/web.js';
import { renderMedia } from './pages/media.js';
import { renderSettings } from './pages/settings.js';

// Register routes
register('home', renderHome);
register('', renderHome);
register('tools', renderTools);
register('music', renderMusic);
register('web', renderWeb);
register('media', renderMedia);
register('settings', renderSettings);

function initNav() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const menuBtn = document.getElementById('menu-toggle');
  const closeBtn = document.getElementById('sidebar-close');

  menuBtn?.addEventListener('click', () => {
    sidebar?.classList.add('open');
    overlay?.removeAttribute('hidden');
  });
  closeBtn?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    overlay?.setAttribute('hidden', '');
  });
  overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    overlay?.setAttribute('hidden', '');
  });

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    toggleTheme();
  });

  // Global search simple
  const search = document.getElementById('global-search');
  search?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = search.value.trim().toLowerCase();
      if (q.includes('موسیقی') || q.includes('music')) location.hash = '#/music';
      else if (q.includes('وب') || q.includes('url') || q.includes('web')) location.hash = '#/web';
      else if (q.includes('متن') || q.includes('text')) location.hash = '#/tools/text';
      else if (q.includes('هش') || q.includes('hash') || q.includes('uuid')) location.hash = '#/tools/hash';
      else if (q.includes('qr')) location.hash = '#/tools/qr';
      else if (q.includes('مدیا') || q.includes('tts') || q.includes('گفتار')) location.hash = '#/media';
      else if (q.includes('تنظیم') || q.includes('setting')) location.hash = '#/settings';
      else location.hash = '#/tools';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initI18n();
  initNav();
  initRouter();
});
