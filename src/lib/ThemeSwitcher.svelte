<script>
  import { THEMES, theme, setTheme } from './theme.svelte.js';
</script>

<div class="themes" role="group" aria-label="Chọn giao diện">
  {#each THEMES as t (t.id)}
    <button
      class="sw"
      class:active={theme.id === t.id}
      style="--c:{t.swatch};--a:{t.accent}"
      title={t.label}
      aria-label={t.label}
      aria-pressed={theme.id === t.id}
      onclick={() => setTheme(t.id)}
    >
      <span class="dot"></span>
    </button>
  {/each}
  <span class="name">{THEMES.find((t) => t.id === theme.id)?.label}</span>
</div>

<style>
  .themes { display: inline-flex; align-items: center; gap: 8px; }
  .sw {
    all: unset; cursor: pointer; width: 22px; height: 22px; border-radius: 50%;
    background: var(--c); display: grid; place-items: center;
    box-shadow: inset 0 0 0 1px var(--hair); transition: transform .18s, box-shadow .2s;
  }
  .sw .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--a); transition: transform .18s; }
  .sw:hover { transform: scale(1.12); }
  .sw.active { box-shadow: 0 0 0 2px var(--a); transform: scale(1.05); }
  .sw.active .dot { transform: scale(1.25); }
  .name {
    font-family: var(--mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase;
    color: var(--faint); min-width: 86px;
  }
  @media (max-width: 560px) { .name { display: none; } }
</style>
