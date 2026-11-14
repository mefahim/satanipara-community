// Reports & Analytics — #/reports, Journey L (audit §3.10 #44, QA defect D2).
// Date-range summaries + per-module breakdowns, all figures COMPUTED live from the
// demo store, never hand-typed. Super Admin only.
// Exports: CSV downloads a real file (client-side Blob). Excel/PDF have no real
// generator in this dependency-free prototype, so they are SIMULATED exports: the
// action shows a clear simulated-export toast and downloads the same data as a CSV
// fallback — never a dead button. Every export needs confirmation and writes a
// demo audit row (exports are sensitive, contract §7).
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store, writeAudit } from '../js/lib/store.js';
import { fmtBDT, fmtDate, fmtNum, esc } from '../js/lib/format.js';
import { bindTableRows } from '../js/components/table.js';
import { emptyState } from '../js/components/states.js';

const STRINGS = {
  bn: {
    'title': 'প্রতিবেদন ও বিশ্লেষণ', 'intro': 'তারিখের পরিসর অনুযায়ী সারসংক্ষেপ ও প্রতি মডিউলের বিশ্লেষণ। সব অঙ্ক নমুনা তথ্য (DEMO) থেকে গণনা করা হয়েছে।',
    'filter.from': 'শুরুর তারিখ', 'filter.to': 'শেষের তারিখ', 'filter.apply': 'প্রতিবেদন দেখান',
    'sec.members': 'সদস্য প্রতিবেদন', 'sec.services': 'সেবা প্রতিবেদন', 'sec.finance': 'অর্থ প্রতিবেদন', 'sec.activity': 'কার্যক্রম প্রতিবেদন',
    'col.label': 'বিবরণ', 'col.count': 'সংখ্যা', 'col.amount': 'পরিমাণ',
    'members.total': 'মোট সদস্য', 'members.newInRange': 'এই পরিসরে নতুন নিবন্ধন', 'members.byStatus': 'অবস্থা অনুযায়ী', 'members.byType': 'ধরন অনুযায়ী',
    'status.approved': 'অনুমোদিত', 'status.pending': 'অপেক্ষমাণ', 'status.rejected': 'প্রত্যাখ্যাত', 'status.suspended': 'স্থগিত',
    'type.resident': 'স্থানীয় বাসিন্দা', 'type.expat': 'প্রবাসী', 'type.student': 'শিক্ষার্থী',
    'services.total': 'মোট অনুরোধ', 'services.byStatus': 'অবস্থা অনুযায়ী', 'services.byService': 'সেবা অনুযায়ী', 'services.urgent': 'জরুরি অনুরোধ', 'services.emergency': 'জরুরি (৯৯৯) চিহ্নিত', 'services.stale': '৭২ ঘণ্টার বেশি আটকে থাকা (in_progress)', 'services.expenses': 'নথিভুক্ত ব্যয় (এই পরিসরের অনুরোধ)',
    'req.pending': 'অপেক্ষমাণ', 'req.accepted': 'গৃহীত', 'req.in_progress': 'চলমান', 'req.completed': 'সম্পন্ন', 'req.closed': 'বন্ধ', 'req.rejected': 'প্রত্যাখ্যাত', 'req.cancelled': 'বাতিল',
    'blood.total': 'রক্তের অনুরোধ (এই পরিসরে)', 'blood.fulfilled': 'পূরণ হয়েছে', 'blood.open': 'খোলা আছে',
    'finance.publishedOnly': 'শুধু প্রকাশিত এন্ট্রি গণনা করা হয়েছে — খসড়া এখানে যোগ হয় না।', 'finance.income': 'আয়', 'finance.donation': 'অনুদান', 'finance.expense': 'ব্যয়', 'finance.net': 'নিট উদ্বৃত্ত', 'finance.byCategory': 'শ্রেণি অনুযায়ী (প্রকাশিত)', 'finance.drafts': 'অনুমোদনের অপেক্ষায় খসড়া',
    'activity.total': 'মোট কার্যক্রম', 'activity.byCategory': 'শ্রেণি অনুযায়ী', 'activity.byStatus': 'অবস্থা অনুযায়ী', 'activity.beneficiaries': 'মোট উপকারভোগী', 'activity.posts': 'কনটেন্ট আইটেম (অবস্থা অনুযায়ী)', 'activity.audit': 'অডিট ঘটনা (এই পরিসরে, গোষ্ঠী অনুযায়ী)',
    'export.csv': 'CSV ডাউনলোড', 'export.xlsx': 'Excel রপ্তানি', 'export.pdf': 'PDF রপ্তানি',
    'export.confirmTitle': 'রপ্তানি করবেন?', 'export.confirmBody': 'এই প্রতিবেদনটি রপ্তানি করা হবে এবং কাজটি অডিট লগে লেখা হবে।',
    'export.done': 'রপ্তানি সম্পন্ন হয়েছে — CSV ফাইল ডাউনলোড হচ্ছে।', 'export.simulated': 'এই প্রোটোটাইপে Excel/PDF রপ্তানি অনুকরণ করা হয়েছে — একই তথ্য CSV হিসেবে ডাউনলোড হচ্ছে।',
    'export.note': 'Excel ও PDF রপ্তানি এই প্রোটোটাইপে অনুকরণ করা (simulated) — ক্লিক করলে একই তথ্যের CSV ফাইল ডাউনলোড হয়। আসল ব্যবস্থায় সার্ভার থেকে আসল ফাইল তৈরি হবে।',
    'asOf': 'এই মুহূর্তের হিসাব (প্রকাশিত তথ্য থেকে গণনা করা)'
  },
  en: {
    'title': 'Reports & Analytics', 'intro': 'Date-range summaries and per-module breakdowns. All figures are computed from the demo data (DEMO).',
    'filter.from': 'From date', 'filter.to': 'To date', 'filter.apply': 'Show report',
    'sec.members': 'Member reports', 'sec.services': 'Service reports', 'sec.finance': 'Finance reports', 'sec.activity': 'Activity reports',
    'col.label': 'Item', 'col.count': 'Count', 'col.amount': 'Amount',
    'members.total': 'Total members', 'members.newInRange': 'New registrations in range', 'members.byStatus': 'By status', 'members.byType': 'By type',
    'status.approved': 'Approved', 'status.pending': 'Pending', 'status.rejected': 'Rejected', 'status.suspended': 'Suspended',
    'type.resident': 'Resident', 'type.expat': 'Expatriate', 'type.student': 'Student',
    'services.total': 'Total requests', 'services.byStatus': 'By status', 'services.byService': 'By service', 'services.urgent': 'Urgent requests', 'services.emergency': 'Emergency (999) flagged', 'services.stale': 'Stale over 72 h (in_progress)', 'services.expenses': 'Recorded expenses (requests in range)',
    'req.pending': 'Pending', 'req.accepted': 'Accepted', 'req.in_progress': 'In progress', 'req.completed': 'Completed', 'req.closed': 'Closed', 'req.rejected': 'Rejected', 'req.cancelled': 'Cancelled',
    'blood.total': 'Blood requests (in range)', 'blood.fulfilled': 'Fulfilled', 'blood.open': 'Still open',
    'finance.publishedOnly': 'Only published entries are counted — drafts are not included.', 'finance.income': 'Income', 'finance.donation': 'Donations', 'finance.expense': 'Expenses', 'finance.net': 'Net balance', 'finance.byCategory': 'By category (published)', 'finance.drafts': 'Drafts awaiting approval',
    'activity.total': 'Total activities', 'activity.byCategory': 'By category', 'activity.byStatus': 'By status', 'activity.beneficiaries': 'Total beneficiaries', 'activity.posts': 'Content items (by status)', 'activity.audit': 'Audit events (in range, by group)',
    'export.csv': 'Download CSV', 'export.xlsx': 'Export Excel', 'export.pdf': 'Export PDF',
    'export.confirmTitle': 'Export this report?', 'export.confirmBody': 'This report will be exported and the action will be written to the audit log.',
    'export.done': 'Export complete — the CSV file is downloading.', 'export.simulated': 'Excel/PDF export is simulated in this prototype — the same data is downloading as CSV.',
    'export.note': 'Excel and PDF exports are simulated in this prototype — clicking one downloads the same data as CSV. In the real system the server will generate the real file.',
    'asOf': 'As of now (computed from published entries)'
  }
};
registerStrings('reports', STRINGS);

const L = () => getLang();
const inRange = (iso, from, to) => !!iso && iso.slice(0, 10) >= from && iso.slice(0, 10) <= to;
const countBy = (list, fn) => { const m = new Map(); list.forEach(x => { const k = fn(x); m.set(k, (m.get(k) || 0) + 1); }); return [...m.entries()].map(([k, v]) => ({ label: k, count: v })); };
const sumBy = (list, fn) => list.reduce((a, x) => a + (fn(x) || 0), 0);
const rangeOf = ctx => ({ from: ctx.query.from || '2026-01-01', to: ctx.query.to || '2026-12-31' });
const head = (title, sub) => `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${esc(title)}</h1>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}</div></div>`;
// Breakdown rows use a definition list, not the shared table: a two-column table
// is 640px wide and overflows the half-width section card (its count column hides
// behind an inner scroll). The kv list always fits the card.
const kvTable = rows => `<dl class="kv">` + rows.map(r => `<dt>${esc(r.label)}</dt><dd class="num">${r.money ? fmtBDT(r.count, L()) : fmtNum(r.count, L())}</dd>`).join('') + `</dl>`;
const exportBtns = section => `<div class="row mt-4">
  <button type="button" class="btn btn-primary" data-export="${section}" data-format="csv">${esc(t('reports.export.csv'))}</button>
  <button type="button" class="btn btn-secondary" data-export="${section}" data-format="xlsx">${esc(t('reports.export.xlsx'))}</button>
  <button type="button" class="btn btn-secondary" data-export="${section}" data-format="pdf">${esc(t('reports.export.pdf'))}</button></div>`;

// One row-builder per section, shared by the screen and the CSV export — the
// downloaded file always matches what the screen shows.
function sectionRows(section, from, to) {
  const lang = L();
  if (section === 'members') {
    const inR = store.members.filter(m => inRange(m.created_at, from, to));
    return [
      { label: t('reports.members.total'), count: store.members.length },
      { label: t('reports.members.newInRange'), count: inR.length },
      ...countBy(store.members, m => t('reports.status.' + m.status)).map(r => ({ label: t('reports.members.byStatus') + ' — ' + r.label, count: r.count })),
      ...countBy(store.members, m => t('reports.type.' + m.type)).map(r => ({ label: t('reports.members.byType') + ' — ' + r.label, count: r.count }))
    ];
  }
  if (section === 'services') {
    const inR = store.service_requests.filter(r => inRange(r.created_at, from, to));
    const ref = new Date('2026-11-14T00:00:00+06:00');
    const stale = store.service_requests.filter(r => r.status === 'in_progress' && r.last_update_at && (ref - new Date(r.last_update_at)) > 72 * 3600 * 1000).length;
    const expTotal = sumBy(store.service_request_expenses.filter(e => inR.some(r => r.request_no === e.request_no)), e => e.amount);
    const blood = store.blood_requests.filter(b => inRange(b.created_at, from, to));
    return [
      { label: t('reports.services.total'), count: store.service_requests.length },
      ...countBy(store.service_requests, r => t('reports.req.' + r.status)).map(r => ({ label: t('reports.services.byStatus') + ' — ' + r.label, count: r.count })),
      ...countBy(store.service_requests, r => r.service_name_bn).map(r => ({ label: t('reports.services.byService') + ' — ' + r.label, count: r.count })),
      { label: t('reports.services.urgent'), count: store.service_requests.filter(r => r.urgency === 'urgent').length },
      { label: t('reports.services.emergency'), count: store.service_requests.filter(r => r.is_emergency).length },
      { label: t('reports.services.stale'), count: stale },
      { label: t('reports.services.expenses'), count: expTotal, money: true },
      { label: t('reports.blood.total'), count: blood.length },
      { label: t('reports.blood.fulfilled'), count: blood.filter(b => b.status === 'fulfilled').length },
      { label: t('reports.blood.open'), count: blood.filter(b => !['fulfilled', 'cancelled'].includes(b.status)).length }
    ];
  }
  if (section === 'finance') {
    const pub = store.ledger_entries.filter(e => e.status === 'published' && inRange(e.entry_date, from, to));
    const sum = k => pub.filter(e => e.kind === k).reduce((a, e) => a + e.amount, 0);
    const catName = id => { const c = store.finance_categories.find(x => x.id === id); return c ? (lang === 'bn' ? c.name_bn : c.name_en) : id; };
    return [
      { label: t('reports.finance.income'), count: sum('income'), money: true },
      { label: t('reports.finance.donation'), count: sum('donation'), money: true },
      { label: t('reports.finance.expense'), count: Math.abs(sum('expense')), money: true },
      { label: t('reports.finance.net'), count: pub.reduce((a, e) => a + e.amount, 0), money: true },
      ...countBy(pub, e => catName(e.category)).map(r => ({ label: t('reports.finance.byCategory') + ' — ' + r.label, count: r.count })),
      { label: t('reports.finance.drafts'), count: store.ledger_entries.filter(e => e.status === 'draft').length }
    ];
  }
  // activity
  const acts = store.activities.filter(a => inRange(a.date, from, to));
  const posts = store.posts.filter(p => inRange(p.publish_at || p.created_at || '', from, to));
  const audit = store.activity_log.filter(a => inRange(a.created_at, from, to));
  const groupOf = a => a.action.split('.')[0];
  return [
    { label: t('reports.activity.total'), count: store.activities.length },
    ...countBy(store.activities, a => a.category).map(r => ({ label: t('reports.activity.byCategory') + ' — ' + r.label, count: r.count })),
    ...countBy(store.activities, a => a.status).map(r => ({ label: t('reports.activity.byStatus') + ' — ' + r.label, count: r.count })),
    { label: t('reports.activity.beneficiaries'), count: sumBy(acts, a => a.beneficiary_count) },
    ...countBy(store.posts, p => p.status).map(r => ({ label: t('reports.activity.posts') + ' — ' + r.label, count: r.count })),
    ...countBy(audit, groupOf).map(r => ({ label: t('reports.activity.audit') + ' — ' + r.label, count: r.count }))
  ];
}
function downloadCsv(section, from, to) {
  const rows = sectionRows(section, from, to);
  const q = v => '"' + String(v).replace(/"/g, '""') + '"';
  const csv = '\uFEFF' + [q(t('reports.col.label')) + ',' + q(t('reports.col.count')), ...rows.map(r => q(r.label) + ',' + r.count)].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `satanipara-reports-${section}-${from}_to_${to}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function doExport(ctx, section, format) {
  const { from, to } = rangeOf(ctx);
  const simulated = format !== 'csv';
  ctx.modal({
    title: t('reports.export.confirmTitle'),
    body: `<p>${esc(t('reports.export.confirmBody'))}</p><p class="small muted">${esc(t('reports.sec.' + section))} · ${fmtDate(from + 'T00:00:00+06:00', L())} – ${fmtDate(to + 'T00:00:00+06:00', L())} · ${format.toUpperCase()}</p>`,
    confirmLabel: t('reports.export.' + format),
    onConfirm: () => {
      writeAudit(ctx.user.id, ctx.role, 'export.reports', 'reports', section, null, format + (simulated ? ' (simulated, csv fallback)' : ''));
      downloadCsv(section, from, to);
      setTimeout(() => ctx.toast(t(simulated ? 'reports.export.simulated' : 'reports.export.done')), 350);
    }
  });
}

export const Reports = {
  route: '#/reports',
  title: { bn: 'প্রতিবেদন ও বিশ্লেষণ', en: 'Reports & Analytics' },
  breadcrumb: ['nav.dashboard', 'nav.finance'],
  roles: ['super-admin'],
  permissions: ['reports.view'],
  render(ctx) {
    const lang = L();
    const { from, to } = rangeOf(ctx);
    const section = (sec, rows, note) => `<section class="card" data-section="${sec}"><h3>${esc(t('reports.sec.' + sec))}</h3>
      ${note ? `<p class="small muted">${esc(note)}</p>` : ''}
      ${rows.length ? kvTable(rows) : emptyState(t('common.empty'))}
      ${exportBtns(sec)}</section>`;
    return head(t('reports.title'), t('reports.intro')) + `
  <form class="card" id="rep-filter"><div class="row">
    <div class="field"><label for="rep-from">${esc(t('reports.filter.from'))}</label><input id="rep-from" type="date" class="input" value="${from}"></div>
    <div class="field"><label for="rep-to">${esc(t('reports.filter.to'))}</label><input id="rep-to" type="date" class="input" value="${to}"></div>
    <div class="field"><label>&nbsp;</label><button type="submit" class="btn btn-primary">${esc(t('reports.filter.apply'))}</button></div>
  </div></form>
  <p class="small muted">${esc(t('reports.asOf'))} · <span class="num">${fmtDate(from + 'T00:00:00+06:00', lang)} – ${fmtDate(to + 'T00:00:00+06:00', lang)}</span></p>
  <div class="two-col">
    ${section('members', sectionRows('members', from, to))}
    ${section('services', sectionRows('services', from, to))}
    ${section('finance', sectionRows('finance', from, to), t('reports.finance.publishedOnly'))}
    ${section('activity', sectionRows('activity', from, to))}
  </div>
  <p class="small muted mt-4">${esc(t('reports.export.note'))}</p>`;
  },
  onMount(ctx) {
    const root = document.getElementById('view');
    bindTableRows(root);
    const form = document.getElementById('rep-filter');
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      const f = document.getElementById('rep-from').value || '2026-01-01';
      const tt = document.getElementById('rep-to').value || '2026-12-31';
      location.hash = '#/reports?from=' + f + '&to=' + tt;
    });
    root.querySelectorAll('[data-export]').forEach(b => b.addEventListener('click', () => doExport(ctx, b.dataset.export, b.dataset.format)));
  },
  onUnmount() {}
};
