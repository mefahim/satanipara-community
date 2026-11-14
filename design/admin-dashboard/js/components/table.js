// Table: 15px body, 14px/600 muted header, 1px line rules, wash zebra, sticky header,
// 48px min rows, sortable columns, page-based pagination (20 default / 50 max).
import { paginate } from '../lib/store.js';
import { t } from '../i18n.js';
export function renderTable({ columns, rows, page = 1, perPage = 20, onRowClick = null, stacked = false }){
  const pg = paginate(rows, page, perPage);
  const head = columns.map(c => `<th${c.sortable ? ' data-sort="' + c.key + '"' : ''}>${c.label}</th>`).join('');
  const body = pg.rows.map(r => {
    const cells = columns.map(c => `<td data-label="${c.label}">${c.render ? c.render(r) : (r[c.key] ?? '')}</td>`).join('');
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
