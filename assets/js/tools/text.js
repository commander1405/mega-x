import { toast, downloadBlob, escapeHtml } from '../utils.js';

export function renderTextTools(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">ابزارهای متن</h1>
      <p class="page-desc">شمارش، تبدیل، پاک‌سازی و مقایسه متن — همه داخل مرورگر</p>
    </div>
    <div class="tool-panel">
      <div class="card">
        <label class="form-label" for="text-input">متن ورودی</label>
        <textarea id="text-input" class="textarea" placeholder="متن خود را اینجا بنویسید..." rows="8"></textarea>
        <div class="stats-row" id="text-stats">
          <div class="stat"><div class="stat-value" id="stat-chars">0</div><div class="stat-label">کاراکتر</div></div>
          <div class="stat"><div class="stat-value" id="stat-words">0</div><div class="stat-label">کلمه</div></div>
          <div class="stat"><div class="stat-value" id="stat-lines">0</div><div class="stat-label">خط</div></div>
        </div>
      </div>
      <div class="card">
        <div class="flex gap-2 flex-wrap">
          <button class="btn btn-ghost btn-sm" data-action="upper">حروف بزرگ</button>
          <button class="btn btn-ghost btn-sm" data-action="lower">حروف کوچک</button>
          <button class="btn btn-ghost btn-sm" data-action="trim">پاک‌سازی فاصله</button>
          <button class="btn btn-ghost btn-sm" data-action="dedupe">حذف خطوط تکراری</button>
          <button class="btn btn-ghost btn-sm" data-action="sort">مرتب‌سازی خطوط</button>
          <button class="btn btn-ghost btn-sm" data-action="reverse">برعکس کردن</button>
          <button class="btn btn-primary btn-sm" data-action="export">دانلود TXT</button>
        </div>
      </div>
      <div class="card">
        <h3 class="section-title">مقایسه متن</h3>
        <textarea id="text-compare" class="textarea" placeholder="متن دوم برای مقایسه..." rows="4"></textarea>
        <button class="btn btn-ghost mt-1" id="btn-compare">مقایسه</button>
        <div id="compare-result" class="result-box mt-1 hidden"></div>
      </div>
      <div class="card">
        <h3 class="section-title">JSON / Encode</h3>
        <div class="flex gap-2 flex-wrap">
          <button class="btn btn-ghost btn-sm" data-action="json-fmt">فرمت JSON</button>
          <button class="btn btn-ghost btn-sm" data-action="url-enc">URL Encode</button>
          <button class="btn btn-ghost btn-sm" data-action="url-dec">URL Decode</button>
          <button class="btn btn-ghost btn-sm" data-action="b64-enc">Base64 Encode</button>
          <button class="btn btn-ghost btn-sm" data-action="b64-dec">Base64 Decode</button>
        </div>
      </div>
    </div>
  `;

  const input = container.querySelector('#text-input');
  const updateStats = () => {
    const t = input.value;
    container.querySelector('#stat-chars').textContent = t.length;
    container.querySelector('#stat-words').textContent = t.trim() ? t.trim().split(/\s+/).length : 0;
    container.querySelector('#stat-lines').textContent = t ? t.split('\n').length : 0;
  };
  input.addEventListener('input', updateStats);

  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      let val = input.value;
      try {
        if (action === 'upper') val = val.toUpperCase();
        else if (action === 'lower') val = val.toLowerCase();
        else if (action === 'trim') val = val.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
        else if (action === 'dedupe') {
          const lines = val.split('\n');
          val = [...new Set(lines)].join('\n');
        }
        else if (action === 'sort') val = val.split('\n').sort((a,b) => a.localeCompare(b, 'fa')).join('\n');
        else if (action === 'reverse') val = val.split('').reverse().join('');
        else if (action === 'export') {
          downloadBlob(new Blob([val], {type:'text/plain;charset=utf-8'}), 'megax-text.txt');
          toast('فایل دانلود شد');
          return;
        }
        else if (action === 'json-fmt') {
          val = JSON.stringify(JSON.parse(val), null, 2);
        }
        else if (action === 'url-enc') val = encodeURIComponent(val);
        else if (action === 'url-dec') val = decodeURIComponent(val);
        else if (action === 'b64-enc') val = btoa(unescape(encodeURIComponent(val)));
        else if (action === 'b64-dec') val = decodeURIComponent(escape(atob(val)));
        input.value = val;
        updateStats();
        toast('انجام شد');
      } catch (e) {
        toast('خطا: ' + (e.message || 'عملیات ناموفق'));
      }
    });
  });

  container.querySelector('#btn-compare').addEventListener('click', () => {
    const a = input.value;
    const b = container.querySelector('#text-compare').value;
    const res = container.querySelector('#compare-result');
    if (a === b) {
      res.textContent = 'دو متن کاملاً یکسان هستند.';
    } else {
      res.textContent = `تفاوت وجود دارد. طول اول: ${a.length} | طول دوم: ${b.length}`;
    }
    res.classList.remove('hidden');
  });
}
