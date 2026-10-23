import { toast } from '../utils.js';
import { addRecent } from '../storage.js';

export function renderMedia(container) {
  addRecent('tts');
  const supported = 'speechSynthesis' in window;

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">MEGA Media</h1>
      <p class="page-desc">متن به گفتار با Web Speech API مرورگر. پشتیبانی بسته به مرورگر و سیستم‌عامل فرق می‌کند.</p>
    </div>
    <div class="tool-panel">
      <div class="card">
        <label class="form-label">متن</label>
        <textarea id="tts-text" class="textarea" placeholder="متن فارسی یا انگلیسی را بنویس..." rows="5"></textarea>
        <div class="form-group mt-1">
          <label class="form-label">صدا</label>
          <select id="tts-voice" class="select"></select>
        </div>
        <div class="form-group">
          <label class="form-label">سرعت: <span id="rate-val">1</span></label>
          <input type="range" id="tts-rate" min="0.5" max="2" step="0.1" value="1" class="w-full" />
        </div>
        <div class="flex gap-2 flex-wrap">
          <button class="btn btn-primary" id="btn-speak" ${supported ? '' : 'disabled'}>پخش</button>
          <button class="btn btn-ghost" id="btn-stop">توقف</button>
        </div>
        ${!supported ? '<p class="mt-1" style="color:var(--warning)">مرورگر شما از Speech Synthesis پشتیبانی نمی‌کند.</p>' : ''}
      </div>
    </div>
  `;

  if (!supported) return;

  const voiceSel = container.querySelector('#tts-voice');
  const loadVoices = () => {
    const voices = speechSynthesis.getVoices();
    voiceSel.innerHTML = '';
    voices.forEach((v, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${v.name} (${v.lang})`;
      if (v.lang.startsWith('fa') || v.lang.startsWith('en')) opt.selected = true;
      voiceSel.appendChild(opt);
    });
  };
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;

  const rate = container.querySelector('#tts-rate');
  rate.addEventListener('input', () => {
    container.querySelector('#rate-val').textContent = rate.value;
  });

  container.querySelector('#btn-speak').addEventListener('click', () => {
    const text = container.querySelector('#tts-text').value.trim();
    if (!text) {
      toast('متن خالی است');
      return;
    }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    const idx = parseInt(voiceSel.value, 10);
    if (voices[idx]) u.voice = voices[idx];
    u.rate = parseFloat(rate.value);
    speechSynthesis.speak(u);
    toast('در حال پخش...');
  });

  container.querySelector('#btn-stop').addEventListener('click', () => {
    speechSynthesis.cancel();
    toast('متوقف شد');
  });
}
