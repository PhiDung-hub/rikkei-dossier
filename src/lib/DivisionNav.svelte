<script>
  let { divisions, current, onselect } = $props();
  const hasJP = (s) => /[぀-ヿ㐀-鿿]/.test(s || '');
</script>

<nav class="index">
  <p class="navlabel">Bộ phận</p>
  <div class="navlist">
    {#each divisions as d, i (d.name)}
      <button class:active={i === current} onclick={() => onselect(i)}>
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
  button {
    all: unset; cursor: pointer; display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 9px; color: var(--muted); font-size: 13.5px; line-height: 1.3;
    border-left: 2px solid transparent; transition: background .18s, color .18s;
  }
  .ix { font-family: var(--mono); font-size: 10px; color: var(--faint); min-width: 20px; }
  .nm { flex: 1; }
  .ct { font-family: var(--mono); font-size: 11px; color: var(--faint); }
  button:hover { background: var(--panel); color: var(--ink); }
  button.active {
    background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 16%, transparent), transparent);
    color: var(--ink); border-left-color: var(--accent);
  }
  button.active .ct { color: var(--accent-bright); }

  @media (max-width: 880px) {
    .index { position: static; }
    .navlist { flex-direction: row; flex-wrap: wrap; max-height: none; overflow: visible; gap: 8px; padding-right: 0; }
    button { border-left: 0; border: 1px solid var(--hair2); }
    button.active { border-color: var(--accent); }
    .ix { display: none; }
  }
</style>
