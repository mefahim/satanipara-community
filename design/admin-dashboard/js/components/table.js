// Table v2: 15px body, 14px/600 muted header, 1px line rules, wash zebra, sticky
// header, 48px min rows, page-based pagination (20 default / 50 max) — and REAL
// sorting (DS v2, audit D-06). A column with `sortable:true` renders a button
// header; bindTableSort() wires the click and calls onSort(key, dir).
// Views keep the sort state (usually in the query string, e.g. ?sort=name&dir=asc)
// and pass `sort:{key,dir}` back in; renderTable sorts BEFORE paginating.
// Sort is stable, numeric-aware, and compares Bengali/Latin digits as numbers.
import { paginate } from '../lib/store.js';
import { t } from '../i18n.js';
import { esc } from '../lib/format.js';
export function sortRows(rows, key, dir = 'asc', get = null){
  const val = get || (r => r[key]);
  const factor = dir === 'desc' ? -1 : 1;
  const num = v => { const n = Number(String(v ?? '').replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d))); return Number.isFinite(n) ? n : null; };
  return [...rows].sort((a, b) => {
    const av = val(a), bv = val(b);
    const an = num(av), bn = num(bv);
    if(an !== null && bn !== null && String(av).trim() !== '' && String(bv).trim() !== '') return (an - bn) * factor;
    return String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true }) * factor;
  });
}
export function renderTable({ columns, rows, page = 1, perPage = 20, onRowClick = null, stacked = false, sort = null }){
  const sorted = sort && sort.key ? sortRows(rows, sort.key, sort.dir || 'asc') : rows;
  const pg = paginate(sorted, page, perPage);
  const head = columns.map(c => {
    if(!c.sortable) return `<th>${esc(c.label)}</th>`;
    const active = sort && sort.key === c.key;
    const aria = active ? (sort.dir === 'desc' ? 'descending' : 'ascending') : 'none';
    return `<th aria-sort="${aria}"><button type="button" class="th-sort" data-sort="${esc(c.key)}" aria-label="${esc(c.label)}">${esc(c.label)}<span class="sort-ico" aria-hidden="true"></span></button></th>`;
  }).join('');
  const body = pg.rows.map(r => {
    const cells = columns.map(c => `<td data-label="${esc(c.label)}">${c.render ? c.render(r) : esc(r[c.key] ?? '')}</td>`).join('');
    return `<tr${onRowClick ? ` data-href="${onRowClick(r)}" tabindex="0"` : ''}>${cells}</tr>`;
  }).join('') || `<tr><td colspan="${columns.length}"><div class="empty">${t('common.empty')}</div></td></tr>`;
  const pager = `<div class="pagination"><span>${t('common.showing')} ${pg.from}–${pg.to} ${t('common.of')} ${pg.total}</span>
    <label>${t('common.showing')} <select data-per-page aria-label="per page"><option value="20"${pg.perPage===20?' selected':''}>20</option><option value="50"${pg.perPage===50?' selected':''}>50</option></select></label>
    <span>Page ${pg.page} / ${pg.pages}</span></div>`;
  return `<div class="${stacked ? 'stack-cards' : ''}"><div class="table-wrap"><table class="tbl"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>${pager}</div>`;
}
export function bindTableRows(root){
  root.querySelectorAll('tr[data-href]').forEach(tr => {
    tr.addEventListener('click', () => { location.hash = tr.dataset.href; });
    tr.addEventListener('keydown', e => { if(e.key === 'Enter'){ location.hash = tr.dataset.href; } });
  });
}
// onSort(key, dir) — dir toggles asc→desc on the same column, resets to asc on a new one.
// Reads the current state from the clicked header's aria-sort so no view state is needed here.
export function bindTableSort(root, onSort){
  root.querySelectorAll('[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
      const th = btn.closest('th');
      const current = th ? th.getAttribute('aria-sort') : 'none';
      const dir = current === 'ascending' ? 'desc' : 'asc';
      if(onSort) onSort(btn.dataset.sort, dir);
    });
  });
}
