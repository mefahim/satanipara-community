// Finance views — Journey J: overview, ledger, new/edit, detail, reverse, pending queue.
// DEMO data only. Dual control + immutability enforced in the UI (audit §1.5):
// published entries are immutable; corrections only via reversal; approver ≠ enterer;
// one reversal per original; reversed/discarded entries immutable; no service-charge field.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store, writeAudit, filterList, activeSuperAdmins } from '../js/lib/store.js';
import { fmtBDT, fmtDate, fmtDateTime, fmtNum, esc } from '../js/lib/format.js';
import { badge, plainBadge } from '../js/components/badges.js';
import { renderTable, bindTableRows } from '../js/components/table.js';
import { renderFilters, bindFilters } from '../js/components/filters.js';
import { field, errorSummary, validateRequired } from '../js/components/forms.js';
import { emptyState } from '../js/components/states.js';
import { notFoundHtml } from '../js/lib/guards.js';

const STRINGS = {
  bn: {
    'title.overview': 'অর্থ — সারসংক্ষেপ', 'title.ledger': 'লেজার এন্ট্রি', 'title.new': 'নতুন এন্ট্রি', 'title.detail': 'এন্ট্রির বিবরণ', 'title.edit': 'খসড়া সম্পাদনা', 'title.reverse': 'বিপরীত এন্ট্রি তৈরি', 'title.pending': 'অনুমোদনের অপেক্ষায়',
    'crumb.detail': 'এন্ট্রির বিবরণ', 'crumb.new': 'নতুন এন্ট্রি', 'crumb.edit': 'সম্পাদনা', 'crumb.reverse': 'বিপরীত এন্ট্রি', 'crumb.pending': 'অনুমোদনের অপেক্ষায়', 'overview.intro': 'প্রকাশিত তথ্য শুধুমাত্র — খসড়া এখানে যোগ হয় না। সব অঙ্ক নমুনা তথ্য (DEMO)।',
    'overview.income': 'আয় (প্রকাশিত)', 'overview.donation': 'অনুদান (প্রকাশিত)', 'overview.expense': 'ব্যয় (প্রকাশিত)', 'overview.net': 'নিট উদ্বৃত্ত (প্রকাশিত)', 'overview.preview4': 'প্রাকদর্শন: প্রথম ৪টি সারি', 'overview.fullYear': 'পূর্ণ বছর: সব সারি',
    'overview.snapshot': 'অর্থের সারসংক্ষেপ', 'overview.recent': 'সাম্প্রতিক প্রকাশিত এন্ট্রি', 'overview.pendingCard': 'অপেক্ষমাণ খসড়া', 'overview.pendingNone': 'কোনো খসড়া অপেক্ষমাণ নেই।', 'overview.publicNote': 'সাধারণের জন্য প্রকাশিত তথ্যই শুধু দেখানো হয়।',
    'overview.year': 'বছর', 'overview.gotoLedger': 'সব লেজার দেখুন', 'overview.gotoPending': 'অনুমোদনের সারি দেখুন', 'ledger.intro': 'বছর অনুযায়ী সাজানো লেজার। প্রকাশিত এন্ট্রি অপরিবর্তনীয় — সংশোধন শুধু বিপরীত এন্ট্রি দিয়ে।',
    'ledger.colNo': 'এন্ট্রি নম্বর', 'ledger.colDate': 'তারিখ', 'ledger.colItem': 'বিবরণ', 'ledger.colKind': 'ধরন', 'ledger.colCategory': 'শ্রেণি', 'ledger.colAmount': 'পরিমাণ', 'ledger.colStatus': 'অবস্থা', 'ledger.colEntered': 'প্রবেশকারী',
    'ledger.kindAll': 'সব', 'ledger.yearAll': 'সব বছর', 'ledger.statusAll': 'সব অবস্থা', 'ledger.sort': 'সাজান', 'ledger.sortDateDesc': 'তারিখ: নতুন আগে', 'ledger.sortDateAsc': 'তারিখ: পুরোনো আগে', 'ledger.sortAmtDesc': 'পরিমাণ: বেশি আগে', 'ledger.sortAmtAsc': 'পরিমাণ: কম আগে',
    'ledger.newEntry': 'নতুন এন্ট্রি', 'ledger.projectFilter': 'প্রকল্পের এন্ট্রি দেখানো হচ্ছে', 'kind.income': 'আয়', 'kind.expense': 'ব্যয়', 'kind.donation': 'অনুদান',
    'status.draft': 'খসড়া', 'status.published': 'প্রকাশিত', 'status.rejected': 'প্রত্যাখ্যাত', 'status.discarded': 'বাতিল', 'status.reversed': 'বিপরীতকৃত', 'pending.intro': 'খসড়া এন্ট্রি অনুমোদন করলেই প্রকাশিত হয়। অনুমোদনকারী প্রবেশকারী হতে পারবেন না।',
    'pending.empty': 'কোনো খসড়া অপেক্ষমাণ নেই।', 'pending.secondApprover': 'দ্বিতীয় অনুমোদক উপলব্ধ', 'pending.noSecond': 'দ্বিতীয় কোনো সুপার অ্যাডমিন নেই — দ্বিতীয় অনুমোদক না আসা পর্যন্ত প্রকাশ বন্ধ থাকবে। নিজে অনুমোদন করা যাবে না।',
    'pending.selfBlock': 'আপনি এই এন্ট্রিটি লিখেছেন, তাই আপনি নিজে এটি অনুমোদন করতে পারবেন না। অন্য একজন সুপার অ্যাডমিনকে অনুমোদন করতে হবে।',
    'pending.selfBlockShort': 'নিজের এন্ট্রি — অনুমোদন বন্ধ', 'act.approve': 'অনুমোদন ও প্রকাশ করুন', 'act.reject': 'প্রত্যাখ্যান করুন', 'act.discard': 'খসড়া বাতিল করুন', 'act.edit': 'সম্পাদনা করুন', 'act.reverse': 'বিপরীত এন্ট্রি তৈরি করুন', 'act.view': 'বিবরণ দেখুন',
    'act.confirmApprove': 'এই এন্ট্রিটি প্রকাশ করতে চান? প্রকাশের পর আর সম্পাদনা বা মোছা যাবে না।', 'act.confirmReject': 'প্রত্যাখ্যানের কারণ লিখুন (অন্তত ১০ অক্ষর)। এন্ট্রিটি খসড়া অবস্থায় থাকবে।',
    'act.confirmDiscard': 'খসড়া বাতিলের কারণ লিখুন (অন্তত ১০ অক্ষর)। এন্ট্রি নম্বর আর ব্যবহার হবে না।', 'act.reason': 'কারণ', 'act.reasonShort': 'কারণ অন্তত ১০ অক্ষরের হতে হবে।',
    'act.approved': 'এন্ট্রি প্রকাশিত হয়েছে।', 'act.rejected': 'এন্ট্রি প্রত্যাখ্যাত হয়েছে।', 'act.discarded': 'খসড়া বাতিল হয়েছে।', 'act.created': 'খসড়া এন্ট্রি তৈরি হয়েছে — অনুমোদনের অপেক্ষায় আছে।', 'act.reversalCreated': 'বিপরীত এন্ট্রির খসড়া তৈরি হয়েছে — অনুমোদনের অপেক্ষায় আছে।',
    'act.reversalPublished': 'বিপরীত এন্ট্রি প্রকাশিত হয়েছে — মূল এন্ট্রিটি বিপরীতকৃত হয়েছে।', 'act.blockedSelf': 'নিজের এন্ট্রি নিজে অনুমোদন করা যায় না।', 'detail.immutable': 'এই এন্ট্রিটি প্রকাশিত — এটি সম্পাদনা বা মোছা যাবে না। ভুল থাকলে বিপরীত এন্ট্রি দিয়ে সংশোধন করুন।',
    'detail.immutableReversed': 'এই এন্ট্রিটি বিপরীতকৃত — এটি আর পরিবর্তন করা যাবে না।', 'detail.immutableDiscarded': 'এই এন্ট্রিটি বাতিল — এটি আর পরিবর্তন করা যাবে না।', 'detail.immutableRejected': 'এই এন্ট্রিটি প্রত্যাখ্যাত — কারণ নিচে দেওয়া আছে।',
    'detail.draftNote': 'এটি একটি খসড়া — প্রকাশের আগে সম্পাদনা করা যায়। প্রবেশকারী ও এন্ট্রি নম্বর পরিবর্তন করা যায় না।', 'detail.reversalOf': 'এটি মূল এন্ট্রির বিপরীত এন্ট্রি', 'detail.reversedBy': 'বিপরীত এন্ট্রি', 'detail.original': 'মূল এন্ট্রি',
    'detail.reversalExists': 'এই এন্ট্রির একটি বিপরীত এন্ট্রি ইতিমধ্যে আছে — দ্বিতীয় বিপরীত এন্ট্রি করা যায় না।', 'detail.approvedBy': 'অনুমোদনকারী', 'detail.approvedAt': 'অনুমোদনের সময়', 'detail.enteredBy': 'প্রবেশকারী',
    'detail.payee': 'প্রাপক / প্রদানকারী', 'detail.voucher': 'ভাউচার', 'detail.project': 'প্রকল্প', 'detail.none': '—', 'detail.date': 'লেনদেনের তারিখ', 'detail.amount': 'পরিমাণ', 'detail.category': 'শ্রেণি', 'detail.item': 'বিবরণ',
    'form.itemBn': 'বিবরণ (বাংলা)', 'form.itemEn': 'বিবরণ (ইংরেজি, ঐচ্ছিক)', 'form.kind': 'ধরন', 'form.category': 'শ্রেণি', 'form.project': 'প্রকল্প / কার্যক্রম (ঐচ্ছিক)', 'form.projectNone': 'কোনো প্রকল্প নয়', 'form.date': 'লেনদেনের তারিখ',
    'form.amount': 'পরিমাণ (টাকা)', 'form.amountHint': 'ধনাত্মক সংখ্যা লিখুন — ব্যয় হলে স্বয়ংক্রিয়ভাবে বিয়োগ হিসেবে ধরা হবে।',
    'form.payee': 'প্রাপক / প্রদানকারী', 'form.voucherFile': 'ভাউচার আপলোড (ছবি বা PDF)', 'form.voucherHint': 'নমুনা প্রোটোটাইপে ফাইল সংরক্ষিত হয় না — শুধু নাম ও প্রাকদর্শন দেখানো হয়।',
    'form.voucherChosen': 'নির্বাচিত ফাইল', 'form.enteredBy': 'প্রবেশকারী', 'form.saveDraft': 'খসড়া হিসেবে সংরক্ষণ করুন', 'form.saveChanges': 'পরিবর্তন সংরক্ষণ করুন', 'form.updated': 'খসড়া হালনাগাদ হয়েছে।',
    'form.errItem': 'বিবরণ লিখুন (অন্তত ২ অক্ষর)।', 'form.errAmount': 'সঠিক পরিমাণ লিখুন (০-এর বেশি)।', 'form.errDate': 'তারিখ দিন।', 'form.errCategory': 'শ্রেণি বেছে নিন।', 'form.errPayee': 'প্রাপক / প্রদানকারীর নাম লিখুন।',
    'reverse.intro': 'বিপরীত এন্ট্রির পরিমাণ মূল এন্ট্রির উল্টো হবে এবং মূল এন্ট্রির সঙ্গে যুক্ত থাকবে। অনুমোদনের পর মূল এন্ট্রিটি বিপরীতকৃত হবে।', 'reverse.reason': 'বিপরীতকরণের কারণ', 'reverse.amountAuto': 'স্বয়ংক্রিয় পরিমাণ (মূলের উল্টো)',
    'reverse.prefilled': 'মূল এন্ট্রি থেকে নেওয়া হয়েছে — পরিবর্তন করা যায় না।',
    'reverse.original': 'মূল এন্ট্রি', 'reverse.blockedReversed': 'এই এন্ট্রিটি ইতিমধ্যে বিপরীতকৃত — আর বিপরীত করা যায় না।', 'reverse.blockedPending': 'এই এন্ট্রির একটি বিপরীত খসড়া ইতিমধ্যে অপেক্ষমাণ — অনুমোদন না হওয়া পর্যন্ত নতুন বিপরীত এন্ট্রি করা যায় না।'
  },
  en: {
    'title.overview': 'Finance — Overview', 'title.ledger': 'Ledger Entries', 'title.new': 'New Entry', 'title.detail': 'Entry Detail', 'title.edit': 'Edit Draft', 'title.reverse': 'Create Reversal Entry', 'title.pending': 'Pending Approval',
    'crumb.detail': 'Entry detail', 'crumb.new': 'New entry', 'crumb.edit': 'Edit', 'crumb.reverse': 'Reversal entry', 'crumb.pending': 'Pending approval', 'overview.intro': 'Published figures only — drafts are not included here. All amounts are demo data (DEMO).',
    'overview.income': 'Income (published)', 'overview.donation': 'Donations (published)', 'overview.expense': 'Expenses (published)', 'overview.net': 'Net balance (published)', 'overview.preview4': 'Preview: first 4 rows', 'overview.fullYear': 'Full year: all rows',
    'overview.snapshot': 'Finance snapshot', 'overview.recent': 'Recently published entries', 'overview.pendingCard': 'Pending drafts', 'overview.pendingNone': 'No drafts are pending.', 'overview.publicNote': 'Only published information is shown to the public.',
    'overview.year': 'Year', 'overview.gotoLedger': 'View full ledger', 'overview.gotoPending': 'View approval queue', 'ledger.intro': 'Ledger grouped by year. Published entries are immutable — correct them only with a reversal entry.',
    'ledger.colNo': 'Entry no.', 'ledger.colDate': 'Date', 'ledger.colItem': 'Description', 'ledger.colKind': 'Kind', 'ledger.colCategory': 'Category', 'ledger.colAmount': 'Amount', 'ledger.colStatus': 'Status', 'ledger.colEntered': 'Entered by',
    'ledger.kindAll': 'All', 'ledger.yearAll': 'All years', 'ledger.statusAll': 'All statuses', 'ledger.sort': 'Sort',
    'ledger.sortDateDesc': 'Date: newest first', 'ledger.sortDateAsc': 'Date: oldest first', 'ledger.sortAmtDesc': 'Amount: highest first', 'ledger.sortAmtAsc': 'Amount: lowest first',
    'ledger.newEntry': 'New entry', 'ledger.projectFilter': 'Showing entries for this project', 'kind.income': 'Income', 'kind.expense': 'Expense', 'kind.donation': 'Donation',
    'status.draft': 'Draft', 'status.published': 'Published', 'status.rejected': 'Rejected', 'status.discarded': 'Discarded', 'status.reversed': 'Reversed', 'pending.intro': 'Approving a draft publishes it. The approver must not be the person who entered it.',
    'pending.empty': 'No drafts are pending.', 'pending.secondApprover': 'Second approver available', 'pending.noSecond': 'There is no second Super Admin — publishing stays blocked until a second approver exists. Self-approval is never allowed.',
    'pending.selfBlock': 'You entered this entry, so you cannot approve it yourself. Another Super Admin must approve it.', 'pending.selfBlockShort': 'Own entry — approval blocked',
    'act.approve': 'Approve & publish', 'act.reject': 'Reject', 'act.discard': 'Discard draft', 'act.edit': 'Edit', 'act.reverse': 'Create reversal entry', 'act.view': 'View detail', 'act.confirmApprove': 'Publish this entry? After publishing it can no longer be edited or deleted.',
    'act.confirmReject': 'Write the reason for rejection (at least 10 characters). The entry stays a draft.', 'act.confirmDiscard': 'Write the reason for discarding the draft (at least 10 characters). The entry number will never be reused.',
    'act.reason': 'Reason', 'act.reasonShort': 'The reason must be at least 10 characters.', 'act.approved': 'Entry published.', 'act.rejected': 'Entry rejected.', 'act.discarded': 'Draft discarded.', 'act.created': 'Draft entry created — waiting for approval.',
    'act.reversalCreated': 'Reversal draft created — waiting for approval.', 'act.reversalPublished': 'Reversal published — the original entry is now reversed.',
    'act.blockedSelf': 'You cannot approve your own entry.', 'detail.immutable': 'This entry is published — it cannot be edited or deleted. Correct a mistake with a reversal entry.',
    'detail.immutableReversed': 'This entry has been reversed — it cannot be changed again.', 'detail.immutableDiscarded': 'This entry was discarded — it cannot be changed again.', 'detail.immutableRejected': 'This entry was rejected — the reason is shown below.',
    'detail.draftNote': 'This is a draft — it can be edited before publishing. The enterer and entry number cannot be changed.', 'detail.reversalOf': 'This is the reversal of the original entry', 'detail.reversedBy': 'Reversal entry', 'detail.original': 'Original entry',
    'detail.reversalExists': 'A reversal already exists for this entry — a second reversal is not allowed.', 'detail.approvedBy': 'Approved by', 'detail.approvedAt': 'Approved at', 'detail.enteredBy': 'Entered by',
    'detail.payee': 'Payee', 'detail.voucher': 'Voucher', 'detail.project': 'Project', 'detail.none': '—', 'detail.date': 'Transaction date', 'detail.amount': 'Amount', 'detail.category': 'Category', 'detail.item': 'Description',
    'form.itemBn': 'Description (Bengali)', 'form.itemEn': 'Description (English, optional)', 'form.kind': 'Kind', 'form.category': 'Category', 'form.project': 'Project / activity (optional)', 'form.projectNone': 'No project', 'form.date': 'Transaction date',
    'form.amount': 'Amount (BDT)', 'form.amountHint': 'Enter a positive number — expenses are recorded as a deduction automatically.',
    'form.payee': 'Payee', 'form.voucherFile': 'Upload voucher (image or PDF)', 'form.voucherHint': 'In this demo prototype the file is not stored — only its name and preview are shown.',
    'form.voucherChosen': 'Selected file', 'form.enteredBy': 'Entered by', 'form.saveDraft': 'Save as draft', 'form.saveChanges': 'Save changes', 'form.updated': 'Draft updated.',
    'form.errItem': 'Enter a description (at least 2 characters).', 'form.errAmount': 'Enter a valid amount (greater than 0).', 'form.errDate': 'Enter a date.', 'form.errCategory': 'Choose a category.', 'form.errPayee': 'Enter the payee name.',
    'reverse.intro': 'The reversal amount is the opposite of the original and stays linked to it. The original becomes reversed once the reversal is approved.', 'reverse.reason': 'Reason for reversal', 'reverse.amountAuto': 'Automatic amount (opposite of original)',
    'reverse.prefilled': 'Taken from the original entry — cannot be changed.',
    'reverse.original': 'Original entry', 'reverse.blockedReversed': 'This entry is already reversed — it cannot be reversed again.', 'reverse.blockedPending': 'A reversal draft for this entry is already pending — no new reversal can be created until it is decided.'
  }
};
registerStrings('finance', STRINGS);

// ---------- helpers (derive; never edit demo data files) ----------
const L = () => getLang();
const uname = (id, lang) => { const u = store.users.find(x => x.id === id); return u ? (lang === 'bn' ? u.name_bn : u.name_en) : (id || '—'); };
const catName = (id, lang) => { const c = store.finance_categories.find(x => x.id === id); return c ? (lang === 'bn' ? c.name_bn : c.name_en) : '—'; };
const projName = (id, lang) => { const p = store.projects.find(x => x.id === id); return p ? (lang === 'bn' ? p.name_bn : p.name_en) : null; };
const itemOf = (e, lang) => lang === 'bn' ? e.item_bn : (e.item_en || e.item_bn);
const payeeOf = (e, lang) => lang === 'bn' ? e.payee_bn : (e.payee_en || e.payee_bn);
const entryByNo = no => store.ledger_entries.find(e => e.entry_no === no);
const reversalOf = no => store.ledger_entries.find(e => e.reverses === no);
const isSelf = (e, user) => e.entered_by === user.id;
const otherSAs = user => store.users.filter(u => u.role === 'super-admin' && u.status === 'active' && u.id !== user.id);
const years = () => [...new Set(store.ledger_entries.map(e => e.entry_date.slice(0, 4)))].sort().reverse();
const reasonOf = e => e.rejection_reason_bn || e.discard_reason_bn || e.reversal_reason_bn || '';
function yearSums(year) {
  const pub = store.ledger_entries.filter(e => e.entry_date.startsWith(year) && e.status === 'published');
  const pos = [...pub].filter(e => e.amount > 0).sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  const sum = k => pub.filter(e => e.kind === k).reduce((a, e) => a + e.amount, 0);
  return { income: sum('income'), donation: sum('donation'), expense: Math.abs(sum('expense')),
    net: pub.reduce((a, e) => a + e.amount, 0),
    preview4: pos.slice(0, 4).reduce((a, e) => a + e.amount, 0), fullPos: pos.reduce((a, e) => a + e.amount, 0), pub };
}
function nextEntryNo(dateStr) {
  const y = dateStr.slice(0, 4);
  const seq = store.ledger_entries.filter(e => e.entry_no.startsWith('LE-' + y + '-'))
    .reduce((m, e) => Math.max(m, parseInt(e.entry_no.slice(-4), 10) || 0), 0) + 1;
  return 'LE-' + y + '-' + String(seq).padStart(4, '0');
}
const head = (title, sub) => `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${esc(title)}</h1>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}</div></div>`;
const statusBadge = s => badge(s, t('finance.status.' + s));

// ---------- actions (shared by detail + pending) ----------
function doApprove(entry, ctx) {
  if (isSelf(entry, ctx.user) || !otherSAs(ctx.user).length) { ctx.toast(t('finance.act.blockedSelf')); return; }
  ctx.modal({ title: t('finance.act.approve'), body: `<p>${esc(t('finance.act.confirmApprove'))}</p><p class="small muted num">${esc(entry.entry_no)} · ${fmtBDT(entry.amount, L())}</p>`,
    confirmLabel: t('finance.act.approve'), requireReauth: true,
    onConfirm: () => {
      const old = entry.status;
      entry.status = 'published'; entry.approved_by = ctx.user.id; entry.approved_at = new Date().toISOString();
      let msg;
      if (entry.reverses) {
        const orig = entryByNo(entry.reverses);
        if (orig) { orig.status = 'reversed'; store.ledger_reversals.push({ id: 'rev-' + Date.now(), original_entry_no: orig.entry_no, reversal_entry_no: entry.entry_no, created_by: entry.entered_by, approved_by: ctx.user.id, approved_at: entry.approved_at }); }
        writeAudit(ctx.user.id, ctx.role, 'finance.reversal.publish', 'ledger_entry', entry.entry_no, old, 'published');
        msg = t('finance.act.reversalPublished');
      } else {
        writeAudit(ctx.user.id, ctx.role, 'finance.publish', 'ledger_entry', entry.entry_no, old, 'published');
        msg = t('finance.act.approved');
      }
      // Toast AFTER the re-render: the shell rebuilds #toasts on render, wiping any toast fired before it.
      ctx.rerender();
      setTimeout(() => ctx.toast(msg), 350);
    } });
}
function reasonModal(ctx, { title, body, confirmLabel, danger, onReason }) {
  let reason = '';
  ctx.modal({ title, body: `<p>${esc(body)}</p><div class="field"><label for="fin-reason">${esc(t('finance.act.reason'))} *</label><textarea id="fin-reason" class="input" rows="3"></textarea></div>`,
    confirmLabel, danger: !!danger, requireReauth: false,
    onConfirm: () => { if (!validateRequired(reason, 10)) { ctx.toast(t('finance.act.reasonShort')); return; } onReason(reason.trim()); } });
  const el = document.getElementById('fin-reason');
  if (el) el.addEventListener('input', () => { reason = el.value; });
}
function doReject(entry, ctx) {
  reasonModal(ctx, { title: t('finance.act.reject'), body: t('finance.act.confirmReject'), confirmLabel: t('finance.act.reject'), danger: true,
    onReason: r => { const old = entry.status; entry.status = 'rejected'; entry.rejection_reason_bn = r; writeAudit(ctx.user.id, ctx.role, 'finance.reject', 'ledger_entry', entry.entry_no, old, 'rejected'); ctx.rerender(); setTimeout(() => ctx.toast(t('finance.act.rejected')), 350); } });
}
function doDiscard(entry, ctx) {
  reasonModal(ctx, { title: t('finance.act.discard'), body: t('finance.act.confirmDiscard'), confirmLabel: t('finance.act.discard'), danger: true,
    onReason: r => { const old = entry.status; entry.status = 'discarded'; entry.discard_reason_bn = r; writeAudit(ctx.user.id, ctx.role, 'finance.discard', 'ledger_entry', entry.entry_no, old, 'discarded'); ctx.rerender(); setTimeout(() => ctx.toast(t('finance.act.discarded')), 350); } });
}
function actionButtons(entry, ctx) {
  // Draft: edit / approve (or blocked explanation) / reject / discard. Published: reverse only. Others: none.
  if (entry.status === 'draft') {
    const self = isSelf(entry, ctx.user);
    const noSecond = !otherSAs(ctx.user).length;
    const approve = (self || noSecond)
      ? `<button type="button" class="btn btn-primary" disabled aria-describedby="self-block-note">${esc(t('finance.act.approve'))}</button>`
      : `<button type="button" class="btn btn-primary" data-fin="approve" data-no="${esc(entry.entry_no)}">${esc(t('finance.act.approve'))}</button>`;
    return `<div class="row mt-4">${approve}
      <button type="button" class="btn btn-secondary" data-fin="reject" data-no="${esc(entry.entry_no)}">${esc(t('finance.act.reject'))}</button>
      <button type="button" class="btn btn-secondary" data-fin="discard" data-no="${esc(entry.entry_no)}">${esc(t('finance.act.discard'))}</button>
      <a class="btn btn-secondary" href="#/finance/${esc(entry.entry_no)}/edit">${esc(t('finance.act.edit'))}</a></div>
      ${(self || noSecond) ? `<p class="small mt-4" id="self-block-note" role="note">${esc(self ? t('finance.pending.selfBlock') : t('finance.pending.noSecond'))}</p>` : ''}`;
  }
  if (entry.status === 'published' && !entry.reverses) {
    const rev = reversalOf(entry.entry_no);
    if (rev) return `<p class="small mt-4" role="note">${esc(t('finance.detail.reversalExists'))} <a href="#/finance/${esc(rev.entry_no)}"><span class="num">${esc(rev.entry_no)}</span></a></p>`;
    return `<div class="row mt-4"><a class="btn btn-primary" href="#/finance/${esc(entry.entry_no)}/reverse">${esc(t('finance.act.reverse'))}</a></div>`;
  }
  if (entry.status === 'reversed') {
    const rev = reversalOf(entry.entry_no);
    if (rev) return `<p class="small mt-4" role="note">${esc(t('finance.detail.reversalExists'))} <a href="#/finance/${esc(rev.entry_no)}"><span class="num">${esc(rev.entry_no)}</span></a></p>`;
  }
  return '';
}

// ---------- sub-views ----------
function overviewHtml(ctx) {
  const lang = L();
  const year = ctx.query.year || '2026';
  const s = yearSums(year);
  const drafts = store.ledger_entries.filter(e => e.status === 'draft');
  const recent = [...s.pub].sort((a, b) => b.entry_date.localeCompare(a.entry_date)).slice(0, 5);
  // Money totals use compact card numerals, not the giant .stat numerals: a ৳৩,২০,০০০
  // Bengali figure at the .stat 4rem size overflows its cell and is clipped by .stat-grid.
  const stat = (href, num, label) => `<a class="card" style="text-decoration:none;color:inherit" href="${href}"><div class="num" style="font-size:32px;font-weight:800;line-height:1.2">${num}</div><div class="small muted">${label}</div></a>`;
  return head(t('finance.title.overview'), t('finance.overview.intro')) + `
  <div class="filters"><label class="small" for="fin-year">${esc(t('finance.overview.year'))}</label>
    <select class="input" id="fin-year" style="max-width:160px">${years().map(y => `<option value="${y}"${y === year ? ' selected' : ''}>${y}</option>`).join('')}</select></div>
  <div class="two-col">
    ${stat('#/finance/ledger?kind=income&year=' + year, fmtBDT(s.income, lang), t('finance.overview.income'))}
    ${stat('#/finance/ledger?kind=donation&year=' + year, fmtBDT(s.donation, lang), t('finance.overview.donation'))}
    ${stat('#/finance/ledger?kind=expense&year=' + year, fmtBDT(s.expense, lang), t('finance.overview.expense'))}
    ${stat('#/finance/ledger?year=' + year, fmtBDT(s.net, lang), t('finance.overview.net'))}
  </div>
  <div class="two-col mt-6">
    <section class="card"><h3>${esc(t('finance.overview.snapshot'))}</h3>
      <dl class="kv"><dt>${esc(t('finance.overview.preview4'))}</dt><dd class="num">${fmtBDT(s.preview4, lang)}</dd>
      <dt>${esc(t('finance.overview.fullYear'))}</dt><dd class="num">${fmtBDT(s.fullPos, lang)}</dd></dl>
      <p class="small muted mt-4">${esc(year)} · ${esc(t('app.demo'))}</p>
      <p class="mt-4"><a href="#/finance/ledger">${esc(t('finance.overview.gotoLedger'))}</a> · <a href="#/finance/reports">${esc(t('nav.reports'))}</a></p></section>
    <section class="card"><h3>${esc(t('finance.overview.pendingCard'))} (${fmtNum(drafts.length, lang)})</h3>
      ${drafts.length ? drafts.map(e => `<div class="list-row"><div class="grow"><strong class="num">${esc(e.entry_no)}</strong> — ${esc(itemOf(e, lang))}<br><span class="small muted num">${fmtBDT(e.amount, lang)} · ${esc(uname(e.entered_by, lang))}</span></div>${statusBadge(e.status)}</div>`).join('') : `<p class="muted">${esc(t('finance.overview.pendingNone'))}</p>`}
      <p class="mt-4"><a href="#/finance/pending">${esc(t('finance.overview.gotoPending'))}</a></p></section>
  </div>
  <section class="card"><h3>${esc(t('finance.overview.recent'))}</h3>
    ${recent.length ? renderTable({ columns: [
      { key: 'entry_no', label: t('finance.ledger.colNo'), render: r => `<span class="num">${esc(r.entry_no)}</span>` },
      { key: 'entry_date', label: t('finance.ledger.colDate'), render: r => fmtDate(r.entry_date, lang) },
      { key: 'item_bn', label: t('finance.ledger.colItem'), render: r => esc(itemOf(r, lang)) },
      { key: 'amount', label: t('finance.ledger.colAmount'), render: r => `<span class="num">${fmtBDT(r.amount, lang)}</span>` }
    ], rows: recent, page: 1, perPage: 5, onRowClick: r => '#/finance/' + r.entry_no, stacked: true }) : emptyState(t('common.empty'))}
  </section>
  <p class="small muted">${esc(t('finance.overview.publicNote'))}</p>
  <p class="mt-4"><a class="btn btn-primary" href="#/finance/new">${esc(t('finance.ledger.newEntry'))}</a></p>`;
}
function ledgerHtml(ctx) {
  const lang = L();
  const q = ctx.query.q || '', kind = ctx.query.kind || 'all', status = ctx.query.status || 'all', year = ctx.query.year || 'all';
  const sort = ctx.query.sort || 'date-desc', page = parseInt(ctx.query.page, 10) || 1;
  let rows = filterList(store.ledger_entries, { q, fields: ['entry_no', 'item_bn', 'item_en', 'payee_bn'] });
  if (kind !== 'all') rows = rows.filter(e => e.kind === kind);
  if (status !== 'all') rows = rows.filter(e => e.status === status);
  if (year !== 'all') rows = rows.filter(e => e.entry_date.startsWith(year));
  if (ctx.query.project) rows = rows.filter(e => e.project_id === ctx.query.project);
  const sorts = { 'date-desc': (a, b) => b.entry_date.localeCompare(a.entry_date), 'date-asc': (a, b) => a.entry_date.localeCompare(b.entry_date), 'amt-desc': (a, b) => b.amount - a.amount, 'amt-asc': (a, b) => a.amount - b.amount };
  rows.sort(sorts[sort] || sorts['date-desc']);
  const chips = [{ value: 'all', label: t('finance.ledger.kindAll') }, 'income', 'expense', 'donation'].map(v => typeof v === 'string' ? { value: v, label: t('finance.kind.' + v) } : v);
  const opt = (v, cur, label) => `<option value="${v}"${v === cur ? ' selected' : ''}>${esc(label)}</option>`;
  return head(t('finance.title.ledger'), t('finance.ledger.intro')) + `
  <p class="mt-4"><a class="btn btn-primary" href="#/finance/new">${esc(t('finance.ledger.newEntry'))}</a></p>
  ${ctx.query.project ? `<p class="small muted" role="note">${esc(t('finance.ledger.projectFilter'))}: ${esc(projName(ctx.query.project, lang) || '')}</p>` : ''}
  ${renderFilters({ q, chips, activeChip: kind })}
  <div class="filters">
    <label class="small" for="fin-year-f">${esc(t('finance.overview.year'))}</label>
    <select class="input" id="fin-year-f" style="max-width:160px" data-fin-select="year"><option value="all">${esc(t('finance.ledger.yearAll'))}</option>${years().map(y => opt(y, year, y)).join('')}</select>
    <label class="small" for="fin-status-f">${esc(t('finance.ledger.colStatus'))}</label>
    <select class="input" id="fin-status-f" style="max-width:180px" data-fin-select="status">${opt('all', status, t('finance.ledger.statusAll'))}${['draft', 'published', 'rejected', 'discarded', 'reversed'].map(s2 => opt(s2, status, t('finance.status.' + s2))).join('')}</select>
    <label class="small" for="fin-sort-f">${esc(t('finance.ledger.sort'))}</label>
    <select class="input" id="fin-sort-f" style="max-width:200px" data-fin-select="sort">${opt('date-desc', sort, t('finance.ledger.sortDateDesc'))}${opt('date-asc', sort, t('finance.ledger.sortDateAsc'))}${opt('amt-desc', sort, t('finance.ledger.sortAmtDesc'))}${opt('amt-asc', sort, t('finance.ledger.sortAmtAsc'))}</select>
  </div>
  ${renderTable({ columns: [
    { key: 'entry_no', label: t('finance.ledger.colNo'), render: r => `<span class="num">${esc(r.entry_no)}</span>` },
    { key: 'entry_date', label: t('finance.ledger.colDate'), render: r => fmtDate(r.entry_date, lang) },
    { key: 'item_bn', label: t('finance.ledger.colItem'), render: r => esc(itemOf(r, lang)) },
    { key: 'kind', label: t('finance.ledger.colKind'), render: r => plainBadge(t('finance.kind.' + r.kind)) },
    { key: 'category', label: t('finance.ledger.colCategory'), render: r => esc(catName(r.category, lang)) },
    { key: 'amount', label: t('finance.ledger.colAmount'), render: r => `<span class="num">${fmtBDT(r.amount, lang)}</span>` },
    { key: 'status', label: t('finance.ledger.colStatus'), render: r => statusBadge(r.status) },
    { key: 'entered_by', label: t('finance.ledger.colEntered'), render: r => esc(uname(r.entered_by, lang)) }
  ], rows, page, perPage: 20, onRowClick: r => '#/finance/' + r.entry_no, stacked: true })}`;
}
function pendingHtml(ctx) {
  const lang = L();
  const drafts = store.ledger_entries.filter(e => e.status === 'draft').sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  const noSecond = !otherSAs(ctx.user).length;
  return head(t('finance.title.pending'), t('finance.pending.intro')) + `
  ${noSecond ? `<div class="card" role="alert"><strong>${esc(t('finance.pending.noSecond'))}</strong></div>` : `<p class="small muted">${esc(t('finance.pending.secondApprover'))}: ${otherSAs(ctx.user).map(u => esc(uname(u.id, lang))).join(', ')}</p>`}
  ${drafts.length ? `<div class="card">${drafts.map(e => {
    const self = isSelf(e, ctx.user);
    return `<div class="list-row"><div class="grow"><strong class="num">${esc(e.entry_no)}</strong> — ${esc(itemOf(e, lang))}<br>
      <span class="small muted num">${fmtBDT(e.amount, lang)} · ${fmtDate(e.entry_date, lang)} · ${esc(uname(e.entered_by, lang))}</span>
      ${e.reverses ? `<br><span class="small muted">${esc(t('finance.detail.reversalOf'))}: <a href="#/finance/${esc(e.reverses)}"><span class="num">${esc(e.reverses)}</span></a></span>` : ''}
      ${self ? `<br><span class="small" role="note">${esc(t('finance.pending.selfBlock'))}</span>` : ''}</div>
      <div class="row">${self || noSecond
        ? `<button type="button" class="btn btn-primary btn-sm" disabled>${esc(t('finance.act.approve'))}</button>`
        : `<button type="button" class="btn btn-primary btn-sm" data-fin="approve" data-no="${esc(e.entry_no)}">${esc(t('finance.act.approve'))}</button>`}
      <button type="button" class="btn btn-secondary btn-sm" data-fin="reject" data-no="${esc(e.entry_no)}">${esc(t('finance.act.reject'))}</button>
      <a class="btn btn-secondary btn-sm" href="#/finance/${esc(e.entry_no)}">${esc(t('finance.act.view'))}</a></div></div>`;
  }).join('')}</div>` : emptyState(t('finance.pending.empty'), t('finance.ledger.newEntry'), '#/finance/new')}`;
}
function detailHtml(ctx) {
  const lang = L();
  const e = entryByNo(ctx.params.entryNo);
  if (!e) return notFoundHtml();
  const rev = e.status === 'reversed' ? reversalOf(e.entry_no) : null;
  const orig = e.reverses ? entryByNo(e.reverses) : null;
  const note = { published: t('finance.detail.immutable'), reversed: t('finance.detail.immutableReversed'), discarded: t('finance.detail.immutableDiscarded'), rejected: t('finance.detail.immutableRejected'), draft: t('finance.detail.draftNote') }[e.status];
  return head(t('finance.title.detail') + ' — ' + e.entry_no, '') + `
  <div class="detail-grid"><section class="card"><h3><span class="num">${esc(e.entry_no)}</span> ${statusBadge(e.status)}</h3>
    <dl class="kv mt-4">
      <dt>${esc(t('finance.detail.item'))}</dt><dd>${esc(itemOf(e, lang))}</dd>
      <dt>${esc(t('finance.detail.amount'))}</dt><dd class="num">${fmtBDT(e.amount, lang)}</dd>
      <dt>${esc(t('finance.detail.date'))}</dt><dd>${fmtDate(e.entry_date, lang)}</dd>
      <dt>${esc(t('finance.detail.category'))}</dt><dd>${esc(catName(e.category, lang))} · ${esc(t('finance.kind.' + e.kind))}</dd>
      <dt>${esc(t('finance.detail.project'))}</dt><dd>${esc(projName(e.project_id, lang) || t('finance.detail.none'))}</dd>
      <dt>${esc(t('finance.detail.payee'))}</dt><dd>${esc(payeeOf(e, lang))}</dd>
      <dt>${esc(t('finance.detail.voucher'))}</dt><dd>${esc(e.voucher || t('finance.detail.none'))}</dd>
      <dt>${esc(t('finance.detail.enteredBy'))}</dt><dd>${esc(uname(e.entered_by, lang))}</dd>
      <dt>${esc(t('finance.detail.approvedBy'))}</dt><dd>${esc(e.approved_by ? uname(e.approved_by, lang) : t('finance.detail.none'))}</dd>
      <dt>${esc(t('finance.detail.approvedAt'))}</dt><dd>${e.approved_at ? fmtDateTime(e.approved_at, lang) : t('finance.detail.none')}</dd>
    </dl>
    ${reasonOf(e) ? `<p class="small mt-4"><strong>${esc(t('finance.act.reason'))}:</strong> ${esc(reasonOf(e))}</p>` : ''}
    ${orig ? `<p class="small mt-4">${esc(t('finance.detail.reversalOf'))}: <a href="#/finance/${esc(orig.entry_no)}"><span class="num">${esc(orig.entry_no)}</span></a></p>` : ''}
    ${rev ? `<p class="small mt-4">${esc(t('finance.detail.reversedBy'))}: <a href="#/finance/${esc(rev.entry_no)}"><span class="num">${esc(rev.entry_no)}</span></a></p>` : ''}
    ${actionButtons(e, ctx)}
  </section>
  <aside class="card"><h3>${esc(t('finance.detail.item'))}</h3><p class="small" role="note">${esc(note)}</p>
    <p class="small muted mt-4">${esc(t('finance.overview.publicNote'))}</p>
    <p class="mt-4"><a href="#/finance/ledger">${esc(t('finance.overview.gotoLedger'))}</a></p></aside></div>`;
}
function entryFormHtml(ctx, e, isReverse) {
  const lang = L();
  const orig = isReverse ? entryByNo(ctx.params.entryNo) : null;
  const editing = !!e && !isReverse;
  const locked = isReverse || !!(e && e.reverses); // a reversal draft's kind/category/project/amount are derived from its original
  // D6: a reversal form pre-fills item + payee (and kind/category/project) from the
  // original entry and shows them read-only — the user never retypes what already
  // exists. Read-only (not disabled) so the values still submit with the form.
  const vals = (isReverse && orig)
    ? { item_bn: orig.item_bn, item_en: orig.item_en || '', kind: orig.kind, category: orig.category, project_id: orig.project_id || '', entry_date: new Date().toISOString().slice(0, 10), amount: '', payee_bn: orig.payee_bn, voucher: '' }
    : (e || { item_bn: '', item_en: '', kind: 'expense', category: 'fc-3', project_id: '', entry_date: new Date().toISOString().slice(0, 10), amount: '', payee_bn: '', voucher: '' });
  const amountVal = e ? Math.abs(e.amount) : '';
  const catOpts = store.finance_categories.filter(c => c.active).map(c => `<option value="${c.id}"${c.id === vals.category ? ' selected' : ''}>${esc(lang === 'bn' ? c.name_bn : c.name_en)} — ${esc(t('finance.kind.' + c.kind))}</option>`).join('');
  const projOpts = `<option value="">${esc(t('finance.form.projectNone'))}</option>` + store.projects.map(p => `<option value="${p.id}"${p.id === vals.project_id ? ' selected' : ''}>${esc(lang === 'bn' ? p.name_bn : p.name_en)}</option>`).join('');
  return head(t(isReverse ? 'finance.title.reverse' : editing ? 'finance.title.edit' : 'finance.title.new'),
    isReverse ? t('finance.reverse.intro') : editing ? t('finance.detail.draftNote') : '') + `
  ${isReverse && orig ? `<section class="card"><h3>${esc(t('finance.reverse.original'))}: <span class="num">${esc(orig.entry_no)}</span></h3>
    <p>${esc(itemOf(orig, lang))} · <span class="num">${fmtBDT(orig.amount, lang)}</span> · ${fmtDate(orig.entry_date, lang)}</p>
    <p class="small muted">${esc(t('finance.reverse.amountAuto'))}: <span class="num">${fmtBDT(-orig.amount, lang)}</span></p></section>` : ''}
  <form id="fin-form" novalidate><div id="fin-errors"></div>
    ${field({ id: 'f-item-bn', label: t('finance.form.itemBn'), value: vals.item_bn, required: true, attrs: isReverse ? 'readonly' : '', hint: isReverse ? t('finance.reverse.prefilled') : '' })}
    ${field({ id: 'f-item-en', label: t('finance.form.itemEn'), value: vals.item_en || '', attrs: isReverse ? 'readonly' : '' })}
    <div class="field"><label for="f-kind">${esc(t('finance.form.kind'))} *</label>
      <select id="f-kind" class="input" ${locked ? 'disabled' : ''}>${['income', 'expense', 'donation'].map(k => `<option value="${k}"${k === vals.kind ? ' selected' : ''}>${esc(t('finance.kind.' + k))}</option>`).join('')}</select></div>
    <div class="field"><label for="f-category">${esc(t('finance.form.category'))} *</label>
      <select id="f-category" class="input" ${locked ? 'disabled' : ''}>${catOpts}</select></div>
    <div class="field"><label for="f-project">${esc(t('finance.form.project'))}</label>
      <select id="f-project" class="input" ${locked ? 'disabled' : ''}>${projOpts}</select></div>
    ${field({ id: 'f-date', label: t('finance.form.date'), type: 'date', value: vals.entry_date, required: true })}
    ${isReverse
      ? `<p><strong>${esc(t('finance.reverse.amountAuto'))}:</strong> <span class="num">${fmtBDT(-orig.amount, lang)}</span></p>`
      : (e && e.reverses
        ? `<p><strong>${esc(t('finance.detail.amount'))}:</strong> <span class="num">${fmtBDT(e.amount, lang)}</span></p>`
        : field({ id: 'f-amount', label: t('finance.form.amount'), type: 'number', value: String(amountVal), required: true, attrs: 'min="1" step="0.01" inputmode="decimal"', hint: t('finance.form.amountHint') }))}
    ${field({ id: 'f-payee', label: t('finance.form.payee'), value: vals.payee_bn, required: true, attrs: isReverse ? 'readonly' : '', hint: isReverse ? t('finance.reverse.prefilled') : '' })}
    ${isReverse ? field({ id: 'f-reason', label: t('finance.reverse.reason'), value: '', required: true }) : ''}
    <div class="field"><label for="f-voucher">${esc(t('finance.form.voucherFile'))}</label>
      <input id="f-voucher" type="file" class="input" accept="image/*,.pdf">
      <div class="hint">${esc(t('finance.form.voucherHint'))}</div>
      <div id="f-voucher-preview" class="mt-4 small muted">${vals.voucher ? esc(t('finance.form.voucherChosen')) + ': ' + esc(vals.voucher) : ''}</div></div>
    <div class="field"><label>${esc(t('finance.form.enteredBy'))}</label><div>${esc(uname(ctx.user.id, lang))}</div></div>
    <div class="row"><button type="submit" class="btn btn-primary">${esc(t(editing ? 'finance.form.saveChanges' : 'finance.form.saveDraft'))}</button>
    <a class="btn btn-secondary" href="#/finance/${isReverse || editing ? esc(ctx.params.entryNo) : 'ledger'}">${esc(t('common.back'))}</a></div>
  </form>`;
}
function saveEntry(ctx, e, isReverse) {
  const lang = L();
  const g = id => (document.getElementById(id) || {}).value || '';
  const errs = [];
  const itemBn = g('f-item-bn').trim(), payee = g('f-payee').trim(), date = g('f-date'), cat = g('f-category');
  if (!validateRequired(itemBn, 2)) errs.push({ id: 'f-item-bn', message: t('finance.form.errItem') });
  if (!validateRequired(date, 1)) errs.push({ id: 'f-date', message: t('finance.form.errDate') });
  if (!validateRequired(cat, 1)) errs.push({ id: 'f-category', message: t('finance.form.errCategory') });
  if (!validateRequired(payee, 2)) errs.push({ id: 'f-payee', message: t('finance.form.errPayee') });
  let amount = 0;
  if (!isReverse && !(e && e.reverses)) { amount = parseFloat(g('f-amount')); if (!(amount > 0)) errs.push({ id: 'f-amount', message: t('finance.form.errAmount') }); }
  let reason = '';
  if (isReverse) { reason = g('f-reason').trim(); if (!validateRequired(reason, 10)) errs.push({ id: 'f-reason', message: t('finance.act.reasonShort') }); }
  const errBox = document.getElementById('fin-errors');
  if (errs.length) { if (errBox) { errBox.innerHTML = errorSummary(errs); errBox.querySelector('.error-summary').focus(); } return; }
  const orig = isReverse ? entryByNo(ctx.params.entryNo) : null;
  const kind = isReverse ? orig.kind : g('f-kind');
  const signed = isReverse ? -orig.amount : (kind === 'expense' ? -Math.abs(amount) : Math.abs(amount));
  const voucherFile = document.getElementById('f-voucher');
  const voucherName = voucherFile && voucherFile.files && voucherFile.files[0] ? voucherFile.files[0].name : (e ? e.voucher : '');
  if (e && !isReverse) {
    e.item_bn = itemBn; e.item_en = g('f-item-en').trim(); e.kind = e.reverses ? e.kind : kind; e.category = e.reverses ? e.category : cat;
    e.project_id = e.reverses ? e.project_id : (g('f-project') || null); e.entry_date = date; e.amount = e.reverses ? e.amount : signed; e.payee_bn = payee; e.voucher = voucherName;
    writeAudit(ctx.user.id, ctx.role, 'finance.edit', 'ledger_entry', e.entry_no, 'draft', 'draft');
    location.hash = '#/finance/' + e.entry_no; setTimeout(() => ctx.toast(t('finance.form.updated')), 350); return;
  }
  const no = nextEntryNo(date);
  const entry = { entry_no: no, entry_date: date, kind, category: isReverse ? orig.category : cat, project_id: isReverse ? orig.project_id : (g('f-project') || null),
    item_bn: isReverse ? (itemBn || orig.item_bn) : itemBn, item_en: isReverse ? (g('f-item-en').trim() || orig.item_en) : g('f-item-en').trim(),
    amount: signed, payee_bn: payee || (orig ? orig.payee_bn : ''), voucher: voucherName || ('ভাউচার ' + no),
    status: 'draft', entered_by: ctx.user.id, approved_by: null, approved_at: null };
  if (isReverse) { entry.reverses = orig.entry_no; entry.reversal_reason_bn = reason; }
  store.ledger_entries.push(entry);
  writeAudit(ctx.user.id, ctx.role, isReverse ? 'finance.reversal.create' : 'finance.create', 'ledger_entry', no, null, 'draft');
  const msg = t(isReverse ? 'finance.act.reversalCreated' : 'finance.act.created');
  location.hash = '#/finance/pending'; setTimeout(() => ctx.toast(msg), 350);
}

// ---------- export ----------
export const Finance = {
  route: '#/finance',
  title: { bn: STRINGS.bn['title.overview'], en: STRINGS.en['title.overview'] },
  breadcrumb: ['nav.dashboard', 'nav.financeOverview'],
  roles: ['super-admin'],
  permissions: ['finance.view'],
  render(ctx) {
    const p = ctx.path, no = ctx.params.entryNo;
    if (p === '/finance') { this.title = { bn: STRINGS.bn['title.overview'], en: STRINGS.en['title.overview'] }; this.breadcrumb = ['nav.dashboard', 'nav.financeOverview']; return overviewHtml(ctx); }
    if (p === '/finance/ledger') { this.title = { bn: STRINGS.bn['title.ledger'], en: STRINGS.en['title.ledger'] }; this.breadcrumb = ['nav.dashboard', 'nav.ledger']; return ledgerHtml(ctx); }
    if (p === '/finance/new') { this.title = { bn: STRINGS.bn['title.new'], en: STRINGS.en['title.new'] }; this.breadcrumb = ['nav.dashboard', 'nav.ledger', 'finance.crumb.new']; return entryFormHtml(ctx, null, false); }
    if (p === '/finance/pending') { this.title = { bn: STRINGS.bn['title.pending'], en: STRINGS.en['title.pending'] }; this.breadcrumb = ['nav.dashboard', 'nav.pendingFinance']; return pendingHtml(ctx); }
    if (no && p.endsWith('/edit')) {
      const e = entryByNo(no);
      if (!e) return notFoundHtml();
      if (e.status !== 'draft') return detailHtml(ctx); // only drafts editable; anything else shows detail
      this.title = { bn: STRINGS.bn['title.edit'], en: STRINGS.en['title.edit'] }; this.breadcrumb = ['nav.dashboard', 'nav.ledger', 'finance.crumb.edit']; return entryFormHtml(ctx, e, false);
    }
    if (no && p.endsWith('/reverse')) {
      const e = entryByNo(no);
      if (!e) return notFoundHtml();
      if (e.status !== 'published' || e.reverses || reversalOf(no)) return detailHtml(ctx); // second reversal / non-published blocked
      this.title = { bn: STRINGS.bn['title.reverse'], en: STRINGS.en['title.reverse'] }; this.breadcrumb = ['nav.dashboard', 'nav.ledger', 'finance.crumb.reverse']; return entryFormHtml(ctx, null, true);
    }
    this.title = { bn: STRINGS.bn['title.detail'], en: STRINGS.en['title.detail'] }; this.breadcrumb = ['nav.dashboard', 'nav.ledger', 'finance.crumb.detail']; return detailHtml(ctx);
  },
  onMount(ctx) {
    const root = document.getElementById('view');
    bindTableRows(root);
    const p = ctx.path;
    if (p === '/finance') {
      const y = document.getElementById('fin-year');
      if (y) y.addEventListener('change', () => { location.hash = '#/finance?year=' + y.value; });
      return;
    }
    if (p === '/finance/ledger') {
      const go = patch => { const q = { ...ctx.query, ...patch }; const s = Object.entries(q).filter(([, v]) => v && v !== 'all').map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&'); location.hash = '#/finance/ledger' + (s ? '?' + s : ''); };
      bindFilters(root, { onSearch: v => go({ q: v, page: 1 }), onChip: v => go({ kind: v, page: 1 }), onClear: () => { location.hash = '#/finance/ledger'; } });
      root.querySelectorAll('[data-fin-select]').forEach(sel => sel.addEventListener('change', () => go({ [sel.dataset.finSelect]: sel.value, page: 1 })));
      return;
    }
    if (p === '/finance/pending' || (ctx.params.entryNo && !p.endsWith('/edit') && !p.endsWith('/reverse'))) {
      root.querySelectorAll('[data-fin]').forEach(b => b.addEventListener('click', () => {
        const e = entryByNo(b.dataset.no); if (!e) return;
        if (b.dataset.fin === 'approve') doApprove(e, ctx);
        if (b.dataset.fin === 'reject') doReject(e, ctx);
        if (b.dataset.fin === 'discard') doDiscard(e, ctx);
      }));
      return;
    }
    if (p === '/finance/new' || p.endsWith('/edit') || p.endsWith('/reverse')) {
      const form = document.getElementById('fin-form');
      const file = document.getElementById('f-voucher');
      if (file) file.addEventListener('change', () => {
        const f = file.files && file.files[0]; const prev = document.getElementById('f-voucher-preview');
        if (!f || !prev) return;
        prev.textContent = t('finance.form.voucherChosen') + ': ' + f.name;
        if (f.type.startsWith('image/')) { const r = new FileReader(); r.onload = () => { const img = document.createElement('img'); img.src = r.result; img.alt = f.name; img.style.maxWidth = '240px'; img.style.marginTop = '8px'; prev.appendChild(img); }; r.readAsDataURL(f); }
      });
      if (form) form.addEventListener('submit', ev => {
        ev.preventDefault();
        const isRev = p.endsWith('/reverse');
        const e = p.endsWith('/edit') ? entryByNo(ctx.params.entryNo) : null;
        saveEntry(ctx, e, isRev);
      });
    }
  },
  onUnmount() {}
};
