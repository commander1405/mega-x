import { getRecent, getFavorites } from '../storage.js';
import { navigate } from '../router.js';

const tools = [
  { id: 'text', title: 'ابزار متن', icon: 'text', route: '/tools/text' },
  { id: 'hash', title: 'هش و UUID', icon: 'hash', route: '/tools/hash' },
  { id: 'qr', title: 'QR Code', icon: 'qr', route: '/tools/qr' },
  { id: 'music', title: 'موسیقی', icon: 'music', route: '/music' },
  { id: 'web', title: 'تحلیل URL', icon: 'web', route: '/web' },
  { id: 'tts', title: 'متن به گفتار', icon: 'tts', route: '/media' },
];

export function renderHome(container) {
  const recent = getRecent();
  const favs = getFavorites();

  container.innerHTML = `
    <section class="hero">
      <h1 class="hero-title">MEGA X</h1>
      <p class="hero-desc">پلتفرم ابزارهای مرورگرمحور. سریع، خصوصی، بدون سرور. همه چیز روی دستگاه خودت اجرا می‌شه.</p>
      <div class="privacy-badge" style="justify-content:center;margin-bottom:1.5rem;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>داده فقط در localStorage مرورگر شما ذخیره می‌شود</span>
      </div>
    </section>

    <section>
      <h2 class="section-title">دسترسی سریع</h2>
      <div class="tools-grid" id="quick-tools"></div>
    </section>

    <section class="mt-2" id="recent-section">
      <h2 class="section-title">اخیراً استفاده‌شده</h2>
      <div id="recent-list"></div>
    </section>
  `;

  const grid = container.querySelector('#quick-tools');
  tools.forEach(t => {
    const card = document.createElement('div');
    card.className = 'tool-card';
    card.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${getIcon(t.icon)}</svg>
      <span>${t.title}</span>
    `;
    card.addEventListener('click', () => navigate(t.route));
    grid.appendChild(card);
  });

  const recentEl = container.querySelector('#recent-list');
  if (recent.length === 0) {
    recentEl.innerHTML = `<div class="empty-state"><p>هنوز ابزاری استفاده نکردی. از بالا یکی انتخاب کن.</p></div>`;
  } else {
    recentEl.innerHTML = `<div class="tools-grid">${recent.map(id => {
      const t = tools.find(x => x.id === id) || { title: id, route: '/tools' };
      return `<div class="tool-card" data-route="${t.route}"><span>${t.title}</span></div>`;
    }).join('')}</div>`;
    recentEl.querySelectorAll('[data-route]').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.route));
    });
  }
}

function getIcon(name) {
  const icons = {
    text: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M17 14h.01M14 17h.01"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    web: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>',
    tts: '<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>',
  };
  return icons[name] || icons.text;
}
