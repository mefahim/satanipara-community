// Dashboard view — Super Admin full overview + Helper reduced overview (own queue only).
// All data DEMO-labelled. Every KPI navigates to its filtered module. No decorative charts.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store, counts, unreadCount } from '../js/lib/store.js';
import { fmtBDT, fmtDate, fmtPhoneMasked, esc } from '../js/lib/format.js';
import { badge } from '../js/components/badges.js';
import { actionLabel } from './audit.js';
import { renderTable, bindTableRows } from '../js/components/table.js';
registerStrings('dashboard', { bn: {}, en: {} }); // shell strings cover dashboard; namespace reserved.
export const Dashboard = {
  route: '#/dashboard',
  title: { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  breadcrumb: ['nav.dashboard'],
  roles: ['super-admin', 'expatriate-helper'],
  permissions: [],
  render(ctx){
    return ctx.role === 'expatriate-helper' ? helperHtml(ctx) : saHtml(ctx);
  },
  onMount(ctx){
    bindTableRows(document.getElementById('view'));
    const q = document.getElementById('helper-q');
    if(q) q.addEventListener('input', () => ctx.rerender && ctx.rerender());
  }
};
function saHtml(ctx){
  const lang = getLang();
  const c = counts();
  const preview = store.ledger_entries.filter(e => e.entry_date.startsWith('2026') && e.status === 'published' && e.amount > 0);
  const previewSum = preview.slice(0, 4).reduce((a, e) => a + e.amount, 0);
  const fullSum = preview.reduce((a, e) => a + e.amount, 0);
  const urgent = store.service_requests.filter(r => r.urgency === 'urgent' && ['pending','accepted','in_progress'].includes(r.status));
  const recent = [...store.service_requests].sort((a,b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
  const pendingMembers = store.members.filter(m => m.status === 'pending');
  const recentAudit = store.activity_log.slice(0, 5);
  const notifs = store.notifications.filter(n => n.user_id === ctx.user.id).slice(0, 5);
  const stat = (href, num, label) => `<a class="stat" href="${href}"><div class="num">${num}</div><div class="lbl">${label}</div></a>`;
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t('dashboard.saTitle')}</h1><p class="sub">${t('app.tagline')}</p></div></div>
  <div class="stat-grid">
    ${stat('#/members', c.totalMembers, t('dashboard.kpiMembers'))}
    ${stat('#/members?status=pending', c.pendingMembers, t('dashboard.kpiPendingMembers'))}
    ${stat('#/expatriate?status=in_progress', c.activeRequests, t('dashboard.kpiActiveRequests'))}
    ${stat('#/finance', fmtBDT(fullSum, lang), t('dashboard.kpiFinanceMonth'))}
  </div>
  <div class="two-col mt-6">
    <section class="card"><h3>${t('dashboard.urgent')} (${urgent.length})</h3>
      ${urgent.length ? urgent.map(r => `<div class="list-row"><div class="grow"><strong class="num">${esc(r.request_no)}</strong> — ${esc(r.service_name_bn)}<br><span class="small muted">${esc(r.applicant_name_bn)} · ${fmtDate(r.created_at, lang)}</span></div>${badge(r.status)}</div>`).join('') : `<p class="muted">${t('common.empty')}</p>`}
      <p class="mt-4"><a href="#/expatriate?urgency=urgent">${t('common.viewAll')}</a></p></section>
    <section class="card"><h3>${t('dashboard.pendingApprovals')} (${pendingMembers.length})</h3>
      ${pendingMembers.map(m => `<div class="list-row"><div class="grow"><strong>${esc(m.name_bn)}</strong><br><span class="small muted">${fmtPhoneMasked(m.phone)} · ${fmtDate(m.created_at, lang)}</span></div><a class="btn btn-secondary btn-sm" href="#/members/${m.id}">${t('common.viewAll')}</a></div>`).join('')}
      <p class="mt-4"><a href="#/members?status=pending">${t('common.viewAll')}</a></p></section>
  </div>
  <section class="card"><h3>${t('dashboard.recentRequests')}</h3>
    ${renderTable({ columns: [
      { key:'request_no', label:t('dashboard.colRequest'), render: r => `<span class="num">${esc(r.request_no)}</span>` },
      { key:'service_name_bn', label:t('dashboard.colService'), render: r => esc(r.service_name_bn) },
      { key:'status', label:t('dashboard.colStatus'), render: r => badge(r.status) },
      { key:'created_at', label:t('dashboard.colDate'), render: r => fmtDate(r.created_at, lang) }
    ], rows: recent, page: 1, perPage: 5, onRowClick: r => '#/expatriate/' + r.request_no, stacked: true })}
    <p class="mt-4"><a href="#/expatriate">${t('common.viewAll')}</a></p></section>
  <div class="two-col">
    <section class="card"><h3>${t('dashboard.financeSnapshot')}</h3>
      <dl class="kv"><dt>${t('dashboard.financePreviewNote')}</dt><dd class="num">${fmtBDT(previewSum, lang)}</dd>
      <dt>${t('dashboard.financeFullNote')}</dt><dd class="num">${fmtBDT(fullSum, lang)}</dd></dl>
      <p class="small muted mt-4">2026 · ${t('app.demo')}</p>
      <p class="mt-4"><a href="#/finance">${t('common.viewAll')}</a></p></section>
    <section class="card"><h3>${t('dashboard.notifications')}</h3>
      ${notifs.map(n => `<div class="list-row"><div class="grow${n.read ? '' : ' notif-unread'}">${esc(lang === 'bn' ? n.title_bn : n.title_en)}<br><span class="small muted">${esc(lang === 'bn' ? n.body_bn : n.body_en)}</span></div></div>`).join('')}
      <p class="mt-4"><a href="#/notifications">${t('common.viewAll')}</a></p></section>
  </div>
  <section class="card"><h3>${t('dashboard.recentAdmin')}</h3>
    ${recentAudit.map(a => `<div class="list-row"><div class="grow"><strong>${esc(actionLabel(a.action))}</strong> — <span class="num">${esc(a.subject_id)}</span><br><span class="small muted">${fmtDate(a.created_at, lang)} · ${esc(a.actor_role)}</span></div></div>`).join('')}
    <p class="mt-4"><a href="#/audit">${t('common.viewAll')}</a></p></section>`;
}
function helperHtml(ctx){
  const lang = getLang();
  const mine = store.service_requests.filter(r => r.assigned_helper_id === ctx.user.id);
  const byStatus = s => mine.filter(r => r.status === s).length;
  const pending = store.service_requests.filter(r => r.status === 'pending');
  const urgent = mine.filter(r => r.urgency === 'urgent' && ['pending','accepted','in_progress'].includes(r.status));
  const stat = (href, num, label) => `<a class="stat" href="${href}"><div class="num">${num}</div><div class="lbl">${label}</div></a>`;
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t('dashboard.helperTitle')}</h1><p class="sub">${esc(ctx.user.name_bn)} · ${t('app.tagline')}</p></div></div>
  <div class="stat-grid">
    ${stat('#/expatriate?status=pending', pending.length, t('dashboard.myPending'))}
    ${stat('#/expatriate?assigned=me', mine.length, t('dashboard.myAssigned'))}
    ${stat('#/expatriate?urgency=urgent', urgent.length, t('dashboard.myUrgent'))}
    ${stat('#/expatriate?status=in_progress', byStatus('in_progress'), t('dashboard.myInProgress'))}
  </div>
  <section class="card mt-6"><h3>${t('dashboard.helperQueue')}</h3>
    <div class="filters"><input class="input search-box" id="helper-q" type="search" placeholder="${t('common.search')}…" aria-label="${t('common.search')}"></div>
    ${renderTable({ columns: [
      { key:'request_no', label:t('dashboard.colRequest'), render: r => `<span class="num">${esc(r.request_no)}</span>` },
      { key:'service_name_bn', label:t('dashboard.colService'), render: r => esc(r.service_name_bn) },
      { key:'status', label:t('dashboard.colStatus'), render: r => badge(r.status) },
      { key:'assigned', label:t('dashboard.colAssigned'), render: r => r.assigned_helper_id === ctx.user.id ? '✓' : '—' }
    ], rows: mine, page: 1, perPage: 20, onRowClick: r => '#/expatriate/' + r.request_no, stacked: true })}
    <p class="mt-4"><a href="#/expatriate">${t('common.viewAll')}</a></p></section>
  <p class="small muted">${t('dashboard.myCompleted')}: ${byStatus('completed')}</p>`;
}
