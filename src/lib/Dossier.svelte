<script>
  import DivisionNav from './DivisionNav.svelte';
  import Flashcard from './Flashcard.svelte';
  import ThemeSwitcher from './ThemeSwitcher.svelte';
  import AdminBar from './AdminBar.svelte';

  let { data } = $props();

  // Deep-link / persist the selected division via the URL hash (#bo-phan=<name>)
  // and sessionStorage, so it survives reload and is shareable.
  const DIV_KEY = 'rikkei-div';
  function idxFromHash() {
    const m = typeof location !== 'undefined' && location.hash.match(/(?:^#|&)bo-phan=([^&]+)/);
    if (!m) return -1;
    return data.divisions.findIndex((d) => d.name === decodeURIComponent(m[1]));
  }
  function initialDivision() {
    const h = idxFromHash();
    if (h >= 0) return h;
    try {
      const s = sessionStorage.getItem(DIV_KEY);
      if (s) { const i = data.divisions.findIndex((d) => d.name === s); if (i >= 0) return i; }
    } catch { /* ignore */ }
    return 0;
  }

  let current = $state(initialDivision());
  let query = $state('');
  let revealAll = $state(false);   // "flip all" signal for the current page

  const hasJP = (s) => /[぀-ヿ㐀-鿿]/.test(s || '');
  const pad = (n) => String(n).padStart(2, '0');

  function syncUrl(i) {
    const name = data.divisions[i]?.name;
    if (!name) return;
    history.replaceState(null, '', '#bo-phan=' + encodeURIComponent(name));
    try { sessionStorage.setItem(DIV_KEY, name); } catch { /* ignore */ }
  }

  // One-time: persist the initial division to both URL and session, and follow nav.
  $effect(() => {
    syncUrl(initialDivision());
    const onHash = () => { const i = idxFromHash(); if (i >= 0) { current = i; query = ''; revealAll = false; } };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  });

  let results = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const hits = [];
    for (const d of data.divisions)
      for (const p of d.people) {
        const hay = [p.name, p.title, p.email, p.rank, d.name].filter(Boolean).join(' ').toLowerCase();
        if (hay.includes(q)) hits.push({ ...p, _div: d.name });
      }
    return hits;
  });

  function select(i) {
    current = i; query = ''; revealAll = false;
    syncUrl(i);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Prev/next group ("page") navigation. Disabled at the ends; off during search.
  const lastIdx = $derived(data.divisions.length - 1);
  const canPrev = $derived(!results && current > 0);
  const canNext = $derived(!results && current < lastIdx);
  const prevName = $derived(current > 0 ? data.divisions[current - 1].name : '');
  const nextName = $derived(current < lastIdx ? data.divisions[current + 1].name : '');
  function go(delta) {
    if (results) return;
    const i = current + delta;
    if (i < 0 || i > lastIdx) return;
    select(i);
  }

  // ← / → flip between groups, except while typing in a field.
  $effect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

<div class="app">
  <header class="top">
    <div class="brand">
      <div class="kicker"><span class="dot"></span> Ban Lãnh đạo Rikkeisoft</div>
      <h1>Hồ sơ <em>Lãnh đạo</em></h1>
      <div class="meta">
        <b>{data.total}</b> lãnh đạo · <b>{data.divisions.length}</b> bộ phận · cập nhật {data.generated}
      </div>
    </div>
    <div class="tools">
      <ThemeSwitcher />
      <div class="searchbox">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input type="search" placeholder="Tìm tên, chức vụ, email…" bind:value={query} oninput={() => (revealAll = false)} aria-label="Tìm kiếm" />
      </div>
    </div>
  </header>

  <div class="layout">
    <DivisionNav divisions={data.divisions} current={results ? -1 : current} onselect={select} />

    <section class="stage">
      {#if results}
        <div class="stagehead">
          <h2>Kết quả tìm kiếm</h2><span class="num">{results.length} kết quả</span><span class="rule"></span>
        </div>
        {#if results.length}
          <div class="grid">
            {#each results as p, i (p.slug + '-' + i)}
              <Flashcard person={p} index={i} division={p._div} reveal={revealAll} />
            {/each}
          </div>
        {:else}
          <p class="empty">Không tìm thấy lãnh đạo phù hợp với “{query}”.</p>
        {/if}
      {:else}
        {@const d = data.divisions[current]}
        <div class="divblock">
          <div class="stagehead">
            <h2 class:jp={hasJP(d.name)}>{d.name}</h2>
            <span class="num">{pad(current + 1)} / {pad(data.divisions.length)}</span>
            <span class="rule"></span>
            <div class="navbtns">
              <button class="navbtn" onclick={() => go(-1)} disabled={!canPrev} aria-label="Bộ phận trước">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <button class="navbtn" onclick={() => go(1)} disabled={!canNext} aria-label="Bộ phận tiếp theo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          </div>
          <div class="grid">
            {#each d.people as p, i (p.slug + '-' + i)}
              <Flashcard person={p} index={i} division={d.name} reveal={revealAll} />
            {/each}
          </div>

          <nav class="pager" aria-label="Điều hướng bộ phận">
            <button class="pg" onclick={() => go(-1)} disabled={!canPrev}>
              <svg class="pgic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              <span class="pgt">
                <span class="pgk">Bộ phận trước</span>
                <span class="pgn" class:jp={hasJP(prevName)}>{prevName || '—'}</span>
              </span>
            </button>
            <button class="pg next" onclick={() => go(1)} disabled={!canNext}>
              <span class="pgt">
                <span class="pgk">Bộ phận tiếp theo</span>
                <span class="pgn" class:jp={hasJP(nextName)}>{nextName || '—'}</span>
              </span>
              <svg class="pgic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </nav>
        </div>
      {/if}
    </section>
  </div>

  {#if results ? results.length > 0 : true}
    <button class="flipall" class:on={revealAll} onclick={() => (revealAll = !revealAll)} aria-pressed={revealAll}>
      <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h13l-3.5-3.5M20 17H7l3.5 3.5" /></svg>
      {revealAll ? 'Ẩn tất cả' : 'Lật tất cả'}
    </button>
  {/if}

  <footer class="foot">
    <span>Rikkeisoft · Hồ sơ Lãnh đạo</span>
    <span class="footright"><span class="upd">Cập nhật {data.generated}</span><AdminBar /></span>
  </footer>
</div>

<style>
  .app {
    width: 100%; animation: fade .7s ease both;
    padding: 0 max(clamp(20px, 4vw, 72px), env(safe-area-inset-left))
             90px max(clamp(20px, 4vw, 72px), env(safe-area-inset-right));
  }
  .top { padding: 40px 0 28px; border-bottom: 1px solid var(--hair2); display: flex; flex-wrap: wrap; align-items: flex-end; gap: 22px 40px; }
  .brand { flex: 1 1 320px; }
  .kicker { font-family: var(--mono); font-size: 11px; letter-spacing: .42em; color: var(--brass); text-transform: uppercase; display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 12px var(--accent); }
  h1 { font-family: var(--serif); font-weight: 600; font-size: clamp(44px, 7.5vw, 88px); line-height: .94; letter-spacing: -.025em; }
  h1 em { font-style: italic; font-weight: 500; color: var(--accent-bright); }
  .meta { color: var(--muted); font-size: 14px; margin-top: 12px; }
  .meta b { color: var(--ink); font-variant-numeric: tabular-nums; }

  .tools { display: flex; flex-direction: column; align-items: flex-end; gap: 14px; }
  .searchbox { position: relative; width: min(300px, 80vw); }
  .searchbox input {
    width: 100%; background: var(--panel); border: 1px solid var(--hair2); color: var(--ink);
    font-family: var(--sans); font-size: 15px; padding: 12px 16px 12px 42px; border-radius: 30px; outline: none; transition: border-color .2s;
  }
  .searchbox input:focus { border-color: var(--accent); }
  .searchbox svg { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); width: 17px; height: 17px; stroke: var(--faint); }

  .layout { display: grid; grid-template-columns: 248px 1fr; gap: 46px; margin-top: 34px; align-items: start; }
  .stage { min-height: 60vh; }
  .stagehead { display: flex; align-items: baseline; gap: 16px; margin-bottom: 26px; flex-wrap: wrap; }
  .stagehead h2 { font-family: var(--serif); font-weight: 600; font-size: clamp(23px, 3.4vw, 38px); letter-spacing: -.015em; line-height: 1.05; }
  .num { font-family: var(--mono); font-size: 13px; color: var(--brass); letter-spacing: .1em; }
  .rule { flex: 1; height: 1px; background: var(--hair2); align-self: center; min-width: 30px; }

  /* Compact prev/next arrows beside the counter — quick jump without scrolling */
  .navbtns { display: inline-flex; gap: 8px; align-self: center; }
  .navbtn {
    all: unset; cursor: pointer; display: grid; place-items: center; width: 38px; height: 38px;
    border-radius: 50%; border: 1px solid var(--hair2); color: var(--muted);
    transition: background .18s, color .18s, border-color .18s, opacity .18s;
  }
  .navbtn svg { width: 18px; height: 18px; }
  .navbtn:hover:not(:disabled) { background: var(--panel); color: var(--ink); border-color: var(--accent); }
  .navbtn:active:not(:disabled) { transform: scale(.94); }
  .navbtn:disabled { opacity: .3; cursor: default; }

  /* Bottom pager — the primary "turn the page" affordance after reading a group */
  .pager { display: flex; gap: 14px; margin-top: 46px; }
  .pg {
    all: unset; box-sizing: border-box; cursor: pointer; flex: 1 1 0; min-width: 0;
    display: flex; align-items: center; gap: 14px; padding: 16px 20px;
    border: 1px solid var(--hair2); border-radius: 14px; background: var(--panel);
    transition: background .18s, border-color .18s, transform .14s, opacity .18s, box-shadow .2s;
  }
  .pg.next { justify-content: flex-end; }
  .pg:hover:not(:disabled) { border-color: var(--accent); transform: translateY(-2px); box-shadow: var(--shadow); }
  .pg:active:not(:disabled) { transform: translateY(0) scale(.99); }
  .pg:disabled { opacity: .35; cursor: default; }
  .pgic { width: 22px; height: 22px; flex: none; color: var(--accent-bright); }
  .pgt { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .pg.next .pgt { align-items: flex-end; text-align: right; }
  .pgk { font-family: var(--mono); font-size: 9.5px; letter-spacing: .18em; text-transform: uppercase; color: var(--faint); }
  .pgn { font-family: var(--serif); font-weight: 600; font-size: 16px; color: var(--ink); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  /* Floating action button — anchored bottom-right, thumb-reachable on mobile */
  .flipall {
    position: fixed; z-index: 40;
    right: max(22px, env(safe-area-inset-right));
    bottom: max(22px, env(safe-area-inset-bottom));
    display: inline-flex; align-items: center; gap: 9px; cursor: pointer; border: 0;
    font-family: var(--sans); font-weight: 800; font-size: 15px; letter-spacing: .01em;
    color: #fff; padding: 15px 24px; border-radius: 40px; white-space: nowrap;
    background: linear-gradient(180deg, var(--accent-bright), var(--accent-deep));
    box-shadow: 0 18px 38px -12px rgba(0,0,0,.55), 0 0 0 1px color-mix(in srgb, var(--accent) 40%, transparent);
    transition: transform .14s, filter .2s, box-shadow .2s;
  }
  .flipall:hover { filter: brightness(1.08); transform: translateY(-2px); }
  .flipall:active { transform: translateY(0) scale(.98); }
  .flipall.on {
    color: var(--ink); background: linear-gradient(180deg, var(--panel2), var(--panel));
    box-shadow: 0 18px 38px -12px rgba(0,0,0,.55), inset 0 0 0 1.6px var(--accent);
  }
  .flipall .ic { width: 17px; height: 17px; flex: none; }
  @media (max-width: 560px) {
    .flipall { right: 14px; bottom: 14px; padding: 14px 22px; font-size: 15px; }
  }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(262px, 1fr)); gap: 22px; }
  .empty { color: var(--muted); font-size: 15px; padding: 60px 0; text-align: center; font-style: italic; }

  .foot {
    margin-top: 70px; padding-top: 24px; border-top: 1px solid var(--hair2); display: flex; justify-content: space-between;
    align-items: center; flex-wrap: wrap; gap: 14px; font-family: var(--mono); font-size: 10.5px; letter-spacing: .14em; color: var(--faint); text-transform: uppercase;
  }
  .footright { display: inline-flex; align-items: center; gap: 16px; }

  @media (max-width: 880px) {
    .layout { grid-template-columns: 1fr; gap: 26px; }
    .tools { width: 100%; flex-direction: row; align-items: center; justify-content: space-between; flex-wrap: wrap; }
    .searchbox { width: 100%; order: 2; }
  }
  @media (max-width: 520px) {
    .top { padding: 28px 0 22px; }
    .grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
  }
</style>
