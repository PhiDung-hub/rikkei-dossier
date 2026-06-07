# Rikkeisoft · Hồ sơ Lãnh đạo (Management Dossier)

A password-protected, themeable flashcard directory of Rikkeisoft leadership, built
with **Svelte + Vite**. People are grouped into pages by **Division (Bộ phận)**; each
flashcard flips to reveal contact details. The data is **AES-256 encrypted** — the
shared page is useless without the passphrase.

- 🔐 **Real encryption.** Data ships as an opaque, gzip-compressed, AES-256-GCM blob
  (`public/data.enc`). The passphrase is never stored in the site; it derives the
  decryption key in the browser via Web Crypto (PBKDF2-SHA256, 250k iterations).
- 🗂 **Paged by division**, with search across name / title / email, and image
  placeholders that auto-upgrade to real photos.
- 🎨 **5 themes** — Tối (dark), Sáng (light), Giấy (paper), Tokyo Night, Than (coal) —
  persisted per visitor.
- 📱 **Full-screen & responsive**, mobile through ultrawide.
- 🇻🇳 Vietnamese UI. Notes and job titles are shown **verbatim** from the source CSV.

## How the data flows

```
rikkei-managers.csv  ──parse + clean──▶  managers.clean.json   (editable source of truth)
                                  └─compact─▶ gzip ─▶ AES-256-GCM ─▶ public/data.enc  (shipped)
                                                                          │
                                          browser: fetch ─▶ decrypt ─▶ gunzip ─▶ render
```

The cleartext `rikkei-managers.csv` and `managers.clean.json` are **git-ignored** and
never deployed — only the encrypted `public/data.enc` is committed and served.

## Quick start

```bash
npm install

# 1. Encrypt the data with your passphrase (writes public/data.enc)
node build.mjs "your-strong-password"

# 2. Run locally  →  http://localhost:5173
npm run dev

# 3. Production build  →  dist/
npm run build && npm run preview
```

## Updating people

- **Small edits:** edit `managers.clean.json`, then re-encrypt straight from it:
  ```bash
  node build.mjs "your-strong-password" --from-json
  ```
- **From the spreadsheet:** replace `rikkei-managers.csv` and run
  `node build.mjs "your-strong-password"` (regenerates `managers.clean.json` too).

Cleaning is automatic: whitespace trimmed, the sparse **Bộ phận** column forward-filled
(blank rows inherit the division above), the `Divison`→`Division` typo fixed, and people
grouped by division. Top executives with no division become **“Ban Điều hành · Executive
Team.”**

## Changing the passphrase

Just re-run `build.mjs` with a new password and redeploy — it only re-encrypts
`public/data.enc`. The password lives nowhere in the repo or the built site.

> Security note: AES-GCM with a PBKDF2 key is genuine encryption, but a static file's
> safety is bounded by password strength — anyone with the file can brute-force a weak
> one offline. **Use a long, shared passphrase.**

## Adding photos

Drop `public/images/<slug>.jpg` and it replaces that person's initials avatar
automatically. `<slug>` is the email local-part (e.g. `tung.ta@rikkeisoft.com` →
`tung.ta.jpg`); see `slug` in `managers.clean.json`. Photos are git-ignored by default —
commit them explicitly if you want them deployed.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds and deploys on every push to `main`. No secrets
needed (the data is already encrypted).

1. Create a GitHub repo and push:
   ```bash
   git remote add origin git@github.com:<you>/<repo>.git
   git push -u origin main
   ```
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. The site publishes at `https://<you>.github.io/<repo>/`. The workflow sets Vite’s
   `base` to `/<repo>/` automatically so assets resolve.

To host elsewhere (Netlify/Vercel/S3), just serve the `dist/` folder over **HTTPS**
(Web Crypto requires a secure context).

## Project layout

```
build.mjs              data pipeline (CSV → clean JSON → gzip → AES → data.enc)
index.html             Vite entry (fonts, meta)
public/data.enc        encrypted, committed, served
public/images/         optional photos (git-ignored)
src/
  main.js              mounts the app, applies saved theme
  app.css              global tokens + the 5 theme palettes
  App.svelte           lock ↔ dossier switch
  lib/
    crypto.js          fetch + decrypt + gunzip + expand
    theme.svelte.js    theme registry + persistence
    Lock.svelte        passphrase gate
    Dossier.svelte     header, search, layout
    DivisionNav.svelte division index
    Flashcard.svelte   flip card + avatar
    ThemeSwitcher.svelte
```
