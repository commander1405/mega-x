import { get, set } from './storage.js';

export function initTheme() {
  const saved = get('theme', 'dark');
  applyTheme(saved);
  return saved;
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
  const sun = document.querySelector('.icon-sun');
  const moon = document.querySelector('.icon-moon');
  if (sun && moon) {
    if (theme === 'light') {
      sun.hidden = true;
      moon.hidden = false;
    } else {
      sun.hidden = false;
      moon.hidden = true;
    }
  }
  set('theme', theme);
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
