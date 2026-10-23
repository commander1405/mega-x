import { toast, copyToClipboard } from '../utils.js';
import { addRecent } from '../storage.js';

export function renderWeb(container) {
  addRecent('web');
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">MEGA Web</h1>
      <p class="page-desc">تحلیل و اعتبارسنجی URL در مرورگر. بدون درخواست سروری برای وضعیت HTTP.</p>
    </div>
    <div class="tool-panel">
      <div class="card">
        <label class="form-label">آدرس URL</label>
        <input type="url" id="url-input" class="input" placeholder="https://example.com/path?q=1" />
        <div class="flex gap-2 flex-wrap mt-1">
          <button class="btn btn-primary btn-sm" id="btn-analyze">تحلیل</button>
          <button class="btn btn-ghost btn-sm" id="btn-copy-url">کپی URL</button>
          <button class="btn btn-ghost btn-sm" id="btn-open">باز کردن در تب جدید</button>
        </div>
      </div>
      <div class="card" id="url-result">
        <div class="empty-state"><p>URL را وارد کن تا جزئیاتش نمایش داده شود</p></div>
      </div>
    </div>
    <p class="text-sm text-muted mt-2">اسکرین‌شات و بررسی وضعیت HTTP واقعی به خاطر محدودیت static hosting ممکن نیست. از ابزارهای مرورگر خودت یا سرویس‌های معتبر استفاده کن.</p>
  `;

  const input = container.querySelector('#url-input');
  const result = container.querySelector('#url-result');

  const analyze = () => {
    let raw = input.value.trim();
    if (!raw) {
      toast('URL خالی است');
      return;
    }
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;

    try {
      const u = new URL(raw);
      const suspicious = /@|javascript:|data:|vbscript:/i.test(raw) || u.username || u.password;
      result.innerHTML = `
        <div class="stats-row">
          <div class="stat"><div class="stat-value" style="font-size:0.95rem">${u.protocol.replace(':','')}</div><div class="stat-label">پروتکل</div></div>
          <div class="stat"><div class="stat-value" style="font-size:0.95rem">${u.hostname}</div><div class="stat-label">دامنه</div></div>
          <div class="stat"><div class="stat-value" style="font-size:0.95rem">${u.port || 'پیش‌فرض'}</div><div class="stat-label">پورت</div></div>
        </div>
        <div class="mt-2">
          <div class="form-label">مسیر</div>
          <div class="result-box">${u.pathname || '/'}</div>
        </div>
        ${u.search ? `<div class="mt-1"><div class="form-label">Query</div><div class="result-box">${u.search}</div></div>` : ''}
        ${u.hash ? `<div class="mt-1"><div class="form-label">Hash</div><div class="result-box">${u.hash}</div></div>` : ''}
        <div class="mt-1"><div class="form-label">نرمال‌شده</div><div class="result-box">${u.href}</div></div>
        ${suspicious ? `<p class="mt-1" style="color:var(--warning)">⚠ فرمت مشکوک تشخیص داده شد — مراقب باش</p>` : ''}
      `;
      toast('تحلیل شد');
    } catch (e) {
      result.innerHTML = `<div class="empty-state"><p style="color:var(--danger)">URL نامعتبر: ${e.message}</p></div>`;
      toast('URL نامعتبر');
    }
  };

  container.querySelector('#btn-analyze').addEventListener('click', analyze);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') analyze(); });

  container.querySelector('#btn-copy-url').addEventListener('click', async () => {
    if (input.value) {
      await copyToClipboard(input.value);
      toast('کپی شد');
    }
  });

  container.querySelector('#btn-open').addEventListener('click', () => {
    let raw = input.value.trim();
    if (!raw) return;
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
    try {
      new URL(raw);
      window.open(raw, '_blank', 'noopener');
    } catch {
      toast('URL نامعتبر');
    }
  });
}
