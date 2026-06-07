<script>
  import Lock from './lib/Lock.svelte';
  import Dossier from './lib/Dossier.svelte';

  let data = $state(null);
</script>

{#if !data}
  <Lock onunlock={(d) => (data = d)} />
{:else}
  <Dossier {data} />
{/if}
