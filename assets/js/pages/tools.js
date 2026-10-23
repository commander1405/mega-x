import { renderTextTools } from '../tools/text.js';
import { renderHashTools } from '../tools/hash.js';
import { renderQRTools } from '../tools/qr.js';
import { addRecent } from '../storage.js';
import { navigate } from '../router.js';

export function renderTools(container, path) {
  const sub = (path || '').split('/')[1];

  if (sub === 'text') {
    addRecent('text');
    renderTextTools(container);
    return;
  }
  if (sub === 'hash') {
    addRecent('hash');
    renderHashTools(container);
    return;
  }
  if (sub === 'qr') {
    addRecent('qr');
    renderQRTools(container);
    return;
  }

  // index
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">ابزارها</h1>
      <p class="page-desc">ابزارهای خالص مرورگر — بدون ارسال داده به سرور</p>
    </div>
    <div class="tools-grid">
      <div class="tool-card" data-go="/tools/text">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" width="32" height="32"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
        <span>ابزار متن</span>
      </div>
      <div class="tool-card" data-go="/tools/hash">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" width="32" height="32"><path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/></svg>
        <span>هش و UUID</span>
      </div>
      <div class="tool-card" data-go="/tools/qr">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" width="32" height="32"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span>QR Code</span>
      </div>
    </div>
  `;
  container.querySelectorAll('[data-go]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.go));
  });
}
