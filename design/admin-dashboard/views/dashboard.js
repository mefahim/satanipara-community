// Dashboard view — Super Admin full overview + Helper reduced overview (own queue only).
// All data DEMO-labelled. Every KPI navigates to its filtered module. No decorative charts.
// v2: shared statCard/statGrid, real table sorting (?sort=&dir=), .link-more for
// standalone links, live clock (now()) for greeting + date, no 350 ms toast delay.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { hashWithQuery } from '../js/lib/router.js';
import { store, counts } from '../js/lib/store.js';
import { fmtBDT, fmtDate, fmtNum, fmtPhoneMasked, esc, now } from '../js/lib/format.js';
import { badge } from '../js/components/badges.js';
import { actionLabel } from '../js/lib/action-label.js';
import { renderTable, bindTableRows, bindTableSort } from '../js/components/table.js';
import { statGrid } from '../js/components/stat.js';
import { emptyState } from '../js/components/states.js';

registerStrings('dashboard', { bn: {
  'greeting.morning': 'শুভ সকাল', 'greeting.afternoon': 'শুভ দুপুর',
  'greeting.evening': 'শুভ সন্ধ্যা', 'greeting.night': 'শুভ রাত্রি',
  'attentionTitle': 'যা দেখা দরকার', 'attentionSub': 'সবার আগে এগুলো দেখুন — প্রতিটি সারি সংশ্লিষ্ট পাতায় নিয়ে যাবে।',
  'attentionEmpty': 'এই মুহূর্তে জরুরি কিছু অপেক্ষমাণ নেই।',
  'attention.pendingMembers': 'সদস্য অনুমোদন অপেক্ষমাণ',
  'attention.urgentRequests': 'জরুরি প্রবাসী অনুরোধ',
  'attention.staleRequests': '৭২ ঘণ্টার বেশি আপডেট হয়নি এমন অনুরোধ',
  'attention.pendingFinance': 'অর্থের খসড়া অনুমোদনের অপেক্ষায়',
  'attention.unreadMessages': 'অপঠিত যোগাযোগ বার্তা',
  'review': 'পর্যালোচনা করুন',
  'financeIncome': 'আয় (প্রকাশিত, ২০২৬)',
  'financeExpense': 'ব্যয় (প্রকাশিত, ২০২৬)',
  'financeNet': 'নিট (প্রকাশিত, ২০২৬)',
  'financePending': 'অনুমোদনের অপেক্ষায় থাকা খসড়া',
  'unreadCount': '{n}টি অপঠিত',
  'notifEmpty': 'কোনো বিজ্ঞপ্তি নেই।',
  'recentEmpty': 'এখনো কোনো অনুরোধ নেই।',
  'pendingEmpty': 'কোনো সদস্য অনুমোদন অপেক্ষমাণ নেই।',
  'activityEmpty': 'এখনো কোনো কার্যক্রম নেই।',
  'queueSearchPh': 'অনুরোধ নম্বর বা সেবা খুঁজুন',
  'queueEmpty': 'আপনার সারিতে কোনো অনুরোধ নেই।'
}, en: {
  'greeting.morning': 'Good morning', 'greeting.afternoon': 'Good afternoon',
  'greeting.evening': 'Good evening', 'greeting.night': 'Good night',
  'attentionTitle': 'Needs your attention', 'attentionSub': 'Look at these first — every row leads to the relevant page.',
  'attentionEmpty': 'Nothing urgent is waiting right now.',
  'attention.pendingMembers': 'Member approvals pending',
  'attention.urgentRequests': 'Urgent expatriate requests',
  'attention.staleRequests': 'Requests with no update for over 72 hours',
  'attention.pendingFinance': 'Finance drafts awaiting approval',
  'attention.unreadMessages': 'Unread contact messages',
  'review': 'Review',
  'financeIncome': 'Income (published, 2026)',
  'financeExpense': 'Expenses (published, 2026)',
  'financeNet': 'Net (published, 2026)',
  'financePending': 'Drafts awaiting approval',
  'unreadCount': '{n} unread',
  'notifEmpty': 'No notifications.',
  'recentEmpty': 'No requests yet.',
  'pendingEmpty': 'No member approvals are pending.',
  'activityEmpty': 'No activity yet.',
  'queueSearchPh': 'Search request number or service',
  'queueEmpty': 'No requests in your queue.'
} });

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
    const view = document.getElementById('view');
    bindTableRows(view);
    bindTableSort(view, (key, dir) => { location.hash = dashHash(ctx, { sort: key, dir }); });
    const q = document.getElementById('helper-q');
    // Search fires on change (blur/Enter) — deliberate, so typing never drops focus.
    if(q) q.addEventListener('change', () => { location.hash = dashHash(ctx, { q: q.value, page: 1 }); });
  }
};

function dashHash(ctx, patch){ return hashWithQuery('#/dashboard', ctx.query, patch); }

function dhakaHour(){
  try { return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: 'numeric', hour12: false }).format(now())); }
  catch { return now().getHours(); }
}
function greeting(){
  const h = dhakaHour();
  if(h >= 5 && h < 12) return t('dashboard.greeting.morning');
  if(h >= 12 && h < 17) return t('dashboard.greeting.afternoon');
  if(h >= 17 && h < 21) return t('dashboard.greeting.evening');
  return t('dashboard.greeting.night');
}
function dateLine(lang){
  const d = now();
  try {
    const wd = d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { timeZone: 'Asia/Dhaka', weekday: 'long' });
    return wd + ' · ' + fmtDate(d.toISOString(), lang);
  } catch { return fmtDate(d.toISOString(), lang); }
}
function tableSort(ctx){
  const k = ctx.query.sort, d = ctx.query.dir;
  return k && (d === 'asc' || d === 'desc') ? { key: k, dir: d } : null;
}
function requestColumns(lang){
  return [
    { key: 'request_no', label: t('dashboard.colRequest'), sortable: true, render: r => `<span class="num">${esc(r.request_no)}</span>` },
    { key: 'service_name_bn', label: t('dashboard.colService'), sortable: true, render: r => esc(r.service_name_bn) },
    { key: 'status', label: t('dashboard.colStatus'), sortable: true, render: r => badge(r.status) },
    { key: 'created_at', label: t('dashboard.colDate'), sortable: true, render: r => fmtDate(r.created_at, lang) }
  ];
}

function saHtml(ctx){
  const lang = getLang();
  const c = counts();
  const published26 = store.ledger_entries.filter(e => e.entry_date.startsWith('2026') && e.status === 'published');
  const income = published26.filter(e => e.amount > 0).reduce((a, e) => a + e.amount, 0);
  const expense = published26.filter(e => e.amount < 0).reduce((a, e) => a + e.amount, 0);
  const preview = published26.filter(e => e.amount > 0);
  const previewSum = preview.slice(0, 4).reduce((a, e) => a + e.amount, 0);
  const fullSum = preview.reduce((a, e) => a + e.amount, 0);
  const urgent = store.service_requests.filter(r => r.urgency === 'urgent' && ['pending', 'accepted', 'in_progress'].includes(r.status));
  const recent = [...store.service_requests].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
  const pendingMembers = store.members.filter(m => m.status === 'pending');
  const recentAudit = store.activity_log.slice(0, 5);
  const notifs = store.notifications.filter(n => n.user_id === ctx.user.id).slice(0, 5);
  const unread = store.notifications.filter(n => n.user_id === ctx.user.id && !n.read).length;
  const attention = [
    { href: '#/members?status=pending', label: t('dashboard.attention.pendingMembers'), n: c.pendingMembers },
    { href: '#/expatriate?urgency=urgent', label: t('dashboard.attention.urgentRequests'), n: c.urgentRequests },
    { href: '#/expatriate?status=in_progress', label: t('dashboard.attention.staleRequests'), n: c.staleRequests },
    { href: '#/finance/pending', label: t('dashboard.attention.pendingFinance'), n: c.pendingFinance },
    { href: '#/messages', label: t('dashboard.attention.unreadMessages'), n: c.unreadMessages }
  ].filter(a => a.n > 0);
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${esc(greeting())}, ${esc(ctx.user.name_bn)}</h1><p class="sub">${esc(dateLine(lang))} · ${t('app.tagline')}</p></div></div>
  ${statGrid([
    { href: '#/members', num: fmtNum(c.totalMembers, lang), label: t('dashboard.kpiMembers') },
    { href: '#/members?status=pending', num: fmtNum(c.pendingMembers, lang), label: t('dashboard.kpiPendingMembers') },
    { href: '#/expatriate?status=in_progress', num: fmtNum(c.activeRequests, lang), label: t('dashboard.kpiActiveRequests') },
    { href: '#/finance', num: fmtBDT(fullSum, lang), label: t('dashboard.kpiFinanceMonth') }
  ])}
  <section class="card mt-6"><h3>${t('dashboard.attentionTitle')}</h3>
    <p class="small muted">${t('dashboard.attentionSub')}</p>
    ${attention.length ? attention.map(a => `<a class="list-row" href="${a.href}"><div class="grow"><strong>${esc(a.label)}</strong></div><span class="num"><strong>${fmtNum(a.n, lang)}</strong></span></a>`).join('') : emptyState(t('dashboard.attentionEmpty'))}
  </section>
  <div class="two-col mt-6">
    <section class="card"><h3>${t('dashboard.urgent')} (${fmtNum(urgent.length, lang)})</h3>
      ${urgent.length ? urgent.map(r => `<a class="list-row" href="#/expatriate/${esc(r.request_no)}"><div class="grow"><strong class="num">${esc(r.request_no)}</strong> — ${esc(r.service_name_bn)}<br><span class="small muted">${esc(r.applicant_name_bn)} · ${fmtDate(r.created_at, lang)}</span></div>${badge(r.status)}</a>`).join('') : emptyState(t('dashboard.recentEmpty'))}
      <p class="mt-4"><a class="link-more" href="#/expatriate?urgency=urgent">${t('common.viewAll')}</a></p></section>
    <section class="card"><h3>${t('dashboard.pendingApprovals')} (${fmtNum(pendingMembers.length, lang)})</h3>
      ${pendingMembers.length ? pendingMembers.map(m => `<div class="list-row"><div class="grow"><strong>${esc(m.name_bn)}</strong><br><span class="small muted">${fmtPhoneMasked(m.phone)} · ${fmtDate(m.created_at, lang)}</span></div><a class="btn btn-secondary btn-sm" href="#/members/${m.id}">${t('dashboard.review')}</a></div>`).join('') : emptyState(t('dashboard.pendingEmpty'))}
      <p class="mt-4"><a class="link-more" href="#/members?status=pending">${t('common.viewAll')}</a></p></section>
  </div>
  <section class="card"><h3>${t('dashboard.recentRequests')}</h3>
    ${renderTable({ columns: requestColumns(lang), rows: recent, page: 1, perPage: 5, onRowClick: r => '#/expatriate/' + r.request_no, stacked: true, sort: tableSort(ctx) })}
    <p class="mt-4"><a class="link-more" href="#/expatriate">${t('common.viewAll')}</a></p></section>
  <div class="two-col">
    <section class="card"><h3>${t('dashboard.financeSnapshot')}</h3>
      <dl class="kv"><dt>${t('dashboard.financeIncome')}</dt><dd class="num">${fmtBDT(income, lang)}</dd>
      <dt>${t('dashboard.financeExpense')}</dt><dd class="num">${fmtBDT(expense, lang)}</dd>
      <dt>${t('dashboard.financeNet')}</dt><dd class="num">${fmtBDT(income + expense, lang)}</dd>
      <dt>${t('dashboard.financePreviewNote')}</dt><dd class="num">${fmtBDT(previewSum, lang)}</dd>
      <dt>${t('dashboard.financeFullNote')}</dt><dd class="num">${fmtBDT(fullSum, lang)}</dd>
      <dt>${t('dashboard.financePending')}</dt><dd class="num"><a class="link-more" href="#/finance/pending">${fmtNum(c.pendingFinance, lang)}</a></dd></dl>
      <p class="small muted mt-4">2026 · ${t('app.demo')}</p>
      <p class="mt-4"><a class="link-more" href="#/finance">${t('common.viewAll')}</a></p></section>
    <section class="card"><h3>${t('dashboard.notifications')}</h3>
      <p class="small muted">${esc(t('dashboard.unreadCount').replace('{n}', fmtNum(unread, lang)))}</p>
      ${notifs.length ? notifs.map(n => `<a class="list-row" href="${esc(n.related || '#/notifications')}"><div class="grow${n.read ? '' : ' notif-unread'}">${esc(lang === 'bn' ? n.title_bn : n.title_en)}<br><span class="small muted">${esc(lang === 'bn' ? n.body_bn : n.body_en)}</span></div></a>`).join('') : emptyState(t('dashboard.notifEmpty'))}
      <p class="mt-4"><a class="link-more" href="#/notifications">${t('common.viewAll')}</a></p></section>
  </div>
  <section class="card"><h3>${t('dashboard.recentAdmin')}</h3>
    ${recentAudit.length ? recentAudit.map(a => `<a class="list-row" href="#/audit/${esc(a.id)}"><div class="grow"><strong>${esc(actionLabel(a.action))}</strong> — <span class="num">${esc(a.subject_id)}</span><br><span class="small muted">${fmtDate(a.created_at, lang)} · ${esc(a.actor_role)}</span></div></a>`).join('') : emptyState(t('dashboard.activityEmpty'))}
    <p class="mt-4"><a class="link-more" href="#/audit">${t('common.viewAll')}</a></p></section>`;
}

function helperHtml(ctx){
  const lang = getLang();
  const mine = store.service_requests.filter(r => r.assigned_helper_id === ctx.user.id);
  const byStatus = s => mine.filter(r => r.status === s).length;
  const pending = store.service_requests.filter(r => r.status === 'pending');
  const urgent = mine.filter(r => r.urgency === 'urgent' && ['pending', 'accepted', 'in_progress'].includes(r.status));
  const q = (ctx.query.q || '').trim().toLowerCase();
  const shown = q ? mine.filter(r => [r.request_no, r.service_name_bn, r.applicant_name_bn].some(v => String(v || '').toLowerCase().includes(q))) : mine;
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t('dashboard.helperTitle')}</h1><p class="sub">${esc(greeting())}, ${esc(ctx.user.name_bn)} · ${esc(dateLine(lang))}</p></div></div>
  ${statGrid([
    { href: '#/expatriate?status=pending', num: fmtNum(pending.length, lang), label: t('dashboard.myPending') },
    { href: '#/expatriate?assigned=me', num: fmtNum(mine.length, lang), label: t('dashboard.myAssigned') },
    { href: '#/expatriate?urgency=urgent', num: fmtNum(urgent.length, lang), label: t('dashboard.myUrgent') },
    { href: '#/expatriate?status=in_progress', num: fmtNum(byStatus('in_progress'), lang), label: t('dashboard.myInProgress') }
  ])}
  <section class="card mt-6"><h3>${t('dashboard.helperQueue')}</h3>
    <div class="filters"><input class="input search-box" id="helper-q" type="search" value="${esc(ctx.query.q || '')}" placeholder="${esc(t('dashboard.queueSearchPh'))}…" aria-label="${esc(t('dashboard.queueSearchPh'))}"></div>
    ${shown.length ? renderTable({ columns: [
      { key: 'request_no', label: t('dashboard.colRequest'), sortable: true, render: r => `<span class="num">${esc(r.request_no)}</span>` },
      { key: 'service_name_bn', label: t('dashboard.colService'), sortable: true, render: r => esc(r.service_name_bn) },
      { key: 'status', label: t('dashboard.colStatus'), sortable: true, render: r => badge(r.status) },
      { key: 'assigned', label: t('dashboard.colAssigned'), render: r => r.assigned_helper_id === ctx.user.id ? '✓' : '—' }
    ], rows: shown, page: 1, perPage: 20, onRowClick: r => '#/expatriate/' + r.request_no, stacked: true, sort: tableSort(ctx) }) : emptyState(t('dashboard.queueEmpty'))}
    <p class="mt-4"><a class="link-more" href="#/expatriate">${t('common.viewAll')}</a></p></section>
  <p class="small muted">${t('dashboard.myCompleted')}: <a href="#/expatriate?status=completed">${fmtNum(byStatus('completed'), lang)}</a></p>`;
}
