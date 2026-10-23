const PREFIX = 'megax_';

export function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function set(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('storage set failed', e);
    return false;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {}
}

export function clearAll() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    return true;
  } catch {
    return false;
  }
}

export function getFavorites() {
  return get('favorites', []);
}

export function toggleFavorite(id) {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(id);
  set('favorites', favs);
  return favs;
}

export function getRecent() {
  return get('recent', []);
}

export function addRecent(id) {
  let recent = getRecent().filter(x => x !== id);
  recent.unshift(id);
  if (recent.length > 12) recent = recent.slice(0, 12);
  set('recent', recent);
  return recent;
}
