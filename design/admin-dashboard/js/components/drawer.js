// Drawer: slide-over (right desktop, bottom sheet mobile) for quick views; Esc/backdrop closes; focus returns.
import { esc } from '../lib/format.js';
import { t } from '../i18n.js';
let lastFocus = null;
export function openDrawer({ title, body, onClose }){
  lastFocus = document.activeElement;
  const root = document.getElementById('drawer-root');
  root.innerHTML = `<div class="drawer-backdrop" data-backdrop></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="row"><h2 class="grow">${esc(title)}</h2><button type="button" class="icon-btn" data-drawer-close aria-label="${t('common.close')}">✕</button></div>
    <div class="mt-4">${body}</div></aside>`;
  const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey, true); if(lastFocus && lastFocus.focus) lastFocus.focus(); if(onClose) onClose(); };
  const onKey = e => { if(e.key === 'Escape'){ e.stopPropagation(); close(); } };
  document.addEventListener('keydown', onKey, true);
  root.querySelector('[data-backdrop]').addEventListener('click', close);
  root.querySelector('[data-drawer-close]').addEventListener('click', close);
  root.querySelector('[data-drawer-close]').focus();
  return close;
}
