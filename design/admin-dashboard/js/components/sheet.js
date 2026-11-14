// Bottom sheet (DS v2): contextual actions on mobile — a sheet sliding up from
// the bottom with a handle and a list of actions; on desktop (>=640px) the same
// sheet renders as a small centred dialog. Esc / backdrop close, focus returns.
// Usage: openSheet({ title, actions:[{ label, icon?, danger?, href?, onClick? }] })
// An action with `href` navigates; with `onClick` runs it, then closes.
import { t } from '../i18n.js';
import { esc } from '../lib/format.js';
import { icon } from './icons.js';
let lastFocus = null;
export function openSheet({ title, actions = [], onClose }){
  lastFocus = document.activeElement;
  const root = document.getElementById('drawer-root');
  root.innerHTML = `<div class="sheet-backdrop" data-backdrop></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title || '')}">
    <div class="sheet-handle" aria-hidden="true"></div>
    <div class="row"><h2 class="grow">${esc(title || '')}</h2>
    <button type="button" class="icon-btn" data-sheet-close aria-label="${t('common.close')}">${icon('close')}</button></div>
    <div class="mt-4">${actions.map((a, i) => a.href
      ? `<a class="sheet-action${a.danger ? ' danger' : ''}" href="${esc(a.href)}" data-sheet-action="${i}">${a.icon ? icon(a.icon) : ''}<span>${esc(a.label)}</span></a>`
      : `<button type="button" class="sheet-action${a.danger ? ' danger' : ''}" data-sheet-action="${i}">${a.icon ? icon(a.icon) : ''}<span>${esc(a.label)}</span></button>`).join('')}
    </div></div>`;
  const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey, true); if(lastFocus && lastFocus.focus) lastFocus.focus(); if(onClose) onClose(); };
  const onKey = e => { if(e.key === 'Escape'){ e.stopPropagation(); close(); } };
  document.addEventListener('keydown', onKey, true);
  root.querySelector('[data-backdrop]').addEventListener('click', close);
  root.querySelector('[data-sheet-close]').addEventListener('click', close);
  root.querySelectorAll('[data-sheet-action]').forEach(el => el.addEventListener('click', () => {
    const a = actions[Number(el.dataset.sheetAction)];
    close();
    if(a && a.onClick) a.onClick();
  }));
  root.querySelector('[data-sheet-close]').focus();
  return close;
}
