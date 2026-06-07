// Client-side decryption — mirrors build.mjs.
// Fetch public/data.enc → AES-256-GCM decrypt → gunzip → expand compact model.

const PBKDF2_ITERATIONS = 250_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

// Internal style tier derived from the verbatim note text (notes are not translated).
function tierFor(rank) {
  if (!rank) return null;
  const n = rank.toLowerCase();
  if (n.includes('executive')) return 'exec';
  if (n.includes('co-founder') || n.includes('founder')) return 'founder';
  if (n.includes('bom')) return 'bom';
  if (n.includes('khách mời') || n.includes('guest')) return 'guest';
  return null;
}

function slugify(name) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// compact { g,t,dom,d:[ [div,[ [name,title,email,rank], ... ]] ] } → rich model
function expand(c) {
  const dom = c.dom || '';
  const divisions = c.d.map(([name, people]) => ({
    name,
    people: people.map(([nm, title, email, rank]) => {
      const local = email || '';
      const full = email ? (email.includes('@') ? email : email + dom) : null;
      return {
        name: nm,
        title: title || null,
        email: full,
        rank: rank || null,
        tier: tierFor(rank || null),
        slug: local ? (local.includes('@') ? local.split('@')[0] : local) : slugify(nm),
      };
    }),
  }));
  return { generated: c.g, total: c.t, divisions };
}

async function gunzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).text();
}

// Throws if the passphrase is wrong (AES-GCM auth tag fails) or the file is missing.
export async function loadAndDecrypt(password) {
  const url = import.meta.env.BASE_URL + 'data.enc';
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('data-missing');
  const buf = new Uint8Array(await res.arrayBuffer());

  const salt = buf.subarray(0, SALT_BYTES);
  const iv = buf.subarray(SALT_BYTES, SALT_BYTES + IV_BYTES);
  const ct = buf.subarray(SALT_BYTES + IV_BYTES);

  const baseKey = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);

  const gz = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return expand(JSON.parse(await gunzip(new Uint8Array(gz))));
}
