# FEATURES — MEGA X

## Fully implemented (browser-native)

- Homepage with quick tools + recent
- Text tools: count, case, trim, dedupe, sort, reverse, JSON, URL encode/decode, Base64, compare, TXT export
- Hash: SHA-256 (Web Crypto), MD5 (local), UUID v4, secure random
- QR Code generation + PNG download (via public qrserver API)
- URL parser + validation + suspicious format warning
- Text-to-Speech (Web Speech API)
- Theme toggle (dark/light)
- Language structure (fa primary, en ready)
- localStorage for theme, lang, recent, favorites
- Responsive sidebar + mobile menu
- RTL Persian support
- Accessible focus states, reduced-motion

## Limited / UI only under static restriction

- Music search: live iTunes API (CORS-friendly, no key) + Persian/Finglish boost list + 30s real audio preview + deep links (Spotify, SoundCloud, YT Music, Radio Javan)
- Website screenshot: not possible without backend
- Live web search results: not implemented (no compatible free CORS API)
- Speech-to-text: not enabled (varies heavily by browser)
- GIF creation / video-to-GIF: not included (encoder size + complexity)

## Never claimed

- Fake online user counts
- Fake download buttons
- Server-side processing
- Private API keys in client
