import { toast, downloadBlob } from '../utils.js';

export function renderQRTools(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">تولید QR Code</h1>
      <p class="page-desc">متن یا لینک را به QR تبدیل کن. پیش‌نمایش زنده + دانلود.</p>
    </div>
    <div class="tool-panel two-col">
      <div class="card">
        <label class="form-label">متن یا URL</label>
        <textarea id="qr-input" class="textarea" placeholder="https://example.com یا هر متنی..." rows="4"></textarea>
        <div class="form-group mt-1">
          <label class="form-label">اندازه (پیکسل)</label>
          <select id="qr-size" class="select">
            <option value="200">200</option>
            <option value="300" selected>300</option>
            <option value="400">400</option>
            <option value="500">500</option>
          </select>
        </div>
        <button class="btn btn-primary mt-1 w-full" id="btn-gen-qr">تولید QR</button>
      </div>
      <div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:280px;">
        <div id="qr-preview" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M17 14h.01M14 17h.01M17 17h.01M20 14h.01M14 20h.01M17 20h.01M20 17h.01M20 20h.01"/></svg>
          <p>پیش‌نمایش اینجا ظاهر می‌شود</p>
        </div>
        <img id="qr-img" class="hidden" alt="QR Code" style="max-width:100%;border-radius:8px;" />
        <button class="btn btn-ghost btn-sm mt-1 hidden" id="btn-dl-qr">دانلود PNG</button>
      </div>
    </div>
    <p class="text-sm text-muted mt-2">از سرویس عمومی api.qrserver.com برای تولید تصویر استفاده می‌شود. داده شما فقط برای ساخت تصویر ارسال می‌شود.</p>
  `;

  const input = container.querySelector('#qr-input');
  const sizeSel = container.querySelector('#qr-size');
  const preview = container.querySelector('#qr-preview');
  const img = container.querySelector('#qr-img');
  const dlBtn = container.querySelector('#btn-dl-qr');

  const generate = () => {
    const text = input.value.trim();
    if (!text) {
      toast('متن خالی است');
      return;
    }
    const size = sizeSel.value;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&margin=10`;
    img.src = url;
    img.classList.remove('hidden');
    preview.classList.add('hidden');
    dlBtn.classList.remove('hidden');
    toast('QR آماده');
  };

  container.querySelector('#btn-gen-qr').addEventListener('click', generate);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); } });

  dlBtn.addEventListener('click', async () => {
    try {
      const res = await fetch(img.src);
      const blob = await res.blob();
      downloadBlob(blob, 'megax-qr.png');
      toast('دانلود شد');
    } catch {
      toast('دانلود ناموفق — تصویر را راست‌کلیک کن');
    }
  });
}
