// Theme registry + reactive current theme (persisted to localStorage).

export const THEMES = [
  { id: 'dark',  label: 'Tối',         swatch: '#141110', accent: '#f4344b' },
  { id: 'light', label: 'Sáng',        swatch: '#efece6', accent: '#c8102e' },
  { id: 'paper', label: 'Giấy',        swatch: '#f3e7c8', accent: '#bf4030' },
  { id: 'tokyo', label: 'Tokyo Night', swatch: '#1a1b26', accent: '#7aa2f7' },
  { id: 'coal',  label: 'Than',        swatch: '#0c0c0d', accent: '#ff6a3d' },
];

const KEY = 'rikkei-theme';
const stored = (typeof localStorage !== 'undefined' && localStorage.getItem(KEY)) || 'dark';

export const theme = $state({ id: THEMES.some((t) => t.id === stored) ? stored : 'dark' });

function apply(id) {
  document.documentElement.dataset.theme = id;
  const meta = document.querySelector('meta[name="theme-color"]');
  const t = THEMES.find((x) => x.id === id);
  if (meta && t) meta.content = t.swatch;
}

export function initTheme() {
  apply(theme.id);
}

export function setTheme(id) {
  theme.id = id;
  try { localStorage.setItem(KEY, id); } catch { /* ignore */ }
  apply(id);
}
