# Rikkeisoft · Hồ sơ Lãnh đạo (Management Dossier)

A themeable flashcard directory of Rikkeisoft leadership, built with **Svelte + Vite**.
People are grouped into pages by **Division (Bộ phận)**; each flashcard flips to reveal
contact details. The data is **public** — it loads straight into the dossier, no gate.

- 🌐 **Public, no password.** Data ships as a gzip-compressed JSON blob
  (`public/data.gz`) — compressed for transfer size, not secrecy. The browser fetches
  and gunzips it on load. (An earlier revision was AES-256 encrypted behind a
  passphrase; that gate has been removed.)
- 🗂 **Paged by division**, with search across name / title / email, and image
  placeholders that auto-upgrade to real photos.
- 🎨 **5 themes** — Tối (dark), Sáng (light), Giấy (paper · default), Tokyo Night,
  Than (coal) — the choice persists per visitor via `localStorage`.
- 📱 **Full-screen & responsive**, mobile through ultrawide.
- 🇻🇳 Vietnamese UI. Notes and job titles are shown **verbatim** from the source CSV.

## How the data flows

```
rikkei-managers.csv  ──parse + clean──▶  managers.clean.json   (editable source of truth)
                                  └──────compact ─▶ gzip ─▶ public/data.gz  (shipped)
                                                                  │
                                              browser: fetch ─▶ gunzip ─▶ render
```

The cleartext `rikkei-managers.csv` and `managers.clean.json` are **git-ignored**; only
the gzipped `public/data.gz` is committed and served.

## Quick start

```bash
npm install

# 1. Build the data (writes public/data.gz)
node build.mjs

# 2. Run locally  →  http://localhost:5173
npm run dev

# 3. Production build  →  dist/
npm run build && npm run preview
```

## Updating people

- **Small edits:** edit `managers.clean.json`, then rebuild straight from it:
  ```bash
  node build.mjs --from-json
  ```
- **From the spreadsheet:** replace `rikkei-managers.csv` and run `node build.mjs`
  (regenerates `managers.clean.json` too).

Cleaning is automatic: whitespace trimmed, the sparse **Bộ phận** column forward-filled
(blank rows inherit the division above), the `Divison`→`Division` typo fixed, and people
grouped by division. Top executives with no division become **“Ban Điều hành · Executive
Team.”**

> Privacy note: the dossier is **public** — anyone with the link (or browsing the
> repo) can read every name, title, and email, and search engines may index it. If you
> need it private again, restore the AES-256 passphrase gate from the project history.

## Photos

Each person can carry a `photo` URL in the data (the card shows it in the avatar; people
without one keep their initials). Executive headshots are **hyperlinked** straight from
`rikkeisoft.com` — no self-hosting — and those images send `Access-Control-Allow-Origin: *`,
so they embed cross-origin without CORS issues.

- To add/replace a photo, edit the `photo` field for that person in `managers.clean.json`
  and rebuild: `node build.mjs --from-json`.
- New people from the CSV are seeded from the `PHOTOS` map (slug → URL) at the top of
  `build.mjs`.

Any image URL works (or host your own). Slugs are the email local-part, e.g.
`tung.ta@rikkeisoft.com` → `tung.ta`.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds and deploys on every push to `main`. No secrets
needed.

1. Create a GitHub repo and push:
   ```bash
   git remote add origin git@github.com:<you>/<repo>.git
   git push -u origin main
   ```
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. The site publishes at `https://<you>.github.io/<repo>/`. The workflow sets Vite’s
   `base` to `/<repo>/` automatically so assets resolve.

To host elsewhere (Netlify/Vercel/S3), just serve the `dist/` folder statically.

## Project layout

```
build.mjs              data pipeline (CSV → clean JSON → compact → gzip → data.gz)
index.html             Vite entry (fonts, meta, default theme)
public/data.gz         gzipped data, committed, served
public/images/         optional photos (git-ignored)
src/
  main.js              mounts the app, applies saved theme
  app.css              global tokens + the 5 theme palettes
  App.svelte           loads data → dossier
  lib/
    data.js            fetch + gunzip + expand
    theme.svelte.js    theme registry + persistence (default: paper)
    Dossier.svelte     header, search, layout
    DivisionNav.svelte division index
    Flashcard.svelte   flip card + avatar
    ThemeSwitcher.svelte
```
