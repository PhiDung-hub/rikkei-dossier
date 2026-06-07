// Admin state + actions. The password is verified by the Worker (server-side);
// it is held in localStorage so a login persists across reloads/restarts (until logout).
import { ADMIN_WORKER_URL } from './config.js';

const PW_KEY = 'rikkei-admin-pw';
const store = typeof localStorage !== 'undefined' ? localStorage : null;
let pw = (store && store.getItem(PW_KEY)) || '';

export const admin = $state({ on: !!pw });

export const isConfigured = () => !!ADMIN_WORKER_URL;

async function post(payload) {
  const res = await fetch(ADMIN_WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res;
}

export async function login(password) {
  if (!ADMIN_WORKER_URL) throw new Error('not-configured');
  const res = await post({ password, verify: true });
  if (res.status === 401) throw new Error('unauthorized');
  if (!res.ok) throw new Error('server');
  pw = password;
  store?.setItem(PW_KEY, password);
  admin.on = true;
}

export function logout() {
  pw = '';
  store?.removeItem(PW_KEY);
  admin.on = false;
}

// Downscale to a ~400px JPEG and return base64 (no data: prefix) to keep commits small.
function resize(file, max = 400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); // flatten transparency
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      URL.revokeObjectURL(img.src);
      resolve(dataUrl.split(',')[1]);
    };
    img.onerror = () => reject(new Error('không đọc được ảnh'));
    img.src = URL.createObjectURL(file);
  });
}

// Uploads (adds or replaces) a photo for `slug`. Returns the committed path.
export async function uploadPhoto(slug, file) {
  if (!ADMIN_WORKER_URL) throw new Error('not-configured');
  const image = await resize(file);
  const res = await post({ password: pw, slug, image });
  if (res.status === 401) { logout(); throw new Error('unauthorized'); }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'upload failed');
  return res.json();
}

// Removes a person's photo (deletes the file and hides any baked/external photo).
export async function removePhoto(slug) {
  if (!ADMIN_WORKER_URL) throw new Error('not-configured');
  const res = await post({ password: pw, slug, action: 'remove' });
  if (res.status === 401) { logout(); throw new Error('unauthorized'); }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'remove failed');
  return res.json();
}
