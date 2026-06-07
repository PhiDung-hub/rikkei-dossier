<script>
  let { person, index, division, reveal = false } = $props();

  const hasJP = (s) => /[぀-ヿ㐀-鿿]/.test(s || '');

  function initials(name) {
    if (hasJP(name)) return name.slice(0, 2);
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  function gradient(name) {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const a = h % 360, b = (a + 38) % 360;
    return `linear-gradient(150deg,hsl(${a} 55% 32%),hsl(${b} 60% 20%))`;
  }

  const imgSrc = $derived(import.meta.env.BASE_URL + 'images/' + person.slug + '.jpg');
  const jpName = $derived(hasJP(person.name));
  let imgOk = $state(false);
  let flipped = $state(false);

  // "Flip all" signal from the page: when it changes, match every card to it.
  // Individual clicks afterwards still toggle this card on its own.
  $effect(() => { flipped = reveal; });

  function toggle(e) {
    if (e.target.closest('a')) return;
    flipped = !flipped;
  }
  function key(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipped = !flipped; }
  }
</script>

<div
  class="card"
  class:flipped
  style="animation-delay:{(index % 12) * 40}ms"
  tabindex="0"
  role="button"
  aria-label={person.name}
  onclick={toggle}
  onkeydown={key}
>
  <div class="inner">
    <!-- FRONT -->
    <div class="face front">
      <div class="cornerNo">№ {String(index + 1).padStart(2, '0')}</div>
      <div class="avatar" style="background:{gradient(person.name)}">
        <span class="ini" class:jp={jpName}>{initials(person.name)}</span>
        <img src={imgSrc} alt={person.name} loading="lazy" class:ok={imgOk}
             onload={() => (imgOk = true)} onerror={(e) => e.currentTarget.remove()} />
      </div>
      <div class="name" class:jp={jpName}>{person.name}</div>
      <div class="fliphint">Nhấn để xem đáp án</div>
    </div>

    <!-- BACK (the answer) -->
    <div class="face back">
      <div class="bname" class:jp={jpName}>{person.name}</div>
      <hr />
      <div class="row">
        <span class="lbl">Chức vụ</span>
        {#if person.title}
          <span class="val" class:jp={hasJP(person.title)}>{person.title}</span>
        {:else}
          <span class="val none">—</span>
        {/if}
      </div>
      <div class="row">
        <span class="lbl">Bộ phận</span>
        <span class="val" class:jp={hasJP(division)}>{division}</span>
      </div>
      <div class="row">
        <span class="lbl">Cấp bậc</span>
        <span class="val">{person.rank || '—'}</span>
      </div>
      <div class="row">
        <span class="lbl">Email</span>
        {#if person.email}
          <a class="val" href="mailto:{person.email}">{person.email}</a>
        {:else}
          <span class="val none">chưa cập nhật</span>
        {/if}
      </div>
      <div class="foot"><span>Rikkeisoft</span><span class="stamp">Hồ sơ Lãnh đạo</span></div>
    </div>
  </div>
</div>

<style>
  .card { perspective: 1600px; height: 340px; animation: cardin .55s cubic-bezier(.2,.8,.2,1) both; outline: none; }
  .inner {
    position: relative; width: 100%; height: 100%; transform-style: preserve-3d;
    transition: transform .7s cubic-bezier(.6,.02,.2,1);
  }
  .card.flipped .inner { transform: rotateY(180deg); }
  .card { cursor: pointer; }
  .card:focus-visible { box-shadow: 0 0 0 2px var(--accent); border-radius: 16px; }

  .face {
    position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden;
    border-radius: 16px; overflow: hidden; box-shadow: var(--shadow);
    background: linear-gradient(165deg, var(--panel2), var(--panel)); border: 1px solid var(--hair2);
  }
  .face::before {
    content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
    background: linear-gradient(180deg, var(--accent-bright), var(--accent-deep));
  }
  .cornerNo { position: absolute; top: 13px; right: 15px; font-family: var(--mono); font-size: 10px; letter-spacing: .18em; color: var(--faint); }

  .front { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 26px 22px; text-align: center; }
  .avatar {
    width: 96px; height: 96px; border-radius: 50%; position: relative; display: grid; place-items: center;
    margin-bottom: 20px; overflow: hidden; border: 1px solid var(--hair);
    box-shadow: 0 10px 24px -10px rgba(0,0,0,.7), inset 0 0 0 4px rgba(0,0,0,.18);
  }
  .ini { font-family: var(--serif); font-weight: 600; font-size: 34px; color: #fff; text-shadow: 0 1px 6px rgba(0,0,0,.35); }
  .avatar img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .3s; }
  .avatar img.ok { opacity: 1; }

  .name { font-family: var(--serif); font-weight: 600; font-size: 23px; line-height: 1.12; letter-spacing: -.01em; }
  .fliphint {
    position: absolute; bottom: 13px; left: 0; right: 0; text-align: center; font-family: var(--mono);
    font-size: 9px; letter-spacing: .22em; color: var(--faint); text-transform: uppercase;
  }

  .back { transform: rotateY(180deg); display: flex; flex-direction: column; padding: 26px 24px; }
  .bname { font-family: var(--serif); font-weight: 600; font-size: 20px; line-height: 1.1; letter-spacing: -.01em; padding-right: 8px; }
  hr { border: 0; border-top: 1px solid var(--hair2); margin: 14px 0; }
  .row { display: flex; gap: 12px; font-size: 13px; margin-bottom: 13px; align-items: flex-start; }
  .lbl { font-family: var(--mono); font-size: 9px; letter-spacing: .16em; text-transform: uppercase; color: var(--faint); min-width: 64px; padding-top: 3px; }
  .val { flex: 1; color: var(--ink); word-break: break-word; }
  a.val { color: var(--accent-bright); text-decoration: none; border-bottom: 1px solid color-mix(in srgb, var(--accent) 35%, transparent); }
  a.val:hover { border-bottom-color: var(--accent-bright); }
  .val.none { color: var(--faint); font-style: italic; }
  .foot {
    margin-top: auto; font-family: var(--mono); font-size: 9px; letter-spacing: .2em; text-transform: uppercase;
    color: var(--faint); display: flex; justify-content: space-between;
  }
  .foot .stamp { color: var(--brass); }
</style>
