# Admin photo-upload Worker

A tiny Cloudflare Worker that lets an admin (password-gated) upload a photo for a
person who doesn't have one yet. It holds the password and a GitHub token as
**secrets** (never shipped to the browser), commits the photo into the repo, and
registers it in `public/photo-overrides.json` — which the site merges on load.

Free tier is plenty (100k requests/day).

## One-time setup (~2 minutes)

1. **Create a GitHub token** (fine-grained):
   github.com → Settings → Developer settings → Fine-grained tokens → Generate.
   - Repository access: only `PhiDung-hub/rikkei-dossier`
   - Permissions: **Contents → Read and write**
   - Copy the token.

2. **Deploy the Worker:**
   ```bash
   npm install -g wrangler
   wrangler login
   cd worker
   wrangler secret put ADMIN_PASSWORD     # type: 123450
   wrangler secret put GITHUB_TOKEN       # paste the token from step 1
   wrangler deploy
   ```
   `wrangler deploy` prints a URL like
   `https://rikkei-dossier-admin.<you>.workers.dev`.

3. **Tell the site about the Worker:** put that URL in
   `src/lib/config.js` (`ADMIN_WORKER_URL`), then commit + push:
   ```bash
   # in the repo root
   sed -i "s#ADMIN_WORKER_URL = .*#ADMIN_WORKER_URL = 'https://rikkei-dossier-admin.<you>.workers.dev';#" src/lib/config.js
   git commit -am "wire admin worker url" && git push
   ```

That's it. On the site, click **Admin** (footer), enter `123450`, and an
**“+ Ảnh”** button appears on cards without a photo. Uploading commits the photo;
it goes live after the ~1-minute auto-redeploy (you'll see an instant local preview
in the meantime).

## Notes
- The password is verified **server-side** by the Worker — it is never in the page
  source. Change it anytime with `wrangler secret put ADMIN_PASSWORD`.
- Photos are downscaled to ~400px JPEG in the browser before upload, so commits stay small.
- To rotate the GitHub token: `wrangler secret put GITHUB_TOKEN` and redeploy.
