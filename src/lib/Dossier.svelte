<script>
  import DivisionNav from './DivisionNav.svelte';
  import Flashcard from './Flashcard.svelte';
  import ThemeSwitcher from './ThemeSwitcher.svelte';

  let { data } = $props();
  let current = $state(0);
  let query = $state('');

  const hasJP = (s) => /[぀-ヿ㐀-鿿]/.test(s || '');
  const pad = (n) => String(n).padStart(2, '0');

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
    current = i; query = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
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
        <input type="search" placeholder="Tìm tên, chức vụ, email…" bind:value={query} aria-label="Tìm kiếm" />
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
              <Flashcard person={p} index={i} division={p._div} />
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
          </div>
          <div class="grid">
            {#each d.people as p, i (p.slug + '-' + i)}
              <Flashcard person={p} index={i} division={d.name} />
            {/each}
          </div>
        </div>
      {/if}
    </section>
  </div>

  <footer class="foot">
    <span>Rikkeisoft · Bảo mật — không chia sẻ ra ngoài</span>
    <span>Hồ sơ mã hóa · {data.generated}</span>
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
  h1 { font-family: var(--serif); font-weight: 600; font-size: clamp(32px, 5vw, 56px); line-height: .98; letter-spacing: -.02em; }
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

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(262px, 1fr)); gap: 22px; }
  .empty { color: var(--muted); font-size: 15px; padding: 60px 0; text-align: center; font-style: italic; }

  .foot {
    margin-top: 70px; padding-top: 24px; border-top: 1px solid var(--hair2); display: flex; justify-content: space-between;
    flex-wrap: wrap; gap: 10px; font-family: var(--mono); font-size: 10.5px; letter-spacing: .14em; color: var(--faint); text-transform: uppercase;
  }

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
