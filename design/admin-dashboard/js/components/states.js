// States: empty (plain sentence + one action, no illustration, no joke),
// loading skeleton rows in wash with reserved space, error (cause + fix + retry).
import { t } from '../i18n.js';
import { esc } from '../lib/format.js';
export function emptyState(message, actionLabel, actionHref){
  return `<div class="empty"><p>${esc(message || t('common.empty'))}</p>${actionLabel && actionHref ? `<p class="mt-4"><a class="btn btn-primary" href="${actionHref}">${esc(actionLabel)}</a></p>` : ''}</div>`;
}
export function loadingSkeleton(rows = 5){
  return `<div aria-busy="true" aria-label="${t('common.loading')}">${Array.from({length: rows}, () => '<div class="skeleton">&nbsp;</div>').join('')}</div>`;
}
export function errorState(cause, fix, onRetry){
  const id = 'err-retry-' + Math.random().toString(36).slice(2, 8);
  setTimeout(() => { const b = document.getElementById(id); if(b && onRetry) b.addEventListener('click', onRetry); }, 0);
  return `<div class="error-box" tabindex="-1" role="alert"><strong>${esc(cause)}</strong><p class="mt-4">${esc(fix)}</p><p class="mt-4"><button id="${id}" type="button" class="btn btn-primary">${t('common.retry')}</button></p></div>`;
}
