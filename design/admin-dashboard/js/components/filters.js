// Filters: search box (48px) + filter chips (44px pills, forest fill when active) + clear-filters.
// Search semantics per Doc 16 §3.4: default-parser FULLTEXT + BOOLEAN MODE, +term* wildcards,
// LIKE 'term%' autocomplete, >=2-char terms; no "fuzzy search" claim anywhere.
import { t } from '../i18n.js';
export function renderFilters({ q = '', chips = [], activeChip = null, onSearch = null, onChip = null, onClear = null }){
  return `<div class="filters" role="search">
    <input class="input search-box" type="search" data-filter-q value="${q}" placeholder="${t('common.search')}…" aria-label="${t('common.search')}">
    ${chips.map(c => `<button type="button" class="chip" data-chip="${c.value}" aria-pressed="${activeChip === c.value}">${c.label}</button>`).join('')}
    <button type="button" class="btn btn-ghost btn-sm" data-clear-filters>${t('common.clearFilters')}</button>
  </div>`;
}
export function bindFilters(root, { onSearch, onChip, onClear }){
  const q = root.querySelector('[data-filter-q]');
  if(q && onSearch) q.addEventListener('change', () => onSearch(q.value));
  root.querySelectorAll('[data-chip]').forEach(b => b.addEventListener('click', () => onChip && onChip(b.dataset.chip)));
  const clear = root.querySelector('[data-clear-filters]');
  if(clear && onClear) clear.addEventListener('click', onClear);
}
