import { normalizePersian, toast, debounce } from '../utils.js';
import { addRecent } from '../storage.js';

const LOCAL_BOOST = [
  { title: 'قبستون هیپ‌هاپ', artist: 'رضا پیشرو', q: ['رضا', 'پیشرو', 'reza', 'pishro'] },
  { title: 'نیلوفر آبی', artist: 'رضا پیشرو', q: ['رضا', 'پیشرو', 'niloofar', 'pishro'] },
  { title: 'نیروانا', artist: 'رضا پیشرو', q: ['رضا', 'پیشرو', 'nirvana'] },
  { title: 'ایسرافیل', artist: 'رضا پیشرو', q: ['رضا', 'پیشرو', 'israfil'] },
  { title: 'کلاس', artist: 'هیچکس', q: ['هیچکس', 'hichkas'] },
  { title: 'یاغی', artist: 'شایع', q: ['شایع', 'shayea'] },
  { title: 'رپ کردی', artist: 'بهزاد لیتو', q: ['بهزاد', 'لیتو', 'behzad', 'leito'] },
  { title: 'سال ۱۹۹۰', artist: 'امیر تتلو', q: ['تتلو', 'tataloo'] },
  { title: 'مرغ سحر', artist: 'محمدرضا شجریان', q: ['شجریان', 'shajarian'] },
  { title: 'ببار ای بارون', artist: 'گوگوش', q: ['گوگوش', 'googoosh'] },
  { title: 'جاده هراز', artist: 'محسن چاوشی', q: ['چاوشی', 'chavoshi'] },
  { title: 'کجایی', artist: 'محسن یگانه', q: ['یگانه', 'yeganeh'] },
  { title: 'دلم گرفت', artist: 'داریوش', q: ['داریوش', 'dariush'] },
  { title: 'گلایه', artist: 'ابی', q: ['ابی', 'ebi'] },
];

const FINGLISH = {
  'رضا': 'reza', 'پیشرو': 'pishro', 'هیچکس': 'hichkas', 'شایع': 'shayea',
  'حصین': 'ho3ein', 'تتلو': 'tataloo', 'لیتو': 'leito', 'بهزاد': 'behzad',
  'شجریان': 'shajarian', 'گوگوش': 'googoosh', 'چاوشی': 'chavoshi',
  'یگانه': 'yeganeh', 'داریوش': 'dariush', 'ابی': 'ebi', 'محسن': 'mohsen'
};

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function variants(query) {
  const q = normalizePersian(query).trim();
  if (!q) return [];
  const set = new Set([q]);
  let latin = q;
  Object.entries(FINGLISH).forEach(([fa, en]) => {
    if (latin.includes(fa)) latin = latin.split(fa).join(en);
  });
  if (latin !== q) set.add(latin);
  if (q.length <= 2) {
    LOCAL_BOOST.forEach(t => t.q.forEach(k => {
      if (k.startsWith(q) || normalizePersian(k).startsWith(q)) {
        set.add(k);
        set.add(t.artist);
      }
    }));
  }
  const parts = q.split(/\s+/);
  if (parts[0] && FINGLISH[parts[0]]) {
    set.add(FINGLISH[parts[0]]);
    if (parts[1] && FINGLISH[parts[1]]) set.add(FINGLISH[parts[0]] + ' ' + FINGLISH[parts[1]]);
  }
  return [...set].slice(0, 3);
}

function localBoost(query) {
  const q = normalizePersian(query);
  if (!q) return [];
  return LOCAL_BOOST.map(t => {
    const hay = normalizePersian(t.title + ' ' + t.artist + ' ' + t.q.join(' '));
    let score = 0;
    if (hay.includes(q)) score = 90;
    else {
      const words = q.split(/\s+/);
      let hits = 0;
      words.forEach(w => { if (w.length > 1 && hay.includes(w)) hits++; });
      score = Math.round((hits / Math.max(words.length, 1)) * 75);
    }
    if (t.q.some(k => k.startsWith(q) || normalizePersian(k).startsWith(q))) score = Math.max(score, 85);
    return { ...t, score, source: 'local', preview: null, artwork: null, id: 'local-' + t.title };
  }).filter(t => t.score >= 40).sort((a, b) => b.score - a.score).slice(0, 6);
}

async function itunes(term, limit = 20) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('network');
  const data = await res.json();
  return (data.results || [])
    .filter(r => r.kind === 'song' || r.wrapperType === 'track')
    .map(r => ({
      id: String(r.trackId),
      title: r.trackName || r.trackCensoredName || 'بدون عنوان',
      artist: r.artistName || 'نامشخص',
      album: r.collectionName || '',
      year: r.releaseDate ? r.releaseDate.slice(0, 4) : '',
      artwork: (r.artworkUrl100 || '').replace('100x100bb', '300x300bb').replace('100x100', '300x300'),
      preview: r.previewUrl || null,
      apple: r.trackViewUrl || '',
      score: 80,
      source: 'itunes'
    }));
}

function merge(local, remote) {
  const seen = new Set();
  const out = [];
  const key = t => normalizePersian((t.title || '') + '|' + (t.artist || '')).slice(0, 50);
  [...local, ...remote].forEach(t => {
    const k = key(t);
    if (seen.has(k)) return;
    seen.add(k);
    out.push(t);
  });
  return out.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 28);
}

function links(title, artist) {
  const q = encodeURIComponent(`${title} ${artist}`.trim());
  const qo = encodeURIComponent(title || artist || '');
  return {
    spotify: `https://open.spotify.com/search/${q}`,
    soundcloud: `https://soundcloud.com/search?q=${q}`,
    youtube: `https://music.youtube.com/search?q=${q}`,
    radiojavan: `https://www.radiojavan.com/search?query=${qo}`,
  };
}

function fmtTime(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
}

const player = {
  queue: [],
  index: -1,
  audio: null,
  playing: false,
  els: {},
};

function ensurePlayerDOM() {
  if (document.getElementById('mini-player')) return;

  const mini = document.createElement('div');
  mini.id = 'mini-player';
  mini.className = 'mini-player';
  mini.innerHTML = `
    <img class="mini-art" id="mp-art" alt="" width="44" height="44" />
    <div class="mini-info">
      <div class="mini-title" id="mp-title">—</div>
      <div class="mini-artist" id="mp-artist">—</div>
    </div>
    <div class="mini-controls" onclick="event.stopPropagation()">
      <button type="button" id="mp-prev" aria-label="قبلی">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
      </button>
      <button type="button" class="mini-play" id="mp-play" aria-label="پخش">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </button>
      <button type="button" id="mp-next" aria-label="بعدی">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zm-11 6l8.5 6V6z"/></svg>
      </button>
    </div>
  `;
  document.body.appendChild(mini);

  const overlay = document.createElement('div');
  overlay.id = 'player-overlay';
  overlay.className = 'player-overlay';
  document.body.appendChild(overlay);

  const sheet = document.createElement('div');
  sheet.id = 'player-sheet';
  sheet.className = 'player-sheet';
  sheet.innerHTML = `
    <div class="player-handle"></div>
    <div class="player-body">
      <div class="player-art-wrap">
        <div class="player-art-glow"></div>
        <img id="fp-art" alt="" />
      </div>
      <div class="player-track-title" id="fp-title">—</div>
      <div class="player-track-artist" id="fp-artist">—</div>
      <div class="player-badge">پیش‌نمایش ۳۰ ثانیه‌ای · پخش کامل در سرویس‌های اصلی</div>
      <div class="player-progress-wrap">
        <input type="range" class="player-seek" id="fp-seek" min="0" max="1000" value="0" />
        <div class="player-time"><span id="fp-cur">0:00</span><span id="fp-dur">0:30</span></div>
      </div>
      <div class="player-controls">
        <button type="button" class="player-btn-sm" id="fp-prev" aria-label="آهنگ قبلی">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>
        <button type="button" class="player-btn-main" id="fp-play" aria-label="پخش یا توقف">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button type="button" class="player-btn-sm" id="fp-next" aria-label="آهنگ بعدی">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zm-11 6l8.5 6V6z"/></svg>
        </button>
      </div>
      <div class="player-links" id="fp-links"></div>
      <button type="button" class="playlist-toggle" id="fp-pl-toggle">
        <span>پلی‌لیست نتایج</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="playlist-panel" id="fp-playlist"></div>
    </div>
  `;
  document.body.appendChild(sheet);

  player.els = {
    mini, overlay, sheet,
    mpArt: document.getElementById('mp-art'),
    mpTitle: document.getElementById('mp-title'),
    mpArtist: document.getElementById('mp-artist'),
    mpPlay: document.getElementById('mp-play'),
    mpPrev: document.getElementById('mp-prev'),
    mpNext: document.getElementById('mp-next'),
    fpArt: document.getElementById('fp-art'),
    fpTitle: document.getElementById('fp-title'),
    fpArtist: document.getElementById('fp-artist'),
    fpSeek: document.getElementById('fp-seek'),
    fpCur: document.getElementById('fp-cur'),
    fpDur: document.getElementById('fp-dur'),
    fpPlay: document.getElementById('fp-play'),
    fpPrev: document.getElementById('fp-prev'),
    fpNext: document.getElementById('fp-next'),
    fpLinks: document.getElementById('fp-links'),
    fpPlToggle: document.getElementById('fp-pl-toggle'),
    fpPlaylist: document.getElementById('fp-playlist'),
  };

  mini.addEventListener('click', openSheet);
  overlay.addEventListener('click', closeSheet);
  player.els.fpPlToggle.addEventListener('click', () => {
    player.els.fpPlaylist.classList.toggle('open');
  });
  player.els.mpPlay.addEventListener('click', e => { e.stopPropagation(); togglePlay(); });
  player.els.fpPlay.addEventListener('click', togglePlay);
  player.els.mpPrev.addEventListener('click', e => { e.stopPropagation(); playAt(player.index - 1); });
  player.els.fpPrev.addEventListener('click', () => playAt(player.index - 1));
  player.els.mpNext.addEventListener('click', e => { e.stopPropagation(); playAt(player.index + 1); });
  player.els.fpNext.addEventListener('click', () => playAt(player.index + 1));

  player.els.fpSeek.addEventListener('input', () => {
    if (!player.audio || !player.audio.duration) return;
    const t = (player.els.fpSeek.value / 1000) * player.audio.duration;
    player.audio.currentTime = t;
  });
}

function openSheet() {
  player.els.overlay.classList.add('open');
  player.els.sheet.classList.add('open');
  renderPlaylistPanel();
}

function closeSheet() {
  player.els.overlay.classList.remove('open');
  player.els.sheet.classList.remove('open');
  player.els.fpPlaylist.classList.remove('open');
}

function setPlayIcons(playing) {
  const playSvg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  const pauseSvg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
  const playBig = '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  const pauseBig = '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
  if (player.els.mpPlay) player.els.mpPlay.innerHTML = playing ? pauseSvg : playSvg;
  if (player.els.fpPlay) player.els.fpPlay.innerHTML = playing ? pauseBig : playBig;
}

function updateUI(track) {
  if (!track) return;
  const art = track.artwork || '';
  player.els.mpArt.src = art;
  player.els.mpArt.style.display = art ? '' : 'none';
  player.els.fpArt.src = art;
  player.els.mpTitle.textContent = track.title;
  player.els.mpArtist.textContent = track.artist;
  player.els.fpTitle.textContent = track.title;
  player.els.fpArtist.textContent = track.artist + (track.album ? ' · ' + track.album : '');

  const L = links(track.title, track.artist);
  player.els.fpLinks.innerHTML = `
    <a target="_blank" rel="noopener" href="${L.spotify}">Spotify</a>
    <a target="_blank" rel="noopener" href="${L.soundcloud}">SoundCloud</a>
    <a target="_blank" rel="noopener" href="${L.youtube}">YT Music</a>
    <a target="_blank" rel="noopener" href="${L.radiojavan}">رادیو جوان</a>
  `;
  renderPlaylistPanel();
}

function renderPlaylistPanel() {
  const el = player.els.fpPlaylist;
  if (!el) return;
  el.innerHTML = player.queue.map((t, i) => `
    <div class="playlist-item ${i === player.index ? 'active' : ''}" data-idx="${i}">
      ${t.artwork ? `<img src="${t.artwork}" alt="" width="40" height="40" />` : '<div style="width:40px;height:40px;border-radius:6px;background:rgba(255,255,255,0.08)"></div>'}
      <div class="playlist-item-info">
        <div class="playlist-item-title">${esc(t.title)}</div>
        <div class="playlist-item-artist">${esc(t.artist)}</div>
      </div>
      ${t.preview ? '<span style="font-size:0.7rem;color:var(--accent)">▶</span>' : ''}
    </div>
  `).join('');
  el.querySelectorAll('.playlist-item').forEach(item => {
    item.addEventListener('click', () => playAt(parseInt(item.dataset.idx, 10)));
  });
}

function tick() {
  if (!player.audio) return;
  const a = player.audio;
  if (a.duration) {
    player.els.fpSeek.value = Math.round((a.currentTime / a.duration) * 1000);
    player.els.fpCur.textContent = fmtTime(a.currentTime);
    player.els.fpDur.textContent = fmtTime(a.duration);
  }
  if (player.playing) requestAnimationFrame(tick);
}

function playAt(idx) {
  if (!player.queue.length) return;
  if (idx < 0) idx = player.queue.length - 1;
  if (idx >= player.queue.length) idx = 0;
  const track = player.queue[idx];
  player.index = idx;

  if (!track.preview) {
    updateUI(track);
    toast('پیش‌نمایش صوتی ندارد — از لینک‌های زیر استفاده کن');
    openSheet();
    return;
  }

  if (player.audio) {
    player.audio.pause();
    player.audio.src = '';
  }
  const audio = new Audio(track.preview);
  player.audio = audio;
  player.playing = true;
  updateUI(track);
  setPlayIcons(true);
  player.els.mini.classList.add('show');
  document.body.classList.add('has-player');

  audio.play().catch(() => {
    toast('پخش ممکن نشد');
    player.playing = false;
    setPlayIcons(false);
  });
  audio.onended = () => playAt(player.index + 1);
  audio.onerror = () => {
    toast('خطا در بارگذاری صدا');
    player.playing = false;
    setPlayIcons(false);
  };
  requestAnimationFrame(tick);
}

function togglePlay() {
  if (!player.audio) {
    if (player.queue.length && player.index >= 0) playAt(player.index);
    return;
  }
  if (player.playing) {
    player.audio.pause();
    player.playing = false;
    setPlayIcons(false);
  } else {
    player.audio.play().catch(() => toast('پخش ممکن نشد'));
    player.playing = true;
    setPlayIcons(true);
    requestAnimationFrame(tick);
  }
}

function setQueue(list, startIndex) {
  player.queue = list;
  playAt(startIndex);
  openSheet();
}

export function renderMusic(container) {
  addRecent('music');
  ensurePlayerDOM();

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">موسیقی</h1>
      <p class="page-desc">جستجوی زنده · پیش‌نمایش ۳۰ثانیه‌ای با پلیر شیشه‌ای · پلی‌لیست نتایج · لینک اسپاتیفای، ساندکلاد، یوتیوب و رادیوجوان</p>
    </div>
    <div class="card mb-2 glass">
      <input type="search" id="music-q" class="input" placeholder="رضا · pishro · r · queen · شایع..." autocomplete="off" autofocus />
      <p class="text-sm text-muted mt-1" id="music-status">شروع به نوشتن کن — نتایج همان لحظه می‌آید</p>
    </div>
    <div id="music-results" class="music-results">
      <div class="empty-state"><p>چیزی بنویس تا برات پیدا کنم</p></div>
    </div>
  `;

  const input = container.querySelector('#music-q');
  const results = container.querySelector('#music-results');
  const status = container.querySelector('#music-status');
  let last = '';
  let ctrl = null;

  const search = async (raw) => {
    const q = raw.trim();
    if (q === last) return;
    last = q;
    if (!q) {
      results.innerHTML = `<div class="empty-state"><p>چیزی بنویس تا برات پیدا کنم</p></div>`;
      status.textContent = 'شروع به نوشتن کن — نتایج همان لحظه می‌آید';
      return;
    }
    status.textContent = 'در حال جستجو...';
    results.innerHTML = `<div class="skeleton" style="height:80px;margin-bottom:8px;border-radius:12px;"></div><div class="skeleton" style="height:80px;border-radius:12px;"></div>`;
    if (ctrl) ctrl.abort();
    ctrl = new AbortController();

    try {
      const loc = localBoost(q);
      const vars = variants(q);
      const rem = (await Promise.all(vars.map(v => itunes(v, 16).catch(() => [])))).flat();
      const nq = normalizePersian(q);
      rem.forEach(t => {
        const hay = normalizePersian(t.title + ' ' + t.artist);
        if (hay.includes(nq)) t.score = 95;
        else if (nq.length <= 2 && hay.startsWith(nq)) t.score = 88;
      });
      const list = merge(loc, rem);

      if (!list.length) {
        const L = links(q, '');
        results.innerHTML = `
          <div class="empty-state">
            <p>چیزی برای «${esc(q)}» پیدا نشد</p>
            <div class="flex gap-2 flex-wrap mt-1" style="justify-content:center;">
              <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${L.spotify}">Spotify</a>
              <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${L.soundcloud}">SoundCloud</a>
              <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${L.radiojavan}">رادیو جوان</a>
            </div>
          </div>`;
        status.textContent = '۰ نتیجه';
        return;
      }

      results.innerHTML = list.map((t, i) => `
        <div class="track-card" data-idx="${i}">
          <div class="track-art">
            ${t.artwork ? `<img src="${t.artwork}" alt="" loading="lazy" width="56" height="56" style="border-radius:8px;object-fit:cover;" />` : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`}
          </div>
          <div class="track-info">
            <div class="track-title">${esc(t.title)}</div>
            <div class="track-meta">${esc(t.artist)}${t.album ? ' · ' + esc(t.album) : ''}${t.year ? ' · ' + t.year : ''}${t.preview ? ' · قابل پخش' : ''}</div>
          </div>
          <div class="track-actions flex gap-2 flex-wrap">
            <button type="button" class="btn btn-primary btn-sm btn-play-track" data-idx="${i}">${t.preview ? '▶ پخش' : 'لینک‌ها'}</button>
          </div>
        </div>
      `).join('');

      status.textContent = `${list.length} نتیجه · پخش = پیش‌نمایش واقعی · بعدی و قبلی از همین لیست`;

      results.querySelectorAll('.btn-play-track').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          setQueue(list, parseInt(btn.dataset.idx, 10));
        });
      });
      results.querySelectorAll('.track-card').forEach(card => {
        card.addEventListener('click', e => {
          if (e.target.closest('button, a')) return;
          setQueue(list, parseInt(card.dataset.idx, 10));
        });
      });
    } catch (e) {
      if (e.name === 'AbortError') return;
      const L = links(q, '');
      results.innerHTML = `
        <div class="empty-state">
          <p>ارتباط با سرویس جستجو برقرار نشد</p>
          <div class="flex gap-2 flex-wrap mt-1" style="justify-content:center;">
            <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${L.spotify}">Spotify</a>
            <a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${L.soundcloud}">SoundCloud</a>
          </div>
        </div>`;
      status.textContent = 'خطا در شبکه';
    }
  };

  const deb = debounce(() => search(input.value), 300);
  input.addEventListener('input', deb);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      search(input.value);
    }
  });
}
