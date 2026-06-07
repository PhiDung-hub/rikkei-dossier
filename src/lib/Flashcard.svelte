<script>
  import { admin, uploadPhoto, removePhoto } from './admin.svelte.js';

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

  const jpName = $derived(hasJP(person.name));
  let imgOk = $state(false);
  let flipped = $state(false);

  // Admin upload/remove: optimistic local state
  let localPhoto = $state(null);   // object URL after upload (preview)
  let removed = $state(false);     // optimistic removal
  let uploading = $state(false);
  let uploadErr = $state('');
  let menuOpen = $state(false);
  let suppressClick = false;
  let pressTimer = null;

  const shownPhoto = $derived(removed ? null : (localPhoto ?? person.photo));
  // Photos sourced from an external hyperlink (rikkeisoft) are the source of truth → locked.
  // Admin-managed photos resolve to a same-origin relative path (no http scheme).
  const externalPhoto = $derived(!localPhoto && !removed && /^https?:\/\//.test(person.photo || ''));
  const canEdit = $derived(admin.on && !externalPhoto);
  const canAdd = $derived(canEdit && !shownPhoto);   // click avatar to add
  const canMenu = $derived(canEdit && !!shownPhoto); // right-click / long-press to change·remove

  $effect(() => { flipped = reveal; });

  function toggle() {
    if (suppressClick) { suppressClick = false; return; }
    if (menuOpen) { menuOpen = false; return; }
    flipped = !flipped;
  }
  function key(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipped = !flipped; }
  }

  // open the change/remove menu via right-click (desktop) or long-press (mobile)
  function onContext(e) {
    if (!canMenu) return;
    e.preventDefault(); e.stopPropagation();
    menuOpen = true;
  }
  function onPressStart() {
    if (!canMenu) return;
    pressTimer = setTimeout(() => { menuOpen = true; suppressClick = true; }, 450);
  }
  function onPressCancel() { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    menuOpen = false;
    if (!file) return;
    uploading = true; uploadErr = '';
    try {
      await uploadPhoto(person.slug, file);
      imgOk = false;
      localPhoto = URL.createObjectURL(file);   // instant preview; real one after redeploy
      removed = false;
    } catch (ex) {
      uploadErr = ex.message === 'unauthorized' ? 'Sai mật khẩu' : 'Tải ảnh thất bại';
    } finally {
      uploading = false;
    }
  }

  async function onRemove(e) {
    e.stopPropagation();
    menuOpen = false;
    uploading = true; uploadErr = '';
    try {
      await removePhoto(person.slug);
      removed = true; localPhoto = null;
    } catch (ex) {
      uploadErr = ex.message === 'unauthorized' ? 'Sai mật khẩu' : 'Xóa ảnh thất bại';
    } finally {
      uploading = false;
    }
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
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="avatar"
        style="background:{gradient(person.name)}"
        oncontextmenu={onContext}
        ontouchstart={onPressStart}
        ontouchend={onPressCancel}
        ontouchmove={onPressCancel}
        ontouchcancel={onPressCancel}
      >
        <span class="ini" class:jp={jpName}>{initials(person.name)}</span>
        {#if shownPhoto}
          <img src={shownPhoto} alt={person.name} loading="lazy" class:ok={imgOk}
               onload={() => (imgOk = true)} onerror={(e) => e.currentTarget.remove()} />
        {/if}
        {#if canAdd}
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
          <label class="addtap" title="Thêm ảnh" onclick={(e) => e.stopPropagation()}>
            <span class="cam" aria-hidden="true">+</span>
            <input type="file" accept="image/*" onchange={onFile} hidden />
          </label>
        {/if}
        {#if uploading}<div class="busyov">…</div>{/if}
      </div>

      {#if uploadErr}<div class="uperr">{uploadErr}</div>{/if}
      <div class="name" class:jp={jpName}>{person.name}</div>
      {#if canMenu}<div class="fliphint">Chuột phải · giữ để sửa ảnh</div>{/if}

      {#if menuOpen}
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
        <div class="menubg" onclick={(e) => { e.stopPropagation(); menuOpen = false; }}></div>
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
        <div class="editmenu" onclick={(e) => e.stopPropagation()}>
          <label class="mi">Đổi ảnh<input type="file" accept="image/*" onchange={onFile} hidden /></label>
          <button class="mi danger" onclick={onRemove}>Xóa ảnh</button>
        </div>
      {/if}
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
          <span class="val email">{person.email}</span>
        {:else}
          <span class="val none">chưa cập nhật</span>
        {/if}
      </div>
      <div class="foot"><span>Rikkeisoft</span><span class="stamp">Hồ sơ Lãnh đạo</span></div>
    </div>
  </div>
</div>

<style>
  .card { perspective: 1600px; height: 410px; animation: cardin .55s cubic-bezier(.2,.8,.2,1) both; outline: none; cursor: pointer; }
  .inner {
    position: relative; width: 100%; height: 100%; transform-style: preserve-3d;
    transition: transform .3s cubic-bezier(.6,.02,.2,1);
  }
  .card.flipped .inner { transform: rotateY(180deg); }
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

  .front { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 22px 14px; text-align: center; }
  .avatar {
    width: min(88%, 274px); aspect-ratio: 1; max-width: 100%;
    border-radius: 50%; position: relative; display: grid; place-items: center;
    container-type: inline-size;
    margin-bottom: 16px; overflow: hidden; border: 1px solid var(--hair);
    box-shadow: 0 10px 24px -10px rgba(0,0,0,.7), inset 0 0 0 4px rgba(0,0,0,.18);
    user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
  }
  .ini { font-family: var(--serif); font-weight: 600; font-size: 35cqw; color: #fff; text-shadow: 0 1px 6px rgba(0,0,0,.35); }
  .avatar img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .3s; }
  .avatar img.ok { opacity: 1; }

  /* photoless + admin: whole avatar adds on click */
  .addtap {
    position: absolute; inset: 0; z-index: 3; display: grid; place-items: center; cursor: pointer;
    background: rgba(0,0,0,.3); transition: background .2s;
  }
  .addtap:hover { background: rgba(0,0,0,.5); }
  .cam { color: #fff; font-size: 30cqw; font-weight: 300; line-height: 1; }

  .busyov { position: absolute; inset: 0; z-index: 4; display: grid; place-items: center; background: rgba(0,0,0,.5); color: #fff; font-size: 22px; }

  /* change / remove context menu (right-click or long-press) */
  .menubg { position: absolute; inset: 0; z-index: 5; background: rgba(0,0,0,.5); border-radius: 16px; }
  .editmenu {
    position: absolute; z-index: 6; left: 50%; top: 50%; transform: translate(-50%, -50%);
    display: flex; flex-direction: column; gap: 9px;
  }
  .mi, button.mi {
    all: unset; cursor: pointer; text-align: center; font-family: var(--sans); font-weight: 700; font-size: 13.5px;
    color: #fff; padding: 11px 26px; border-radius: 24px;
    background: linear-gradient(180deg, var(--accent-bright), var(--accent-deep));
    box-shadow: 0 10px 22px -8px rgba(0,0,0,.7);
  }
  .mi.danger, button.mi.danger { background: linear-gradient(180deg, #6e2222, #391212); }
  .mi:hover { filter: brightness(1.08); }
  .uperr { margin-top: 10px; font-family: var(--mono); font-size: 10px; color: var(--accent-bright); }

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
  .val.email { color: var(--accent-bright); font-family: var(--mono); font-size: 12px; }
  .val.none { color: var(--faint); font-style: italic; }
  .foot {
    margin-top: auto; font-family: var(--mono); font-size: 9px; letter-spacing: .2em; text-transform: uppercase;
    color: var(--faint); display: flex; justify-content: space-between;
  }
  .foot .stamp { color: var(--brass); }
</style>
