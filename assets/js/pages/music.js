import { normalizePersian, toast, debounce } from '../utils.js';
import { addRecent } from '../storage.js';

// Popular Iranian / Farsi artists & tracks for instant local boost + Finglish mapping
const LOCAL_BOOST = [
  { title: 'قبستون هیپ‌هاپ', artist: 'رضا پیشرو', q: ['رضا', 'پیشرو', 'reza', 'pishro', 'r pishro'] },
  { title: 'نیلوفر آبی', artist: 'رضا پیشرو', q: ['رضا', 'پیشرو', 'niloofar', 'reza pishro'] },
  { title: 'نیروانا', artist: 'رضا پیشرو', q: ['رضا', 'پیشرو', 'nirvana', 'pishro'] },
  { title: 'ایسرافیل', artist: 'رضا پیشرو', q: ['رضا', 'پیشرو', 'israfil'] },
  { title: 'رپ کردی', artist: 'بهزاد لیتو', q: ['بهزاد', 'لیتو', 'behzad', 'leito'] },
  { title: 'کلاس', artist: 'هیچکس', q: ['هیچکس', 'hichkas', 'هیشکس'] },
  { title: 'یاغی', artist: 'شایع', q: ['شایع', 'shayea'] },
  { title: '#ifdef', artist: 'حصین', q: ['حصین', 'ho3ein', 'hosein'] },
  { title: 'سال ۱۹۹۰', artist: 'امیر تتلو', q: ['تتلو', 'tataloo', 'امیر'] },
  { title: 'مرغ سحر', artist: 'محمدرضا شجریان', q: ['شجریان', 'shajarian', 'مرغ'] },
  { title: 'ببار ای بارون', artist: 'گوگوش', q: ['گوگوش', 'googoosh'] },
  { title: 'سلام', artist: 'گوگوش', q: ['گوگوش', 'googoosh', 'سلام'] },
  { title: 'یار دبستانی من', artist: 'فائزه', q: ['فائزه', 'یار دبستانی'] },
  { title: 'جاده هراز', artist: 'محسن چاوشی', q: ['چاوشی', 'chavoshi', 'محسن'] },
  { title: 'کجایی', artist: 'محسن یگانه', q: ['یگانه', 'yeganeh', 'محسن'] },
  { title: 'نفس', artist: 'مسعود صادقلو', q: ['صادقلو', 'sadeghloo'] },
  { title: '#ifdef', artist: 'علیرضا طلیسچی', q: ['طلیسچی', 'talischi'] },
  { title: 'شبهای بعد از تو', artist: 'ماکان بند', q: ['ماکان', 'macan'] },
  { title: 'دلم گرفت', artist: 'داریوش', q: ['داریوش', 'dariush'] },
  { title: 'گلایه', artist: 'ابی', q: ['ابی', 'ebi'] },
];

// Simple Finglish / common transliteration helpers
const FINGLISH_MAP = {
  'رضا': 'reza', 'پیشرو': 'pishro', 'هیچکس': 'hichkas', 'شایع': 'shayea',
  'حصین': 'ho3ein', 'تتلو': 'tataloo', 'لیتو': 'leito', 'بهزاد': 'behzad',
  'شجریان': 'shajarian', 'گوگوش': 'googoosh', 'چاوشی': 'chavoshi',
  'یگانه': 'yeganeh', 'صادقلو': 'sadeghloo', 'طلیسچی': 'talischi',
  'ماکان': 'macan', 'داریوش': 'dariush', 'ابی': 'ebi', 'محسن': 'mohsen',
  'امیر': 'amir', 'علی': 'ali', 'سجاد': 'sajad', 'سپهر': 'sepehr'
};

function toSearchVariants(query) {
  const q = normalizePersian(query).trim();
  if (!q) return [];
  const variants = new Set([q]);

  // Add Latin if Persian tokens present
  let latin = q;
  Object.entries(FINGLISH_MAP).forEach(([fa, en]) => {
    if (latin.includes(fa)) latin = latin.replaceAll(fa, en);
  });
  if (latin !== q) variants.add(latin);

  // Single letter or short → expand common artists starting with that
  if (q.length <= 2) {
    LOCAL_BOOST.forEach(t => {
      t.q.forEach(k => {
        if (k.startsWith(q) || normalizePersian(k).startsWith(q)) {
          variants.add(k);
          variants.add(t.artist);
        }
      });
    });
  }

  // If pure Persian artist-like, also try first word Latin
  const parts = q.split(/\s+/);
  if (parts.length >= 1 && /[\u0600-\u06FF]/.test(parts[0])) {
    const mapped = FINGLISH_MAP[parts[0]];
    if (mapped) variants.add(mapped);
    if (parts[1] && FINGLISH_MAP[parts[1]]) variants.add(mapped + ' ' + FINGLISH_MAP[parts[1]]);
  }

  return [...variants].slice(0, 4); // limit API calls
}

function localBoostResults(query) {
  const q = normalizePersian(query);
  if (!q) return [];
  return LOCAL_BOOST
    .map(t => {
      let score = 0;
      const hay = normalizePersian(t.title + ' ' + t.artist + ' ' + t.q.join(' '));
      if (hay.includes(q)) score = 90;
      else {
        const words = q.split(/\s+/);
        let hits = 0;
        words.forEach(w => { if (w.length > 1 && hay.includes(w)) hits++; });
        score = Math.round((hits / Math.max(words.length, 1)) * 75);
      }
      // boost prefix
      if (t.q.some(k => k.startsWith(q) || normalizePersian(k).startsWith(q))) score = Math.max(score, 85);
      return { ...t, score, source: 'local' };
    })
    .filter(t => t.score >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

async function searchItunes(term, limit = 20) {
  if (!term || term.length < 1) return [];
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('iTunes error ' + res.status);
  const data = await res.json();
  return (data.results || [])
    .filter(r => r.wrapperType === 'track' || r.kind === 'song')
    .map(r => ({
      id: r.trackId,
      title: r.trackName || r.trackCensoredName,
      artist: r.artistName,
      album: r.collectionName,
      year: r.releaseDate ? r.releaseDate.slice(0, 4) : null,
      artwork: (r.artworkUrl100 || r.artworkUrl60 || '').replace('100x100', '200x200'),
      preview: r.previewUrl || null,
      apple: r.trackViewUrl || r.collectionViewUrl,
      score: 80,
      source: 'itunes'
    }));
}

function mergeResults(local, remote) {
  const seen = new Set();
  const out = [];
  const key = (t) => normalizePersian((t.title || '') + '|' + (t.artist || '')).slice(0, 60);

  [...local, ...remote].forEach(t => {
    const k = key(t);
    if (seen.has(k)) return;
    seen.add(k);
    out.push(t);
  });
  return out.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 30);
}

function externalLinks(title, artist) {
  const q = encodeURIComponent(`${title} ${artist}`.trim());
  const qOnly = encodeURIComponent(title || artist || '');
  return {
    spotify: `https://open.spotify.com/search/${q}`,
    soundcloud: `https://soundcloud.com/search?q=${q}`,
    youtube: `https://music.youtube.com/search?q=${q}`,
    radiojavan: `https://www.radiojavan.com/search?query=${qOnly}`,
  };
}

let currentAudio = null;

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  document.querySelectorAll('.btn-play').forEach(b => {
    b.textContent = '▶ پخش';
    b.classList.remove('playing');
  });
}

function playPreview(url, btn) {
  stopAudio();
  if (!url) {
    toast('پیش‌نمایش صوتی موجود نیست');
    return;
  }
  const audio = new Audio(url);
  currentAudio = audio;
  btn.textContent = '⏸ توقف';
  btn.classList.add('playing');
  audio.play().catch(() => toast('پخش ناموفق'));
  audio.onended = () => {
    btn.textContent = '▶ پخش';
    btn.classList.remove('playing');
    currentAudio = null;
  };
  audio.onerror = () => {
    toast('خطا در پخش پیش‌نمایش');
    stopAudio();
  };
}

function renderTrackCard(t) {
  const links = externalLinks(t.title, t.artist);
  const art = t.artwork
    ? `<img src="${t.artwork}" alt="" loading="lazy" width="56" height="56" style="border-radius:8px;object-fit:cover;" />`
    : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;

  return `
    <div class="track-card" data-id="${t.id || ''}">
      <div class="track-art">${art}</div>
      <div class="track-info">
        <div class="track-title">${escape(t.title)}</div>
        <div class="track-meta">${escape(t.artist)}${t.album ? ' · ' + escape(t.album) : ''}${t.year ? ' · ' + t.year : ''}${t.preview ? ' · ۳۰ثانیه' : ''}</div>
      </div>
      <div class="track-actions flex gap-2 flex-wrap">
        ${t.preview ? `<button class="btn btn-primary btn-sm btn-play" data-preview="${t.preview}">▶ پخش</button>` : ''}
        <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${links.spotify}">Spotify</a>
        <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${links.soundcloud}">SoundCloud</a>
        <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${links.youtube}">YT Music</a>
        <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${links.radiojavan}">رادیو جوان</a>
      </div>
    </div>
  `;
}

function escape(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderMusic(container) {
  addRecent('music');
  stopAudio();

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">MEGA Music</h1>
      <p class="page-desc">جستجوی قوی با iTunes + بوست فارسی. پخش آنلاین پیش‌نمایش ۳۰ ثانیه‌ای + لینک اسپاتیفای، ساندکلاد، یوتیوب و رادیوجوان.</p>
    </div>
    <div class="card mb-2">
      <input type="search" id="music-q" class="input" placeholder="بنویس: رضا، pishro، r، queen، شایع..." autocomplete="off" autofocus />
      <div class="flex gap-2 flex-wrap mt-1" style="align-items:center;">
        <span class="text-sm text-muted" id="music-status">شروع به تایپ کن — نتایج زنده میاد</span>
      </div>
    </div>
    <div id="music-results" class="music-results">
      <div class="empty-state"><p>یه چیزی بنویس تا برات بگردم 🔥</p></div>
    </div>
  `;

  const input = container.querySelector('#music-q');
  const results = container.querySelector('#music-results');
  const status = container.querySelector('#music-status');
  let abortCtrl = null;
  let lastQuery = '';

  const doSearch = async (raw) => {
    const q = raw.trim();
    if (q === lastQuery) return;
    lastQuery = q;

    if (!q) {
      results.innerHTML = `<div class="empty-state"><p>یه چیزی بنویس تا برات بگردم 🔥</p></div>`;
      status.textContent = 'شروع به تایپ کن — نتایج زنده میاد';
      return;
    }

    status.textContent = 'در حال جستجو...';
    results.innerHTML = `<div class="empty-state"><div class="skeleton" style="height:72px;width:100%;margin-bottom:8px;"></div><div class="skeleton" style="height:72px;width:100%;"></div></div>`;

    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();

    try {
      const local = localBoostResults(q);
      const variants = toSearchVariants(q);

      // Parallel iTunes calls for variants (max 2–3 to stay light)
      const remoteLists = await Promise.all(
        variants.slice(0, 3).map(v => searchItunes(v, 18).catch(() => []))
      );
      const remote = remoteLists.flat();

      // Light score boost if title/artist contains original query
      const nq = normalizePersian(q);
      remote.forEach(t => {
        const hay = normalizePersian((t.title || '') + ' ' + (t.artist || ''));
        if (hay.includes(nq)) t.score = 95;
        else if (nq.length <= 2 && hay.startsWith(nq)) t.score = 88;
      });

      const merged = mergeResults(local, remote);

      if (merged.length === 0) {
        const links = externalLinks(q, '');
        results.innerHTML = `
          <div class="empty-state">
            <p>نتیجه‌ای پیدا نشد برای «${escape(q)}»</p>
            <p class="text-sm mt-1">مستقیم برو تو سرویس‌ها:</p>
            <div class="flex gap-2 flex-wrap mt-1" style="justify-content:center;">
              <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${links.spotify}">Spotify</a>
              <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${links.soundcloud}">SoundCloud</a>
              <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${links.youtube}">YT Music</a>
              <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${links.radiojavan}">رادیو جوان</a>
            </div>
          </div>`;
        status.textContent = '۰ نتیجه';
        return;
      }

      results.innerHTML = merged.map(renderTrackCard).join('');
      status.textContent = `${merged.length} نتیجه · پخش = پیش‌نمایش ۳۰ثانیه‌ای واقعی`;

      // bind play buttons
      results.querySelectorAll('.btn-play').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.classList.contains('playing')) {
            stopAudio();
          } else {
            playPreview(btn.dataset.preview, btn);
          }
        });
      });
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.error(e);
      const links = externalLinks(q, '');
      results.innerHTML = `
        <div class="empty-state">
          <p>خطا در ارتباط با سرویس جستجو</p>
          <div class="flex gap-2 flex-wrap mt-1" style="justify-content:center;">
            <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${links.spotify}">Spotify</a>
            <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${links.soundcloud}">SoundCloud</a>
            <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${links.radiojavan}">رادیو جوان</a>
          </div>
        </div>`;
      status.textContent = 'خطا — از لینک‌های مستقیم استفاده کن';
      toast('جستجو ناموفق بود');
    }
  };

  const debounced = debounce(() => doSearch(input.value), 320);
  input.addEventListener('input', debounced);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch(input.value);
    }
  });

  // cleanup on leave
  window.addEventListener('hashchange', stopAudio, { once: true });
}
