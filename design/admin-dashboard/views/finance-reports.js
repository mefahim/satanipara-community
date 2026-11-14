// Finance reports views: project accounts, categories, published summaries, annual reports.
// DEMO data only. Monthly summaries are COMPUTED on read from published ledger entries
// ("as of now", no stored snapshot). Report publishing follows the same dual control as
// the ledger: the publisher must differ from the person who prepared the draft.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { setHash } from '../js/lib/router.js';
import { store, writeAudit, storeAdd } from '../js/lib/store.js';
import { fmtBDT, fmtDate, fmtDateTime, fmtNum, esc } from '../js/lib/format.js';
import { badge, plainBadge } from '../js/components/badges.js';
import { renderTable, bindTableRows, bindTableSort } from '../js/components/table.js';
import { statGrid } from '../js/components/stat.js';
import { emptyState } from '../js/components/states.js';
import { validateRequired } from '../js/components/forms.js';

const STRINGS = {
  bn: {
    'title.projects': 'প্রকল্প হিসাব', 'title.categories': 'অর্থের শ্রেণি', 'title.summaries': 'প্রকাশিত সারসংক্ষেপ', 'title.reports': 'বার্ষিক প্রতিবেদন',
    'crumb.projects': 'প্রকল্প হিসাব', 'crumb.categories': 'অর্থের শ্রেণি', 'crumb.summaries': 'প্রকাশিত সারসংক্ষেপ', 'crumb.reports': 'বার্ষিক প্রতিবেদন',
    'projects.intro': 'প্রতিটি প্রকল্পের বাজেট, ব্যয় ও অবস্থা। সব অঙ্ক নমুনা তথ্য (DEMO)।',
    'projects.colName': 'প্রকল্প', 'projects.colBudget': 'বাজেট', 'projects.colSpent': 'ব্যয়', 'projects.colRemaining': 'অবশিষ্ট',
    'projects.colUsed': 'ব্যবহৃত', 'projects.colStatus': 'অবস্থা', 'projects.colEntries': 'লেজার এন্ট্রি',
    'projects.status.active': 'চলমান', 'projects.status.completed': 'সম্পন্ন', 'projects.viewLedger': 'লেজার দেখুন',
    'projects.computedNote': 'ব্যয় লেজার থেকে গণনা করা হয়েছে — সংশ্লিষ্ট প্রকল্পের প্রকাশিত ব্যয়ের এন্ট্রিগুলোর যোগফল। খসড়া এন্ট্রি যোগ হয় না।',
    'categories.intro': 'আয়, ব্যয় ও অনুদানের শ্রেণি। শ্রেণি সীড করা — নতুন শ্রেণি যোগ করা এই প্রোটোটাইপের বাইরে।',
    'categories.colName': 'শ্রেণি', 'categories.colKind': 'ধরন', 'categories.colActive': 'সক্রিয়',
    'categories.colEntries': 'এন্ট্রি', 'categories.colPublishedTotal': 'প্রকাশিত মোট', 'categories.colDrafts': 'খসড়া',
    'categories.activeYes': 'হ্যাঁ', 'categories.activeNo': 'না',
    'kind.income': 'আয়', 'kind.expense': 'ব্যয়', 'kind.donation': 'অনুদান',
    'summaries.intro': 'প্রকাশিত এন্ট্রি থেকে হিসাব করা মাসিক সারসংক্ষেপ — "এই মুহূর্তের হিসাব"। খসড়া এখানে যোগ হয় না।',
    'summaries.year': 'বছর', 'summaries.colMonth': 'মাস', 'summaries.colIncome': 'আয়', 'summaries.colDonation': 'অনুদান',
    'summaries.colExpense': 'ব্যয়', 'summaries.colNet': 'নিট', 'summaries.colEntries': 'এন্ট্রি', 'summaries.total': 'বছরের মোট',
    'summaries.asOf': 'এই মুহূর্তের হিসাব (প্রকাশিত তথ্য থেকে গণনা করা)', 'summaries.publicNote': 'সাধারণের জন্য প্রকাশিত তথ্যই শুধু দেখানো হয়।',
    'reports.intro': 'বার্ষিক প্রতিবেদন — প্রকাশিত সংস্করণ ও প্রস্তুতকৃত খসড়া। নিরীক্ষিত (audited) অবস্থা প্রতিবেদনে দেখানো হয়।',
    'reports.colYear': 'বছর', 'reports.colTitle': 'শিরোনাম', 'reports.colStatus': 'অবস্থা', 'reports.colAudited': 'নিরীক্ষিত',
    'reports.colPublished': 'প্রকাশের তারিখ', 'reports.auditedYes': 'হ্যাঁ', 'reports.auditedNo': 'না — এখনো নিরীক্ষিত হয়নি',
    'reports.prepare': 'বার্ষিক প্রতিবেদন প্রস্তুত করুন', 'reports.prepareYear': 'বছর', 'reports.prepareBtn': 'খসড়া প্রতিবেদন তৈরি করুন',
    'reports.confirmPrepare': 'এই বছরের বার্ষিক প্রতিবেদনের একটি খসড়া তৈরি হবে। প্রকাশের জন্য অন্য একজন সুপার অ্যাডমিনের অনুমোদন লাগবে।',
    'reports.prepared': 'খসড়া প্রতিবেদন তৈরি হয়েছে — অনুমোদনের অপেক্ষায় আছে।',
    'reports.noYearLeft': 'সব বছরের প্রতিবেদন ইতিমধ্যে আছে।',
    'reports.approve': 'অনুমোদন ও প্রকাশ করুন', 'reports.reject': 'প্রত্যাখ্যান করুন',
    'reports.confirmApprove': 'এই বার্ষিক প্রতিবেদনটি প্রকাশ করতে চান? প্রকাশের পর সাধারণের জন্য প্রকাশিত তথ্য হিসেবে দেখানো হবে।',
    'reports.confirmReject': 'প্রত্যাখ্যানের কারণ লিখুন (অন্তত ১০ অক্ষর)।',
    'reports.reason': 'কারণ', 'reports.reasonShort': 'কারণ অন্তত ১০ অক্ষরের হতে হবে।',
    'reports.published': 'বার্ষিক প্রতিবেদন প্রকাশিত হয়েছে।', 'reports.rejected': 'বার্ষিক প্রতিবেদন প্রত্যাখ্যাত হয়েছে।',
    'reports.selfBlock': 'আপনি এই প্রতিবেদনটি প্রস্তুত করেছেন, তাই আপনি নিজে এটি অনুমোদন করতে পারবেন না। অন্য একজন সুপার অ্যাডমিনকে অনুমোদন করতে হবে।',
    'reports.draftNote': 'খসড়া — প্রকাশের আগে অনুমোদন প্রয়োজন।', 'reports.preparedBy': 'প্রস্তুতকারী',
    'status.draft': 'খসড়া', 'status.published': 'প্রকাশিত', 'status.rejected': 'প্রত্যাখ্যাত'
  },
  en: {
    'title.projects': 'Project Accounts', 'title.categories': 'Finance Categories', 'title.summaries': 'Published Summaries', 'title.reports': 'Annual Reports',
    'crumb.projects': 'Project accounts', 'crumb.categories': 'Finance categories', 'crumb.summaries': 'Published summaries', 'crumb.reports': 'Annual reports',
    'projects.intro': 'Budget, spending and status per project. All figures are demo data (DEMO).',
    'projects.colName': 'Project', 'projects.colBudget': 'Budget', 'projects.colSpent': 'Spent', 'projects.colRemaining': 'Remaining',
    'projects.colUsed': 'Used', 'projects.colStatus': 'Status', 'projects.colEntries': 'Ledger entries',
    'projects.status.active': 'Active', 'projects.status.completed': 'Completed', 'projects.viewLedger': 'View ledger',
    'projects.computedNote': 'Spent is computed from the ledger — the sum of the project’s linked published expense entries. Draft entries are not included.',
    'categories.intro': 'Income, expense and donation categories. Categories are seeded — adding a new one is outside this prototype.',
    'categories.colName': 'Category', 'categories.colKind': 'Kind', 'categories.colActive': 'Active',
    'categories.colEntries': 'Entries', 'categories.colPublishedTotal': 'Published total', 'categories.colDrafts': 'Drafts',
    'categories.activeYes': 'Yes', 'categories.activeNo': 'No',
    'kind.income': 'Income', 'kind.expense': 'Expense', 'kind.donation': 'Donation',
    'summaries.intro': 'Monthly summaries computed from published entries — "as of now". Drafts are not included.',
    'summaries.year': 'Year', 'summaries.colMonth': 'Month', 'summaries.colIncome': 'Income', 'summaries.colDonation': 'Donations',
    'summaries.colExpense': 'Expenses', 'summaries.colNet': 'Net', 'summaries.colEntries': 'Entries', 'summaries.total': 'Year total',
    'summaries.asOf': 'As of now (computed from published entries)', 'summaries.publicNote': 'Only published information is shown to the public.',
    'reports.intro': 'Annual reports — published versions and prepared drafts. The audited state is shown on each report.',
    'reports.colYear': 'Year', 'reports.colTitle': 'Title', 'reports.colStatus': 'Status', 'reports.colAudited': 'Audited',
    'reports.colPublished': 'Published on', 'reports.auditedYes': 'Yes', 'reports.auditedNo': 'No — not audited yet',
    'reports.prepare': 'Prepare an annual report', 'reports.prepareYear': 'Year', 'reports.prepareBtn': 'Create draft report',
    'reports.confirmPrepare': 'A draft annual report for this year will be created. Another Super Admin must approve it before it is published.',
    'reports.prepared': 'Draft report created — waiting for approval.',
    'reports.noYearLeft': 'Reports already exist for every year.',
    'reports.approve': 'Approve & publish', 'reports.reject': 'Reject',
    'reports.confirmApprove': 'Publish this annual report? Once published it will be shown as published information to the public.',
    'reports.confirmReject': 'Write the reason for rejection (at least 10 characters).',
    'reports.reason': 'Reason', 'reports.reasonShort': 'The reason must be at least 10 characters.',
    'reports.published': 'Annual report published.', 'reports.rejected': 'Annual report rejected.',
    'reports.selfBlock': 'You prepared this report, so you cannot approve it yourself. Another Super Admin must approve it.',
    'reports.draftNote': 'Draft — approval is needed before publishing.', 'reports.preparedBy': 'Prepared by',
    'status.draft': 'Draft', 'status.published': 'Published', 'status.rejected': 'Rejected'
  }
};
registerStrings('finance-reports', STRINGS);
// DS v2 (audit D-09): finance.overview.publicNote lives in the base dicts
// (js/i18n/bn.js + en.js) — this file and views/finance.js both read it from
// there now; no view registers its own copy.

const L = () => getLang();
const uname = (id, lang) => { const u = store.users.find(x => x.id === id); return u ? (lang === 'bn' ? u.name_bn : u.name_en) : (id || '—'); };
const otherSAs = user => store.users.filter(u => u.role === 'super-admin' && u.status === 'active' && u.id !== user.id);
const head = (title, sub) => `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${esc(title)}</h1>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}</div></div>`;
const years = () => [...new Set(store.ledger_entries.map(e => e.entry_date.slice(0, 4)))].sort().reverse();
const monthName = (year, m, lang) => { try { return new Date(year, m, 1).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { month: 'long' }); } catch { return String(m + 1); } };
// Project spent is COMPUTED on read from the ledger (blueprint: monthly balances are
// computed on read; no stored snapshot). Only linked PUBLISHED expense entries count;
// expense amounts are stored negative, so spent = -sum. Draft/rejected/discarded/
// reversed entries never count. Projects carry no stored `spent` field (see demo-finance.js).
const spentFor = projectId => -store.ledger_entries
  .filter(e => e.project_id === projectId && e.status === 'published' && e.kind === 'expense')
  .reduce((a, e) => a + e.amount, 0);

function sortFrom(ctx){ return ctx.query.sort ? { key: ctx.query.sort, dir: ctx.query.dir || 'asc' } : null; }

function projectsHtml(ctx) {
  const lang = L();
  const rows = store.projects.map(p => ({ ...p, spent: spentFor(p.id) }));
  return head(t('finance-reports.title.projects'), t('finance-reports.projects.intro')) + `
  ${renderTable({ columns: [
    { key: 'name_bn', label: t('finance-reports.projects.colName'), sortable:true, render: r => esc(lang === 'bn' ? r.name_bn : r.name_en) },
    { key: 'budget', label: t('finance-reports.projects.colBudget'), sortable:true, render: r => `<span class="num">${fmtBDT(r.budget, lang)}</span>` },
    { key: 'spent', label: t('finance-reports.projects.colSpent'), sortable:true, render: r => `<span class="num">${fmtBDT(r.spent, lang)}</span>` },
    { key: 'remaining', label: t('finance-reports.projects.colRemaining'), render: r => `<span class="num">${fmtBDT(r.budget - r.spent, lang)}</span>` },
    { key: 'used', label: t('finance-reports.projects.colUsed'), render: r => { const pct = r.budget ? Math.round((r.spent / r.budget) * 100) : 0; return `<span class="num">${fmtNum(pct, lang)}%</span><div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style="width:${Math.min(pct, 100)}%"></div></div>`; } },
    { key: 'status', label: t('finance-reports.projects.colStatus'), render: r => plainBadge(t('finance-reports.projects.status.' + r.status)) },
    { key: 'entries', label: t('finance-reports.projects.colEntries'), render: r => `<span class="num">${fmtNum(store.ledger_entries.filter(e => e.project_id === r.id).length, lang)}</span>` }
  ], rows, page: 1, perPage: 20, onRowClick: r => '#/finance/ledger?project=' + r.id, stacked: true, sort: sortFrom(ctx) })}
  <p class="small muted">${esc(t('finance-reports.projects.computedNote'))}</p>
  <p class="mt-4"><a class="link-more" href="#/finance/ledger">${esc(t('finance-reports.projects.viewLedger'))}</a></p>
  <p class="small muted">${esc(t('finance.overview.publicNote'))}</p>`;
}
function categoriesHtml(ctx) {
  const lang = L();
  const rows = store.finance_categories.map(c => {
    const entries = store.ledger_entries.filter(e => e.category === c.id);
    return { ...c, count: entries.length, pubTotal: entries.filter(e => e.status === 'published').reduce((a, e) => a + e.amount, 0), drafts: entries.filter(e => e.status === 'draft').length };
  });
  return head(t('finance-reports.title.categories'), t('finance-reports.categories.intro')) + `
  ${renderTable({ columns: [
    { key: 'name_bn', label: t('finance-reports.categories.colName'), render: r => esc(lang === 'bn' ? r.name_bn : r.name_en) },
    { key: 'kind', label: t('finance-reports.categories.colKind'), render: r => plainBadge(t('finance-reports.kind.' + r.kind)) },
    { key: 'active', label: t('finance-reports.categories.colActive'), render: r => esc(r.active ? t('finance-reports.categories.activeYes') : t('finance-reports.categories.activeNo')) },
    { key: 'count', label: t('finance-reports.categories.colEntries'), render: r => `<span class="num">${fmtNum(r.count, lang)}</span>` },
    { key: 'pubTotal', label: t('finance-reports.categories.colPublishedTotal'), sortable:true, render: r => `<span class="num">${fmtBDT(r.pubTotal, lang)}</span>` },
    { key: 'drafts', label: t('finance-reports.categories.colDrafts'), render: r => `<span class="num">${fmtNum(r.drafts, lang)}</span>` }
  ], rows, page: 1, perPage: 20, stacked: true, sort: sortFrom(ctx) })}`;
}
function summariesHtml(ctx) {
  const lang = L();
  const year = ctx.query.year || '2026';
  const pub = store.ledger_entries.filter(e => e.entry_date.startsWith(year) && e.status === 'published');
  const rows = Array.from({ length: 12 }, (_, m) => {
    const mo = pub.filter(e => parseInt(e.entry_date.slice(5, 7), 10) === m + 1);
    const s = k => mo.filter(e => e.kind === k).reduce((a, e) => a + e.amount, 0);
    return { m, month: monthName(year, m, lang), income: s('income'), donation: s('donation'), expense: Math.abs(s('expense')), net: mo.reduce((a, e) => a + e.amount, 0), count: mo.length };
  });
  const tot = k => rows.reduce((a, r) => a + r[k], 0);
  return head(t('finance-reports.title.summaries'), t('finance-reports.summaries.intro')) + `
  <div class="filters"><label class="small" for="fr-year">${esc(t('finance-reports.summaries.year'))}</label>
    <select class="input" id="fr-year" style="max-width:160px">${years().map(y => `<option value="${y}"${y === year ? ' selected' : ''}>${y}</option>`).join('')}</select></div>
  <p class="small muted">${esc(t('finance-reports.summaries.asOf'))} · ${esc(year)}</p>
  ${renderTable({ columns: [
    { key: 'month', label: t('finance-reports.summaries.colMonth'), render: r => esc(r.month) },
    { key: 'income', label: t('finance-reports.summaries.colIncome'), sortable:true, render: r => `<span class="num">${fmtBDT(r.income, lang)}</span>` },
    { key: 'donation', label: t('finance-reports.summaries.colDonation'), sortable:true, render: r => `<span class="num">${fmtBDT(r.donation, lang)}</span>` },
    { key: 'expense', label: t('finance-reports.summaries.colExpense'), sortable:true, render: r => `<span class="num">${fmtBDT(r.expense, lang)}</span>` },
    { key: 'net', label: t('finance-reports.summaries.colNet'), sortable:true, render: r => `<span class="num">${fmtBDT(r.net, lang)}</span>` },
    { key: 'count', label: t('finance-reports.summaries.colEntries'), render: r => `<span class="num">${fmtNum(r.count, lang)}</span>` }
  ], rows, page: 1, perPage: 20, stacked: true, sort: sortFrom(ctx) })}
  ${statGrid([
    { num: fmtBDT(tot('income'), lang), label: t('finance-reports.summaries.colIncome') },
    { num: fmtBDT(tot('donation'), lang), label: t('finance-reports.summaries.colDonation') },
    { num: fmtBDT(tot('expense'), lang), label: t('finance-reports.summaries.colExpense') },
    { num: fmtBDT(tot('net'), lang), label: t('finance-reports.summaries.colNet') }
  ])}
  <p class="small muted mt-4">${esc(t('finance-reports.summaries.total'))} · ${esc(year)} — ${esc(t('finance-reports.summaries.publicNote'))}</p>`;
}
function reportsHtml(ctx) {
  const lang = L();
  const missing = years().filter(y => !store.annual_reports.some(r => String(r.year) === y));
  const rows = [...store.annual_reports].sort((a, b) => b.year - a.year);
  return head(t('finance-reports.title.reports'), t('finance-reports.reports.intro')) + `
  <section class="card"><h3>${esc(t('finance-reports.reports.prepare'))}</h3>
    ${missing.length ? `<div class="row"><label class="small" for="fr-report-year">${esc(t('finance-reports.reports.prepareYear'))}</label>
      <select class="input" id="fr-report-year" style="max-width:160px">${missing.map(y => `<option value="${y}">${y}</option>`).join('')}</select>
      <button type="button" class="btn btn-primary" id="fr-prepare">${esc(t('finance-reports.reports.prepareBtn'))}</button></div>
      <p class="small muted mt-4">${esc(t('finance-reports.reports.confirmPrepare'))}</p>`
    : `<p class="muted">${esc(t('finance-reports.reports.noYearLeft'))}</p>`}
  </section>
  ${rows.length ? renderTable({ columns: [
    { key: 'year', label: t('finance-reports.reports.colYear'), sortable:true, render: r => `<span class="num">${fmtNum(r.year, lang)}</span>` },
    { key: 'title_bn', label: t('finance-reports.reports.colTitle'), render: r => esc(lang === 'bn' ? r.title_bn : r.title_en) },
    { key: 'status', label: t('finance-reports.reports.colStatus'), render: r => badge(r.status, t('finance-reports.status.' + r.status)) },
    { key: 'audited', label: t('finance-reports.reports.colAudited'), render: r => esc(r.audited ? t('finance-reports.reports.auditedYes') : t('finance-reports.reports.auditedNo')) },
    { key: 'published_at', label: t('finance-reports.reports.colPublished'), render: r => r.published_at ? fmtDate(r.published_at, lang) : '—' }
  ], rows, page: 1, perPage: 20, stacked: true, sort: sortFrom(ctx) }) : emptyState(t('common.empty'))}
  ${rows.filter(r => r.status === 'draft').map(r => {
    const self = r.entered_by === ctx.user.id;
    return `<section class="card" role="note"><h3><span class="num">${fmtNum(r.year, lang)}</span> — ${esc(lang === 'bn' ? r.title_bn : r.title_en)}</h3>
      <p class="small">${esc(t('finance-reports.reports.draftNote'))} ${esc(t('finance-reports.reports.preparedBy'))}: ${esc(uname(r.entered_by, lang))}</p>
      ${self ? `<p class="small" role="note">${esc(t('finance-reports.reports.selfBlock'))}</p>` : ''}
      <div class="row mt-4">
        <button type="button" class="btn btn-primary" data-fr="approve" data-id="${esc(r.id)}"${self ? ' disabled' : ''}>${esc(t('finance-reports.reports.approve'))}</button>
        <button type="button" class="btn btn-secondary" data-fr="reject" data-id="${esc(r.id)}">${esc(t('finance-reports.reports.reject'))}</button>
      </div></section>`;
  }).join('')}`;
}

export const FinanceReports = {
  route: '#/finance/projects',
  title: { bn: STRINGS.bn['title.projects'], en: STRINGS.en['title.projects'] },
  breadcrumb: ['nav.dashboard', 'nav.finance'],
  roles: ['super-admin'],
  permissions: ['finance.view'],
  render(ctx) {
    const p = ctx.path;
    if (p === '/finance/projects') { this.title = { bn: STRINGS.bn['title.projects'], en: STRINGS.en['title.projects'] }; this.breadcrumb = ['nav.dashboard', 'nav.projects']; return projectsHtml(ctx); }
    if (p === '/finance/categories') { this.title = { bn: STRINGS.bn['title.categories'], en: STRINGS.en['title.categories'] }; this.breadcrumb = ['nav.dashboard', 'nav.financeCategories']; return categoriesHtml(ctx); }
    if (p === '/finance/summaries') { this.title = { bn: STRINGS.bn['title.summaries'], en: STRINGS.en['title.summaries'] }; this.breadcrumb = ['nav.dashboard', 'nav.summaries']; return summariesHtml(ctx); }
    this.title = { bn: STRINGS.bn['title.reports'], en: STRINGS.en['title.reports'] }; this.breadcrumb = ['nav.dashboard', 'nav.reports']; return reportsHtml(ctx);
  },
  onMount(ctx) {
    const root = document.getElementById('view');
    bindTableRows(root);
    // Real table sorting (DS v2, audit D-06): sort state lives in the query string.
    bindTableSort(root, (key, dir) => { const q = { ...ctx.query, sort: key, dir }; setHash(ctx.path, q); });
    const y = document.getElementById('fr-year');
    if (y) y.addEventListener('change', () => { location.hash = '#/finance/summaries?year=' + y.value; });
    const prep = document.getElementById('fr-prepare');
    if (prep) prep.addEventListener('click', () => {
      const year = (document.getElementById('fr-report-year') || {}).value;
      if (!year) return;
      ctx.modal({ title: t('finance-reports.reports.prepare'), body: `<p>${esc(t('finance-reports.reports.confirmPrepare'))}</p>`,
        confirmLabel: t('finance-reports.reports.prepareBtn'), requireReauth: true,
        onConfirm: () => {
          storeAdd('annual_reports', { id: 'ar-' + year, year: parseInt(year, 10),
            title_bn: 'বার্ষিক প্রতিবেদন ' + year + ' (ডেমো)', title_en: 'Annual report ' + year + ' (Demo)',
            audited: false, status: 'draft', published_at: null, entered_by: ctx.user.id, approved_by: null });
          writeAudit(ctx.user.id, ctx.role, 'finance.report.prepare', 'annual_report', 'ar-' + year, null, 'draft');
          ctx.toast(t('finance-reports.reports.prepared'));
          ctx.rerender();
        } });
    });
    root.querySelectorAll('[data-fr]').forEach(b => b.addEventListener('click', () => {
      const r = store.annual_reports.find(x => x.id === b.dataset.id); if (!r) return;
      if (b.dataset.fr === 'approve') {
        if (r.entered_by === ctx.user.id) { ctx.toast(t('finance-reports.reports.selfBlock')); return; }
        ctx.modal({ title: t('finance-reports.reports.approve'), body: `<p>${esc(t('finance-reports.reports.confirmApprove'))}</p>`,
          confirmLabel: t('finance-reports.reports.approve'), requireReauth: true,
          onConfirm: () => { r.status = 'published'; r.approved_by = ctx.user.id; r.published_at = new Date().toISOString(); writeAudit(ctx.user.id, ctx.role, 'finance.report.publish', 'annual_report', r.id, 'draft', 'published'); ctx.toast(t('finance-reports.reports.published')); ctx.rerender(); } });
      }
      if (b.dataset.fr === 'reject') {
        let reason = '';
        ctx.modal({ title: t('finance-reports.reports.reject'), body: `<p>${esc(t('finance-reports.reports.confirmReject'))}</p><div class="field"><label for="fr-reason">${esc(t('finance-reports.reports.reason'))} *</label><textarea id="fr-reason" class="input" rows="3"></textarea></div>`,
          confirmLabel: t('finance-reports.reports.reject'), danger: true,
          onConfirm: () => { if (!validateRequired(reason, 10)) { ctx.toast(t('finance-reports.reports.reasonShort')); return; } r.status = 'rejected'; r.rejection_reason_bn = reason.trim(); writeAudit(ctx.user.id, ctx.role, 'finance.report.reject', 'annual_report', r.id, 'draft', 'rejected'); ctx.toast(t('finance-reports.reports.rejected')); ctx.rerender(); } });
        const el = document.getElementById('fr-reason');
        if (el) el.addEventListener('input', () => { reason = el.value; });
      }
    }));
  },
  onUnmount() {}
};
