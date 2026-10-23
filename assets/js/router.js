const routes = {};
let current = null;

export function register(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  if (window.location.hash.slice(1) !== path) {
    window.location.hash = path;
  } else {
    render(path);
  }
}

function render(path) {
  const clean = path.replace(/^\/+/, '') || 'home';
  const base = clean.split('/')[0];
  const handler = routes[base] || routes['home'];
  current = base;

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === base);
  });

  const content = document.getElementById('content');
  if (content && handler) {
    content.innerHTML = '';
    handler(content, clean);
  }

  // close mobile menu
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('overlay')?.setAttribute('hidden', '');
}

export function initRouter() {
  window.addEventListener('hashchange', () => {
    render(window.location.hash.slice(1) || '/');
  });
  render(window.location.hash.slice(1) || '/');
}

export function getCurrent() {
  return current;
}
