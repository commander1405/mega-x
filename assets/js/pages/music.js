import { normalizePersian, toast } from '../utils.js';
import { addRecent } from '../storage.js';

// Small local demo dataset for offline matching demo (not real catalog)
const LOCAL_TRACKS = [
  { title: 'Bohemian Rhapsody', artist: 'Queen', year: 1975, album: 'A Night at the Opera' },
  { title: 'Shape of You', artist: 'Ed Sheeran', year: 2017, album: '÷' },
  { title: 'Blinding Lights', artist: 'The Weeknd', year: 2019, album: 'After Hours' },
  { title: 'Someone Like You', artist: 'Adele', year: 2011, album: '21' },
  { title: 'Hotel California', artist: 'Eagles', year: 1976, album: 'Hotel California' },
  { title: 'سلام', artist: 'گوگوش', year: 1970, album: '—' },
  { title: 'مرغ سحر', artist: 'محمدرضا شجریان', year: 1970, album: '—' },
  { title: 'یار دبستانی من', artist: 'فائزه', year: 1990, album: '—' },
];

function scoreMatch(query, track) {
  const q = normalizePersian(query);
  const t = normalizePersian(track.title + ' ' + track.artist);
  if (!q) return 0;
  if (t.includes(q) || q.includes(normalizePersian(track.title))) return 95;
  const words = q.split(/\s+/);
  let hits = 0;
  words.forEach(w => { if (t.includes(w)) hits++; });
  return Math.round((hits / words.length) * 70);
}

export function renderMusic(container) {
  addRecent('music');
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">MEGA Music</h1>
      <p class="page-desc">جستجوی عنوان / هنرمند با نرمال‌سازی فارسی. نتایج واقعی از کاتالوگ محلی دمو + لینک به سرویس‌های معتبر.</p>
    </div>
    <div class="card mb-2">
      <input type="search" id="music-q" class="input" placeholder="نام آهنگ، خواننده یا بخشی از متن..." autocomplete="off" />
      <p class="text-sm text-muted mt-1">به خاطر محدودیت GitHub Pages، جستجوی زنده از APIهای پولی/کلیددار ممکن نیست. از دیتاست محلی + لینک‌های رسمی استفاده می‌شود.</p>
    </div>
    <div id="music-results" class="music-results"></div>
  `;

  const input = container.querySelector('#music-q');
  const results = container.querySelector('#music-results');

  const search = () => {
    const q = input.value.trim();
    if (!q) {
      results.innerHTML = `<div class="empty-state"><p>چیزی بنویس تا جستجو کنیم</p></div>`;
      return;
    }
    const matches = LOCAL_TRACKS
      .map(t => ({ ...t, score: scoreMatch(q, t) }))
      .filter(t => t.score > 30)
      .sort((a, b) => b.score - a.score);

    if (matches.length === 0) {
      results.innerHTML = `
        <div class="empty-state">
          <p>نتیجه‌ای در دیتاست محلی پیدا نشد.</p>
          <p class="text-sm mt-1">می‌تونی مستقیم در سرویس‌های معتبر جستجو کنی:</p>
          <div class="flex gap-2 flex-wrap mt-1" style="justify-content:center;">
            <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://open.spotify.com/search/${encodeURIComponent(q)}">Spotify</a>
            <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://music.youtube.com/search?q=${encodeURIComponent(q)}">YouTube Music</a>
            <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(q + ' lyrics')}">Google Lyrics</a>
          </div>
        </div>`;
      return;
    }

    results.innerHTML = matches.map(t => `
      <div class="track-card">
        <div class="track-art">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </div>
        <div class="track-info">
          <div class="track-title">${t.title}</div>
          <div class="track-meta">${t.artist} · ${t.album || '—'} · ${t.year || ''} · شباهت ${t.score}%</div>
        </div>
        <div class="flex gap-2">
          <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="https://open.spotify.com/search/${encodeURIComponent(t.title + ' ' + t.artist)}">Spotify</a>
        </div>
      </div>
    `).join('');
  };

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(search, 280);
  });
  search();
}
