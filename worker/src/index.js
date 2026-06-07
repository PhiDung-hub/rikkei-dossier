// Rikkei Dossier — admin photo Worker (Cloudflare Workers)
// -----------------------------------------------------------------------------
// Holds the admin password and a GitHub token as SECRETS (never in the browser).
// Verifies the password, then adds/replaces/removes a person's photo in the repo
// and records it in public/photo-overrides.json. The static site merges that file.
//
// Secrets (set with `wrangler secret put NAME`):
//   ADMIN_PASSWORD   the admin login password (e.g. 123450)
//   GITHUB_TOKEN     a fine-grained PAT with "Contents: Read and write" on the repo
// Vars (wrangler.toml [vars]):  GH_OWNER, GH_REPO, GH_BRANCH
//
// Request (POST, JSON):
//   { password, verify:true }                  → 200 if password ok (login check)
//   { password, slug, image:<base64 jpeg> }    → add/replace public/images/<slug>.jpg
//   { password, slug, action:"remove" }        → delete the photo & hide it (overrides=null)
// -----------------------------------------------------------------------------

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400); }

    if (!env.ADMIN_PASSWORD || body.password !== env.ADMIN_PASSWORD)
      return json({ error: 'unauthorized' }, 401);

    if (body.verify) return json({ ok: true });

    const slug = String(body.slug || '').toLowerCase();
    if (!/^[a-z0-9._-]{1,64}$/.test(slug)) return json({ error: 'bad slug' }, 400);

    const owner = env.GH_OWNER, repo = env.GH_REPO, branch = env.GH_BRANCH || 'main';
    const imgPath = `public/images/${slug}.jpg`;
    const ovPath = 'public/photo-overrides.json';
    const remove = body.action === 'remove';

    const image = remove ? '' : String(body.image || '');
    if (!remove && (!image || image.length > 3_000_000))
      return json({ error: 'image missing or too large' }, 400);

    const loadMap = async () => {
      const cur = await ghGet(env, owner, repo, branch, ovPath);
      let map = {};
      if (cur?.content) { try { map = JSON.parse(b64ToStr(cur.content)); } catch { map = {}; } }
      return { cur, map };
    };

    try {
      if (remove) {
        // delete the uploaded file if present (baked/external photos have no file here)
        const imgCur = await ghGet(env, owner, repo, branch, imgPath);
        if (imgCur?.sha) await ghDelete(env, owner, repo, branch, imgPath, imgCur.sha, `admin: remove photo ${slug}`);
        // null marks it explicitly hidden, so even a baked/external photo disappears
        const { cur, map } = await loadMap();
        map[slug] = null;
        await ghPut(env, owner, repo, branch, ovPath, strToB64(JSON.stringify(map, null, 2) + '\n'),
          `admin: remove photo ${slug}`, cur?.sha);
        return json({ ok: true, removed: true });
      }

      // add / replace
      const imgCur = await ghGet(env, owner, repo, branch, imgPath);
      await ghPut(env, owner, repo, branch, imgPath, image, `admin: photo ${slug}`, imgCur?.sha);
      const { cur, map } = await loadMap();
      map[slug] = `images/${slug}.jpg?u=${Date.now()}`;
      await ghPut(env, owner, repo, branch, ovPath, strToB64(JSON.stringify(map, null, 2) + '\n'),
        `admin: register photo ${slug}`, cur?.sha);
      return json({ ok: true, path: map[slug] });
    } catch (e) {
      return json({ error: 'github: ' + (e.message || e) }, 502);
    }
  },
};

async function ghGet(env, owner, repo, branch, path) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
    headers: ghHeaders(env),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('GET ' + res.status);
  return res.json();
}
async function ghPut(env, owner, repo, branch, path, contentB64, message, sha) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT', headers: ghHeaders(env),
    body: JSON.stringify({ message, content: contentB64, branch, sha: sha || undefined }),
  });
  if (!res.ok) throw new Error('PUT ' + res.status + ' ' + (await res.text()).slice(0, 200));
  return res.json();
}
async function ghDelete(env, owner, repo, branch, path, sha, message) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'DELETE', headers: ghHeaders(env),
    body: JSON.stringify({ message, sha, branch }),
  });
  if (!res.ok && res.status !== 404) throw new Error('DELETE ' + res.status);
}
const ghHeaders = (env) => ({
  Authorization: `Bearer ${env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'rikkei-dossier-admin',
  'Content-Type': 'application/json',
});
const b64ToStr = (b64) => atob(b64.replace(/\s/g, ''));
const strToB64 = (s) => btoa(unescape(encodeURIComponent(s)));
