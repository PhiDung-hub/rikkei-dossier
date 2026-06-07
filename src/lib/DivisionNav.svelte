<script>
  let { divisions, current, onselect } = $props();
  let open = $state(false);
  const hasJP = (s) => /[぀-ヿ㐀-鿿]/.test(s || '');
  const currentName = $derived(current >= 0 && divisions[current] ? divisions[current].name : 'Chọn bộ phận');

  function pick(i) { onselect(i); open = false; }
</script>

<nav class="index" class:open>
  <!-- Mobile-only burger trigger -->
  <button class="burger" onclick={() => (open = !open)} aria-expanded={open} aria-controls="divlist">
    <span class="lines" class:x={open} aria-hidden="true"><span></span><span></span><span></span></span>
    <span class="cur" class:jp={hasJP(currentName)}>{currentName}</span>
    <svg class="chev" class:up={open} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
  </button>

  <p class="navlabel">Bộ phận</p>
  <div class="navlist" id="divlist">
    {#each divisions as d, i (d.name)}
      <button class:active={i === current} onclick={() => pick(i)}>
        <span class="ix">{String(i + 1).padStart(2, '0')}</span>
        <span class="nm" class:jp={hasJP(d.name)}>{d.name}</span>
        <span class="ct">{d.people.length}</span>
      </button>
    {/each}
  </div>
</nav>

<style>
  .index { position: sticky; top: 24px; }
  .navlabel { font-family: var(--mono); font-size: 10px; letter-spacing: .26em; color: var(--faint); text-transform: uppercase; margin: 0 0 14px 4px; }
  .navlist {
    display: flex; flex-direction: column; gap: 1px; max-height: calc(100vh - 120px);
    overflow: auto; padding-right: 6px; scrollbar-width: thin; scrollbar-color: var(--hair) transparent;
  }
  .navlist > button {
    all: unset; cursor: pointer; display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 9px; color: var(--muted); font-size: 13.5px; line-height: 1.3;
    border-left: 2px solid transparent; transition: background .18s, color .18s;
  }
  .ix { font-family: var(--mono); font-size: 10px; color: var(--faint); min-width: 20px; }
  .nm { flex: 1; }
  .ct { font-family: var(--mono); font-size: 11px; color: var(--faint); }
  .navlist > button:hover { background: var(--panel); color: var(--ink); }
  .navlist > button.active {
    background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 16%, transparent), transparent);
    color: var(--ink); border-left-color: var(--accent);
  }
  .navlist > button.active .ct { color: var(--accent-bright); }

  /* Burger — hidden on desktop */
  .burger { display: none; }

  @media (max-width: 880px) {
    .index { position: relative; top: 0; z-index: 30; }
    .navlabel { display: none; }

    .burger {
      display: flex; align-items: center; gap: 14px; width: 100%; cursor: pointer;
      background: var(--panel); border: 1px solid var(--hair2); border-radius: 12px;
      padding: 14px 16px; color: var(--ink); font-family: var(--sans);
    }
    .lines { position: relative; width: 20px; height: 14px; flex: none; }
    .lines span {
      position: absolute; left: 0; width: 100%; height: 2px; border-radius: 2px; background: var(--accent);
      transition: transform .25s, opacity .2s;
    }
    .lines span:nth-child(1) { top: 0; }
    .lines span:nth-child(2) { top: 6px; }
    .lines span:nth-child(3) { top: 12px; }
    .lines.x span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
    .lines.x span:nth-child(2) { opacity: 0; }
    .lines.x span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }
    .cur { flex: 1; text-align: left; font-weight: 700; font-size: 15px; }
    .chev { width: 18px; height: 18px; color: var(--faint); transition: transform .25s; }
    .chev.up { transform: rotate(180deg); }

    /* Collapsed by default; expands as a panel when open */
    .navlist {
      display: none; margin-top: 8px; max-height: 60vh; padding: 6px;
      background: var(--panel); border: 1px solid var(--hair2); border-radius: 12px;
      box-shadow: var(--shadow);
    }
    .index.open .navlist { display: flex; }
    .navlist > button { border-left: 0; padding: 11px 12px; font-size: 14.5px; }
    .navlist > button.active { border-left: 0; box-shadow: inset 2px 0 0 var(--accent); }
  }
</style>
