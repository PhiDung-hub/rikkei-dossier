<script>
  import { loadAndDecrypt } from './crypto.js';
  import ThemeSwitcher from './ThemeSwitcher.svelte';

  let { onunlock } = $props();
  let pw = $state('');
  let busy = $state(false);
  let err = $state('');
  let shake = $state(false);

  async function submit(e) {
    e.preventDefault();
    if (!pw || busy) return;
    busy = true; err = '';
    try {
      onunlock(await loadAndDecrypt(pw));
    } catch (ex) {
      busy = false;
      err = ex.message === 'data-missing'
        ? '✗ Không tải được dữ liệu mã hóa (data.enc).'
        : '✗ Mật khẩu không đúng. Vui lòng thử lại.';
      shake = false; requestAnimationFrame(() => (shake = true));
    }
  }
</script>

<div class="lock">
  <div class="corner"><ThemeSwitcher /></div>

  <form class="vault" class:shake onsubmit={submit} autocomplete="off">
    <div class="crest">Rikkeisoft · Bảo mật</div>
    <h1>Hồ sơ <em>Lãnh đạo</em></h1>
    <p class="sub">Danh bạ bảo mật đội ngũ lãnh đạo Rikkeisoft. Nhập mật khẩu chung để giải mã.</p>

    <div class="field">
      <label for="pw">Mật khẩu</label>
      <!-- svelte-ignore a11y_autofocus -->
      <input id="pw" type="password" placeholder="••••••••••" bind:value={pw} autofocus />
    </div>

    <button class="unlock" type="submit" disabled={busy}>
      {busy ? 'Đang giải mã…' : 'Giải mã & Truy cập'}
    </button>

    <div class="err">{err}</div>
    <div class="hint">
      Nội dung được mã hóa <b>AES-256</b>; không thể đọc nếu không có mật khẩu đúng.
    </div>
  </form>
</div>

<style>
  .lock {
    position: fixed; inset: 0; display: grid; place-items: center;
    padding: max(24px, env(safe-area-inset-top)) 22px max(24px, env(safe-area-inset-bottom));
    background: radial-gradient(80% 60% at 50% 0%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 60%);
  }
  .corner { position: fixed; top: max(18px, env(safe-area-inset-top)); right: 20px; }

  .vault {
    width: min(440px, 100%); position: relative; overflow: hidden; border-radius: 18px;
    padding: 44px 38px 34px; box-shadow: var(--shadow);
    background: linear-gradient(180deg, var(--panel2), var(--panel));
    border: 1px solid var(--hair); animation: rise .7s cubic-bezier(.2,.8,.2,1) both;
  }
  .vault.shake { animation: shake .4s; }
  .vault::before {
    content: ""; position: absolute; inset: 0; border-radius: 18px; padding: 1px; pointer-events: none;
    background: linear-gradient(160deg, var(--brass), transparent 42%);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude; opacity: .55;
  }
  .crest {
    font-family: var(--mono); font-size: 11px; letter-spacing: .4em; color: var(--brass);
    text-transform: uppercase; display: flex; align-items: center; gap: 12px; margin-bottom: 26px;
  }
  .crest::after { content: ""; flex: 1; height: 1px; background: var(--hair); }
  h1 { font-family: var(--serif); font-weight: 600; font-size: 34px; line-height: 1.05; letter-spacing: -.01em; }
  h1 em { font-style: italic; color: var(--accent-bright); font-weight: 500; }
  .sub { color: var(--muted); font-size: 14px; margin: 6px 0 30px; }

  .field { position: relative; margin-bottom: 16px; }
  .field label {
    position: absolute; top: -8px; left: 14px; background: var(--panel); padding: 0 7px;
    font-family: var(--mono); font-size: 10px; letter-spacing: .22em; color: var(--faint); text-transform: uppercase;
  }
  .field input {
    width: 100%; background: color-mix(in srgb, var(--bg) 55%, transparent); color: var(--ink);
    border: 1px solid var(--hair2); border-radius: 11px; padding: 16px;
    font-family: var(--mono); font-size: 16px; letter-spacing: .04em; outline: none;
    transition: border-color .2s, box-shadow .2s;
  }
  .field input:focus { border-color: var(--accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent); }

  .unlock {
    width: 100%; border: 0; cursor: pointer; color: #fff; font-weight: 700; font-size: 15px;
    padding: 16px; border-radius: 11px; margin-top: 6px;
    background: linear-gradient(180deg, var(--accent-bright), var(--accent-deep));
    box-shadow: 0 12px 26px -12px color-mix(in srgb, var(--accent) 80%, transparent);
    transition: transform .12s, filter .2s;
  }
  .unlock:hover { filter: brightness(1.08); }
  .unlock:active { transform: translateY(1px); }
  .unlock:disabled { opacity: .65; cursor: wait; }

  .err { color: var(--accent-bright); font-family: var(--mono); font-size: 13px; letter-spacing: .02em; margin-top: 14px; min-height: 18px; }
  .hint { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--hair2); font-size: 11.5px; color: var(--faint); line-height: 1.6; }
  .hint b { color: var(--muted); }
</style>
