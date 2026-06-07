<script>
  import Dossier from './lib/Dossier.svelte';
  import { loadData } from './lib/data.js';

  let data = $state(null);
  let error = $state(false);

  loadData().then((d) => (data = d)).catch(() => (error = true));
</script>

{#if data}
  <Dossier {data} />
{:else if error}
  <div class="state">Không tải được dữ liệu.</div>
{:else}
  <div class="state">Đang tải…</div>
{/if}

<style>
  .state {
    position: fixed; inset: 0; display: grid; place-items: center;
    font-family: var(--mono); font-size: 13px; letter-spacing: .14em; color: var(--faint);
    text-transform: uppercase;
  }
</style>
