// Modal v2: confirm modal naming record + consequence; focus trap, Esc closes,
// focus returns. Sensitive actions add a re-auth password field — now VALIDATED
// (DS v2, audit §6): empty or wrong password shows an inline error and the
// modal stays open; onConfirm fires ONLY after a correct password.
// Focus starts on the FIRST focusable element (audit D-23 fix), not the last.
import { t } from '../i18n.js';
import { esc } from '../lib/format.js';
import { getUser, validateReauth } from '../lib/auth.js';
let lastFocus = null;
export function openModal({ title, body, confirmLabel, cancelLabel, danger = false, requireReauth = false, onConfirm }){
  lastFocus = document.activeElement;
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-backdrop" data-backdrop><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <h2>${esc(title)}</h2><div class="mt-4">${body}</div>
    ${requireReauth ? `<div class="field mt-4"><label for="reauth-pw">${t('login.password')} (${t('app.simulated')})</label><input id="reauth-pw" type="password" class="input" autocomplete="off" aria-describedby="reauth-err"><div class="error" id="reauth-err" role="alert" hidden></div></div>` : ''}
    <div class="modal-actions"><button type="button" class="btn btn-secondary" data-modal-cancel>${cancelLabel || t('common.cancel')}</button>
    <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-modal-confirm>${esc(confirmLabel || t('common.confirm'))}</button></div></div></div>`;
  const modal = root.querySelector('.modal');
  const focusables = () => [...modal.querySelectorAll('button, input, [href]')].filter(el => !el.disabled);
  const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey, true); if(lastFocus && lastFocus.focus) lastFocus.focus(); };
  const onKey = e => {
    if(e.key === 'Escape'){ e.stopPropagation(); close(); }
    if(e.key === 'Tab'){
      const f = focusables(); if(!f.length) return;
      const first = f[0], last = f[f.length-1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener('keydown', onKey, true);
  root.querySelector('[data-backdrop]').addEventListener('click', e => { if(e.target.dataset.backdrop !== undefined) close(); });
  root.querySelector('[data-modal-cancel]').addEventListener('click', close);
  root.querySelector('[data-modal-confirm]').addEventListener('click', () => {
    if(requireReauth){
      const pwInput = root.querySelector('#reauth-pw');
      const errEl = root.querySelector('#reauth-err');
      const res = validateReauth(pwInput ? pwInput.value : '', getUser());
      if(!res.ok){
        if(errEl){ errEl.textContent = res.error === 'empty' ? t('common.reauthEmpty') : t('common.reauthWrong'); errEl.hidden = false; }
        if(pwInput){ pwInput.setAttribute('aria-invalid', 'true'); pwInput.focus(); }
        return; // modal stays open; nothing is confirmed
      }
    }
    close(); if(onConfirm) onConfirm();
  });
  const f = focusables(); if(f.length) f[0].focus();
  return close;
}
