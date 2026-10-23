import { clearAll, get } from '../storage.js';
import { applyTheme, toggleTheme } from '../theme.js';
import { setLang, getLang } from '../i18n.js';
import { toast } from '../utils.js';

export function renderSettings(container) {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const lang = getLang();

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">تنظیمات</h1>
      <p class="page-desc">ترجیحات محلی و حریم خصوصی</p>
    </div>
    <div class="settings-list">
      <div class="settings-item">
        <div>
          <div style="font-weight:600">تم</div>
          <div class="text-sm text-muted">تاریک / روشن</div>
        </div>
        <button class="btn btn-ghost btn-sm" id="set-theme">${theme === 'dark' ? 'روشن کن' : 'تاریک کن'}</button>
      </div>
      <div class="settings-item">
        <div>
          <div style="font-weight:600">زبان</div>
          <div class="text-sm text-muted">فعلاً فارسی کامل + ساختار انگلیسی</div>
        </div>
        <select id="set-lang" class="select" style="width:auto">
          <option value="fa" ${lang === 'fa' ? 'selected' : ''}>فارسی</option>
          <option value="en" ${lang === 'en' ? 'selected' : ''}>English</option>
        </select>
      </div>
      <div class="settings-item">
        <div>
          <div style="font-weight:600">پاک کردن داده‌های محلی</div>
          <div class="text-sm text-muted">علاقه‌مندی‌ها، تاریخچه، تنظیمات</div>
        </div>
        <button class="btn btn-ghost btn-sm" id="clear-data" style="color:var(--danger)">پاک کردن</button>
      </div>
    </div>

    <div class="card mt-2">
      <h3 class="section-title">درباره MEGA X</h3>
      <p class="text-sm text-muted">نسخه ۱.۰ — ساخته‌شده برای GitHub Pages. بدون بک‌اند. همه پردازش‌ها سمت مرورگر.</p>
      <p class="text-sm text-muted mt-1">حریم خصوصی: هیچ داده‌ای به سرور ما ارسال نمی‌شود چون اصلاً سروری وجود ندارد. localStorage فقط روی همین دستگاه است.</p>
    </div>
  `;

  container.querySelector('#set-theme').addEventListener('click', () => {
    const next = toggleTheme();
    toast(next === 'dark' ? 'تم تاریک' : 'تم روشن');
    renderSettings(container); // refresh label
  });

  container.querySelector('#set-lang').addEventListener('change', (e) => {
    setLang(e.target.value);
    toast(e.target.value === 'fa' ? 'زبان فارسی' : 'English');
    // full re-render would need app restart; for now just dir change
  });

  container.querySelector('#clear-data').addEventListener('click', () => {
    if (confirm('مطمئنی همه داده‌های محلی پاک بشه؟')) {
      clearAll();
      toast('پاک شد');
    }
  });
}
