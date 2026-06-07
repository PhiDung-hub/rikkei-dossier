// Public data loader — fetch public/data.gz → gunzip → expand compact model.
// No password: the data ships gzip-compressed (for size), not encrypted.

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
    people: people.map(([nm, title, email, rank, photo]) => {
      const local = email || '';
      const full = email ? (email.includes('@') ? email : email + dom) : null;
      return {
        name: nm,
        title: title || null,
        email: full,
        rank: rank || null,
        tier: tierFor(rank || null),
        slug: local ? (local.includes('@') ? local.split('@')[0] : local) : slugify(nm),
        photo: photo || null,
      };
    }),
  }));
  return { generated: c.g, total: c.t, divisions };
}

async function gunzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(stream).text();
}

export async function loadData() {
  const url = import.meta.env.BASE_URL + 'data.gz';
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('data-missing');
  const bytes = new Uint8Array(await res.arrayBuffer());
  // Some hosts serve .gz with Content-Encoding: gzip, so the browser has already
  // decompressed it (bytes are plain JSON). Only gunzip when the gzip magic is present.
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
  const text = isGzip ? await gunzip(bytes) : new TextDecoder().decode(bytes);
  return expand(JSON.parse(text));
}
