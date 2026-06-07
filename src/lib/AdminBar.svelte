<script>
  import { admin, login, logout, isConfigured } from './admin.svelte.js';

  let open = $state(false);
  let pw = $state('');
  let busy = $state(false);
  let err = $state('');

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    busy = true; err = '';
    try {
      await login(pw);
      open = false; pw = '';
    } catch (ex) {
      err = ex.message === 'not-configured' ? 'Chưa cấu hình Worker admin.'
          : ex.message === 'unauthorized' ? 'Sai mật khẩu.'
          : 'Lỗi máy chủ.';
    } finally {
      busy = false;
    }
  }
</script>

{#if admin.on}
  <span class="bar">● Admin <button class="link" onclick={logout}>· Thoát</button></span>
{:else}
  <button class="adminbtn" onclick={() => (open = true)}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
    Admin
  </button>
{/if}

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={() => (open = false)}></div>
  <form class="modal" onsubmit={submit}>
    <div class="crest">Rikkeisoft · Admin</div>
    <h3>Đăng nhập quản trị</h3>
    {#if !isConfigured()}
      <p class="note">Tính năng admin chưa được bật — cần triển khai Worker (xem <code>worker/README.md</code>).</p>
    {:else}
      <p class="note">Nhập mật khẩu để thêm ảnh cho các thẻ chưa có ảnh.</p>
    {/if}
    <!-- svelte-ignore a11y_autofocus -->
    <input type="password" placeholder="Mật khẩu" bind:value={pw} autofocus />
    <button class="go" type="submit" disabled={busy}>{busy ? 'Đang kiểm tra…' : 'Đăng nhập'}</button>
    <div class="err">{err}</div>
  </form>
{/if}

<style>
  .link { all: unset; cursor: pointer; color: inherit; }
  .link:hover { color: var(--accent-bright); }
  .bar { color: var(--accent-bright); }
  .bar .link { color: var(--faint); }

  /* Prominent admin entry button */
  .adminbtn {
    all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
    font-family: var(--sans); font-weight: 700; font-size: 14px; letter-spacing: .01em; text-transform: none;
    color: var(--ink); padding: 10px 22px; border-radius: 24px; border: 1.5px solid var(--hair);
    transition: color .2s, border-color .2s, background .2s, transform .12s;
  }
  .adminbtn svg { width: 16px; height: 16px; }
  .adminbtn:hover {
    color: #fff; border-color: transparent;
    background: linear-gradient(180deg, var(--accent-bright), var(--accent-deep));
  }
  .adminbtn:active { transform: translateY(1px); }

  .backdrop { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.5); backdrop-filter: blur(2px); }
  .modal {
    position: fixed; z-index: 61; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: min(380px, 92vw); padding: 32px 30px 26px; border-radius: 16px;
    background: linear-gradient(180deg, var(--panel2), var(--panel)); border: 1px solid var(--hair);
    box-shadow: var(--shadow); text-transform: none;
  }
  .crest { font-family: var(--mono); font-size: 10px; letter-spacing: .34em; color: var(--brass); text-transform: uppercase; margin-bottom: 14px; }
  h3 { font-family: var(--serif); font-weight: 600; font-size: 24px; letter-spacing: -.01em; }
  .note { color: var(--muted); font-size: 13px; margin: 8px 0 20px; line-height: 1.5; }
  .note code { font-family: var(--mono); font-size: 12px; color: var(--ink); }
  input {
    width: 100%; background: color-mix(in srgb, var(--bg) 55%, transparent); color: var(--ink);
    border: 1px solid var(--hair2); border-radius: 10px; padding: 13px 14px; font-family: var(--mono);
    font-size: 15px; outline: none; transition: border-color .2s;
  }
  input:focus { border-color: var(--accent); }
  .go {
    width: 100%; margin-top: 12px; border: 0; cursor: pointer; color: #fff; font-weight: 700; font-size: 14px;
    padding: 13px; border-radius: 10px; background: linear-gradient(180deg, var(--accent-bright), var(--accent-deep));
  }
  .go:disabled { opacity: .65; cursor: wait; }
  .err { color: var(--accent-bright); font-family: var(--mono); font-size: 12px; min-height: 16px; margin-top: 10px; }
</style>
