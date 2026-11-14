// Expatriate Requests — queue (#/expatriate) + request detail (#/expatriate/:requestNo).
// Journey G. State machine: pending → accepted → in_progress → completed → closed;
// exits rejected (reason required, Super Admin only) / cancelled (Super Admin only).
// Helper: claim unassigned pending; advance only assigned requests; never reject/close.
// Completion needs ≥1 expense line OR a no-expense declaration. Closure needs applicant
// confirmation. Applicant info: Super Admin always; Helper only when assigned.
// No service-charge field anywhere. 999 disclaimer is provided by the shell — not duplicated.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store, writeAudit } from '../js/lib/store.js';
import { fmtBDT, fmtDate, fmtDateTime, fmtPhoneMasked, fmtPhoneFull, esc } from '../js/lib/format.js';
import { badge, plainBadge } from '../js/components/badges.js';
import { renderTable, bindTableRows } from '../js/components/table.js';
import { meridianTimeline } from '../js/components/timeline.js';
import { emptyState } from '../js/components/states.js';
import { notFoundHtml } from '../js/lib/guards.js';

const STRINGS = {
  bn: {
    'list.title': 'প্রবাসী অনুরোধ', 'list.sub': 'প্রবাসী সহায়তার অনুরোধের সারি — অবস্থা, সেবা ও জরুরি ভিত্তিতে ফিল্টার করুন।',
    'list.ertLink': 'জরুরি দল দেখুন', 'list.servicesLink': 'সেবার তালিকা দেখুন',
    'list.kpiPending': 'অপেক্ষমাণ', 'list.kpiActive': 'সক্রিয়', 'list.kpiUrgent': 'জরুরি', 'list.kpiStale': '৭২ ঘণ্টার বেশি পুরনো',
    'list.searchPh': 'অনুরোধ নম্বর বা আবেদনকারীর নাম লিখুন…', 'list.allStatuses': 'সব অবস্থা', 'list.allServices': 'সব সেবা',
    'list.allUrgency': 'সব জরুরি মাত্রা', 'list.allAssigned': 'সব দায়িত্ব', 'list.assignedOnly': 'আমাকে দেওয়া', 'list.unassignedOnly': 'দায়িত্বহীন',
    'list.clear': 'ফিল্টার মুছুন', 'list.colRequest': 'অনুরোধ', 'list.colService': 'সেবা', 'list.colApplicant': 'আবেদনকারী',
    'list.colStatus': 'অবস্থা', 'list.colUrgency': 'জরুরি মাত্রা', 'list.colAssigned': 'দায়িত্বপ্রাপ্ত', 'list.colUpdated': 'সর্বশেষ হালনাগাদ',
    'list.urgent': 'জরুরি', 'list.normal': 'সাধারণ', 'list.emergency': 'জরুরি ঘটনা', 'list.stale': '৭২ ঘণ্টার বেশি হালনাগাদ নেই',
    'list.unassigned': 'দায়িত্ব দেওয়া হয়নি', 'list.empty': 'এই ফিল্টারে কোনো অনুরোধ নেই।',
    'detail.notFound': 'অনুরোধটি পাওয়া যায়নি।', 'detail.back': 'সারিতে ফিরুন',
    'detail.service': 'সেবার বিবরণ', 'detail.forWhom': 'কার জন্য', 'detail.details': 'বিবরণ', 'detail.neededBy': 'প্রয়োজন',
    'detail.country': 'আবেদনকারীর দেশ', 'detail.created': 'তৈরি', 'detail.urgency': 'জরুরি মাত্রা',
    'detail.progress': 'অগ্রগতি', 'detail.history': 'অবস্থার ইতিহাস', 'detail.noHistory': 'এখনো কোনো ইতিহাস নেই।',
    'detail.notes': 'নোট ও অগ্রগতির ছবি', 'detail.notePh': 'অগ্রগতির নোট লিখুন (কমপক্ষে ১০ অক্ষর)…',
    'detail.addNote': 'নোট যোগ করুন', 'detail.noteShort': 'নোট কমপক্ষে ১০ অক্ষরের হতে হবে।',
    'detail.noteAdded': 'নোট যোগ হয়েছে।', 'detail.photos': 'অগ্রগতির ছবি', 'detail.noPhotos': 'ডেমো তথ্যে কোনো ছবি নেই।',
    'detail.photoCaptionPh': 'ছবির বিবরণ লিখুন…', 'detail.addPhoto': 'ছবির বিবরণ যোগ করুন', 'detail.photoAdded': 'ছবির বিবরণ যোগ হয়েছে।',
    'detail.expenses': 'খরচের হিসাব', 'detail.expenseItem': 'খরচের বিবরণ', 'detail.expenseKind': 'ধরন',
    'detail.kindProduct': 'পণ্য', 'detail.kindTransport': 'যাতায়াত', 'detail.kindOther': 'অন্যান্য',
    'detail.expenseAmount': 'পরিমাণ (টাকা)', 'detail.expenseVoucher': 'ভাউচার', 'detail.voucherPh': 'ভাউচারের বিবরণ (ডেমো)',
    'detail.addExpense': 'খরচ যোগ করুন', 'detail.expenseAdded': 'খরচ যোগ হয়েছে।', 'detail.expenseTotal': 'মোট খরচ',
    'detail.noExpenses': 'এখনো কোনো খরচ লেখা হয়নি।', 'detail.noExpenseDecl': 'কোনো খরচ হয়নি — ঘোষণা দেওয়া আছে।',
    'detail.noExpenseCheck': 'কোনো খরচ হয়নি বলে ঘোষণা করছি', 'detail.confirmCheck': 'আবেদনকারী সম্পন্ন হওয়া নিশ্চিত করেছেন',
    'detail.applicant': 'আবেদনকারীর তথ্য', 'detail.applicantHidden': 'আবেদনকারীর তথ্য শুধু সুপার অ্যাডমিন দেখতে পারেন — সহায়ক শুধু নিজের দায়িত্বের অনুরোধের তথ্য দেখেন।',
    'detail.phone': 'মোবাইল', 'detail.assignment': 'দায়িত্ব', 'detail.primary': 'প্রধান সহায়ক', 'detail.backup': 'ব্যাকআপ সহায়ক',
    'detail.none': 'নেই', 'detail.assign': 'দায়িত্ব দিন', 'detail.assignPh': 'সহায়কের নাম খুঁজুন…',
    'detail.assigned': 'দায়িত্ব দেওয়া হয়েছে।', 'detail.claim': 'এই অনুরোধটি নিন', 'detail.claimed': 'অনুরোধটি আপনার দায়িত্বে নেওয়া হয়েছে।',
    'detail.actions': 'অবস্থা পরিবর্তন', 'detail.newStatus': 'নতুন অবস্থা', 'detail.noteLabel': 'নোট (কমপক্ষে ১০ অক্ষর, আবশ্যক)',
    'detail.apply': 'প্রয়োগ করুন', 'detail.illegal': 'এই অবস্থা পরিবর্তন বৈধ নয়।', 'detail.changed': 'অবস্থা পরিবর্তন হয়েছে।',
    'detail.readOnly': 'এই অনুরোধটি আপনার দায়িত্বে নয় — শুধু দেখা যাবে, পরিবর্তন করা যাবে না।',
    'detail.rejectHint': 'প্রত্যাখ্যান শুধু সুপার অ্যাডমিন করতে পারেন।', 'detail.closeHint': 'বন্ধ করতে আবেদনকারীর নিশ্চয়তা আবশ্যক।',
    'detail.completeHint': 'সম্পন্ন করতে কমপক্ষে একটি খরচের লাইন অথবা “কোনো খরচ হয়নি” ঘোষণা আবশ্যক।',
    'detail.tracking': 'আবেদনকারীর ট্র্যাকিং প্রাকদর্শন', 'detail.trackingNote': 'সর্বজনীন ট্র্যাকিংয়ে শুধু অনুরোধ নম্বর ও অবস্থা দেখানো হয় (স্তর-S)। নাম, নোট ও ছবি দেখানো হয় না।',
    'detail.confirmTitle': 'নিশ্চিত করুন', 'detail.confirmBody': 'অনুরোধের অবস্থা পরিবর্তন হবে। এই কাজটি লগে লেখা হবে।',
    'detail.expensesClosed': 'এই অনুরোধে আর খরচ যোগ করা যাবে না।'
  },
  en: {
    'list.title': 'Expatriate Requests', 'list.sub': 'Queue of expatriate support requests — filter by status, service and urgency.',
    'list.ertLink': 'View emergency team', 'list.servicesLink': 'View service catalogue',
    'list.kpiPending': 'Pending', 'list.kpiActive': 'Active', 'list.kpiUrgent': 'Urgent', 'list.kpiStale': 'Stale over 72 hours',
    'list.searchPh': 'Search by request number or applicant name…', 'list.allStatuses': 'All statuses', 'list.allServices': 'All services',
    'list.allUrgency': 'All urgency levels', 'list.allAssigned': 'All assignments', 'list.assignedOnly': 'Assigned to me', 'list.unassignedOnly': 'Unassigned',
    'list.clear': 'Clear filters', 'list.colRequest': 'Request', 'list.colService': 'Service', 'list.colApplicant': 'Applicant',
    'list.colStatus': 'Status', 'list.colUrgency': 'Urgency', 'list.colAssigned': 'Assigned to', 'list.colUpdated': 'Last updated',
    'list.urgent': 'Urgent', 'list.normal': 'Normal', 'list.emergency': 'Emergency', 'list.stale': 'No update for over 72 hours',
    'list.unassigned': 'Unassigned', 'list.empty': 'No requests match these filters.',
    'detail.notFound': 'Request not found.', 'detail.back': 'Back to queue',
    'detail.service': 'Service details', 'detail.forWhom': 'For whom', 'detail.details': 'Details', 'detail.neededBy': 'Needed by',
    'detail.country': 'Applicant country', 'detail.created': 'Created', 'detail.urgency': 'Urgency',
    'detail.progress': 'Progress', 'detail.history': 'Status history', 'detail.noHistory': 'No history yet.',
    'detail.notes': 'Notes and progress photos', 'detail.notePh': 'Write a progress note (at least 10 characters)…',
    'detail.addNote': 'Add note', 'detail.noteShort': 'A note must be at least 10 characters.',
    'detail.noteAdded': 'Note added.', 'detail.photos': 'Progress photos', 'detail.noPhotos': 'No photos in the demo data.',
    'detail.photoCaptionPh': 'Write a photo caption…', 'detail.addPhoto': 'Add photo caption', 'detail.photoAdded': 'Photo caption added.',
    'detail.expenses': 'Expense record', 'detail.expenseItem': 'Expense item', 'detail.expenseKind': 'Type',
    'detail.kindProduct': 'Product', 'detail.kindTransport': 'Transport', 'detail.kindOther': 'Other',
    'detail.expenseAmount': 'Amount (BDT)', 'detail.expenseVoucher': 'Voucher', 'detail.voucherPh': 'Voucher note (demo)',
    'detail.addExpense': 'Add expense', 'detail.expenseAdded': 'Expense added.', 'detail.expenseTotal': 'Total expenses',
    'detail.noExpenses': 'No expenses recorded yet.', 'detail.noExpenseDecl': 'No expense incurred — declaration recorded.',
    'detail.noExpenseCheck': 'I declare that no expense was incurred', 'detail.confirmCheck': 'The applicant has confirmed completion',
    'detail.applicant': 'Applicant information', 'detail.applicantHidden': 'Applicant information is visible to Super Admin only — a helper sees it only for requests assigned to them.',
    'detail.phone': 'Mobile', 'detail.assignment': 'Assignment', 'detail.primary': 'Primary helper', 'detail.backup': 'Backup helper',
    'detail.none': 'None', 'detail.assign': 'Assign', 'detail.assignPh': 'Search helper by name…',
    'detail.assigned': 'Assigned.', 'detail.claim': 'Claim this request', 'detail.claimed': 'Request claimed by you.',
    'detail.actions': 'Change status', 'detail.newStatus': 'New status', 'detail.noteLabel': 'Note (at least 10 characters, required)',
    'detail.apply': 'Apply', 'detail.illegal': 'This status change is not allowed.', 'detail.changed': 'Status changed.',
    'detail.readOnly': 'This request is not assigned to you — view only, no changes allowed.',
    'detail.rejectHint': 'Only a Super Admin can reject a request.', 'detail.closeHint': 'Closing needs the applicant’s confirmation.',
    'detail.completeHint': 'Completion needs at least one expense line or a “no expense incurred” declaration.',
    'detail.tracking': 'Applicant tracking preview', 'detail.trackingNote': 'Public tracking shows only the request number and status (Tier-S). Names, notes and photos are not shown.',
    'detail.confirmTitle': 'Confirm', 'detail.confirmBody': 'The request status will change. This action will be written to the log.',
    'detail.expensesClosed': 'No more expenses can be added to this request.'
  }
};
registerStrings('expatriate', STRINGS);

const STATUSES = ['pending', 'accepted', 'in_progress', 'completed', 'closed', 'rejected', 'cancelled'];
const NEXT = { pending: ['accepted', 'rejected', 'cancelled'], accepted: ['in_progress', 'rejected', 'cancelled'], in_progress: ['completed', 'cancelled'], completed: ['closed'], closed: [], rejected: [], cancelled: [] };
const STALE_MS = 72 * 3600 * 1000;
const isSA = ctx => ctx.role === 'super-admin';
const helpers = () => store.users.filter(u => u.role === 'expatriate-helper' && u.status === 'active');
const helperName = (id, lang) => { const u = store.users.find(x => x.id === id); return u ? (lang === 'bn' ? u.name_bn : u.name_en) : null; };
const isStale = r => r.status === 'in_progress' && (Date.now() - new Date(r.last_update_at || r.created_at).getTime()) > STALE_MS;
const isAssignedTo = (ctx, r) => ctx.user && (r.assigned_helper_id === ctx.user.id || r.backup_helper_id === ctx.user.id);
const canEdit = (ctx, r) => isSA(ctx) || (ctx.role === 'expatriate-helper' && isAssignedTo(ctx, r));
const expensesFor = no => store.service_request_expenses.filter(e => e.request_no === no);
const updatesFor = no => store.service_request_updates.filter(u => u.request_no === no).sort((a, b) => b.created_at.localeCompare(a.created_at));
const canSeeApplicant = (ctx, r) => isSA(ctx) || isAssignedTo(ctx, r);

function transitionError(ctx, r, to, note, noExpense, confirmed) {
  const tt = k => ctx.t('expatriate.' + k);
  if (!(NEXT[r.status] || []).includes(to)) return tt('detail.illegal');
  if ((to === 'rejected' || to === 'cancelled' || to === 'closed') && !isSA(ctx)) return tt('detail.illegal');
  if (String(note || '').trim().length < 10) return tt('detail.noteShort');
  if (to === 'completed' && expensesFor(r.request_no).length === 0 && !r.no_expense_declaration && !noExpense) return tt('detail.completeHint');
  if (to === 'closed' && !confirmed && !r.closed_by_applicant) return tt('detail.closeHint');
  return null;
}
function doTransition(ctx, r, to, note, noExpense, confirmed) {
  const err = transitionError(ctx, r, to, note, noExpense, confirmed);
  if (err) { ctx.toast(err); return false; }
  const from = r.status;
  r.status = to;
  if (to === 'completed' && noExpense) r.no_expense_declaration = true;
  if (to === 'closed') r.closed_by_applicant = true;
  if (to === 'rejected') r.rejection_reason_bn = note;
  if (to === 'cancelled') r.cancellation_reason_bn = note;
  r.last_update_at = new Date().toISOString();
  store.service_request_updates.unshift({ id: 'upd-demo-' + Date.now(), request_no: r.request_no, author_id: ctx.user.id, status_from: from, status_to: to, note_bn: note, created_at: r.last_update_at });
  writeAudit(ctx.user.id, ctx.role, 'expatriate.transition', 'service_request', r.request_no, from, to);
  // NOTE: no toast here — the caller rerenders first, then toasts. The shell
  // rebuilds #toasts on rerender, so a toast shown before rerender is wiped.
  return true;
}

export const Expatriate = {
  route: '#/expatriate',
  title: { bn: 'প্রবাসী অনুরোধ', en: 'Expatriate Requests' },
  breadcrumb: ['nav.dashboard', 'nav.expatriate'],
  roles: ['super-admin', 'expatriate-helper'],
  permissions: ['expatriate.requests.view'],
  render(ctx) {
    return ctx.params && ctx.params.requestNo ? detailHtml(ctx) : queueHtml(ctx);
  },
  onMount(ctx) {
    const root = document.getElementById('view');
    bindTableRows(root);
    root.querySelectorAll('[data-filter]').forEach(el => el.addEventListener('change', () => {
      const q = new URLSearchParams();
      root.querySelectorAll('[data-filter]').forEach(f => { if (f.value) q.set(f.dataset.filter, f.value); });
      const s = q.toString();
      location.hash = '#/expatriate' + (s ? '?' + s : '');
    }));
    const clear = root.querySelector('[data-clear]');
    if (clear) clear.addEventListener('click', () => { location.hash = '#/expatriate'; });
    root.querySelectorAll('form[data-form]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); handleForm(ctx, f); }));
    root.querySelectorAll('[data-action="claim"]').forEach(b => b.addEventListener('click', () => {
      const r = store.service_requests.find(x => x.request_no === b.dataset.request);
      if (!r || r.assigned_helper_id || r.status !== 'pending') return;
      r.assigned_helper_id = ctx.user.id; r.last_update_at = new Date().toISOString();
      writeAudit(ctx.user.id, ctx.role, 'expatriate.claim', 'service_request', r.request_no, null, ctx.user.id);
      ctx.rerender(); setTimeout(() => ctx.toast(ctx.t('expatriate.detail.claimed')), 350);
    }));
  },
  onUnmount() {}
};

function queueHtml(ctx) {
  const lang = getLang(), tt = k => ctx.t('expatriate.' + k);
  const q = (ctx.query.q || '').trim().toLowerCase();
  const fStatus = ctx.query.status || '', fService = ctx.query.service || '', fUrg = ctx.query.urgency || '', fAsg = ctx.query.assigned || '';
  let rows = [...store.service_requests].sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (q) rows = rows.filter(r => r.request_no.toLowerCase().includes(q) || r.applicant_name_bn.toLowerCase().includes(q));
  if (fStatus) rows = rows.filter(r => r.status === fStatus);
  if (fService) rows = rows.filter(r => r.service_key === fService);
  if (fUrg) rows = rows.filter(r => r.urgency === fUrg);
  if (fAsg === 'mine') rows = rows.filter(r => r.assigned_helper_id === ctx.user.id || r.backup_helper_id === ctx.user.id);
  if (fAsg === 'unassigned') rows = rows.filter(r => !r.assigned_helper_id);
  const c = { pending: rows.filter(r => r.status === 'pending').length, active: store.service_requests.filter(r => ['accepted', 'in_progress'].includes(r.status)).length, urgent: store.service_requests.filter(r => r.urgency === 'urgent' && ['pending', 'accepted', 'in_progress'].includes(r.status)).length, stale: store.service_requests.filter(isStale).length };
  const stat = (href, num, label) => `<a class="stat" href="${href}"><div class="num">${lang === 'bn' ? String(num).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[+d]) : num}</div><div class="lbl">${label}</div></a>`;
  const sel = (name, val, opts) => `<select class="input" data-filter="${name}" aria-label="${name}" style="min-width:160px;flex:1"><option value="">${opts[0]}</option>${opts.slice(1).map(o => `<option value="${o[0]}"${val === o[0] ? ' selected' : ''}>${o[1]}</option>`).join('')}</select>`;
  return `<span class="demo-badge">${ctx.t('app.demo')}</span>
  <div class="view-head"><div><h1>${tt('list.title')}</h1><p class="sub">${tt('list.sub')}</p></div></div>
  ${isSA(ctx) ? `<p class="row"><a class="btn btn-secondary btn-sm" href="#/emergency-team">${tt('list.ertLink')}</a><a class="btn btn-secondary btn-sm" href="#/services">${tt('list.servicesLink')}</a></p>` : ''}
  <div class="stat-grid">${stat('#/expatriate?status=pending', c.pending, tt('list.kpiPending'))}${stat('#/expatriate?status=in_progress', c.active, tt('list.kpiActive'))}${stat('#/expatriate?urgency=urgent', c.urgent, tt('list.kpiUrgent'))}${stat('#/expatriate?status=in_progress', c.stale, tt('list.kpiStale'))}</div>
  <div class="filters mt-4" role="search">
    <input class="input search-box" type="search" data-filter="q" value="${esc(ctx.query.q || '')}" placeholder="${tt('list.searchPh')}" aria-label="${tt('list.searchPh')}">
    ${sel('status', fStatus, [tt('list.allStatuses'), ...STATUSES.map(s => [s, ctx.t('exp.status.' + s)])])}
    ${sel('service', fService, [tt('list.allServices'), ...store.service_types.map(s => [s.key, lang === 'bn' ? s.name_bn : s.name_en])])}
    ${sel('urgency', fUrg, [tt('list.allUrgency'), ['urgent', tt('list.urgent')], ['normal', tt('list.normal')]])}
    ${sel('assigned', fAsg, [tt('list.allAssigned'), ['mine', tt('list.assignedOnly')], ['unassigned', tt('list.unassignedOnly')]])}
    <button type="button" class="btn btn-ghost btn-sm" data-clear>${tt('list.clear')}</button>
  </div>
  ${rows.length ? renderTable({ stacked: true, rows, columns: [
    { key: 'request_no', label: tt('list.colRequest'), render: r => `<span class="num">${esc(r.request_no)}</span>${r.is_emergency ? `<br>${plainBadge(tt('list.emergency'))}` : ''}` },
    { key: 'service_name_bn', label: tt('list.colService'), render: r => esc(r.service_name_bn) },
    { key: 'applicant_name_bn', label: tt('list.colApplicant'), render: r => `${esc(r.applicant_name_bn)}<br><span class="small muted num">${fmtPhoneMasked(r.applicant_phone)}</span>` },
    { key: 'status', label: tt('list.colStatus'), render: r => badge(r.status) },
    { key: 'urgency', label: tt('list.colUrgency'), render: r => r.urgency === 'urgent' ? plainBadge(tt('list.urgent')) : tt('list.normal') },
    { key: 'assigned_helper_id', label: tt('list.colAssigned'), render: r => esc(helperName(r.assigned_helper_id, lang) || tt('list.unassigned')) },
    { key: 'last_update_at', label: tt('list.colUpdated'), render: r => `${fmtDate(r.last_update_at || r.created_at, lang)}${isStale(r) ? `<br>${plainBadge(tt('list.stale'))}` : ''}` }
  ], onRowClick: r => '#/expatriate/' + r.request_no }) : emptyState(tt('list.empty'))}`;
}

function detailHtml(ctx) {
  const lang = getLang(), tt = k => ctx.t('expatriate.' + k);
  const r = store.service_requests.find(x => x.request_no === ctx.params.requestNo);
  if (!r) return notFoundHtml();
  const exps = expensesFor(r.request_no), total = exps.reduce((a, e) => a + e.amount, 0);
  const updates = updatesFor(r.request_no);
  const editable = canEdit(ctx, r);
  const open = ['pending', 'accepted', 'in_progress'].includes(r.status);
  const canTransition = !['closed', 'rejected', 'cancelled'].includes(r.status);
  const photos = r.photos || [];
  const photoCaption = p => p.caption_bn || p.caption || '';
  const photoMeta = p => {
    if (p.by || p.at) return `${esc(helperName(p.by, lang) || p.by || '')}${p.by && p.at ? ' · ' : ''}${p.at ? fmtDateTime(p.at, lang) : ''}`;
    return p.label ? esc(p.label) : '';
  };
  const svc = store.service_types.find(s => s.key === r.service_key);
  const applicantCard = canSeeApplicant(ctx, r)
    ? `<dl class="kv"><dt>${tt('detail.applicant')}</dt><dd>${esc(r.applicant_name_bn)}</dd><dt>${tt('detail.phone')}</dt><dd class="num">${fmtPhoneFull(r.applicant_phone)}</dd><dt>${tt('detail.country')}</dt><dd>${esc(r.applicant_country)}</dd></dl>`
    : `<p>${tt('detail.applicantHidden')}</p>`;
  const assignForm = isSA(ctx) ? `<form data-form="assign" class="mt-4"><div class="field"><label for="assign-primary">${tt('detail.primary')}</label><input id="assign-primary" name="primary" class="input" list="helper-list" placeholder="${tt('detail.assignPh')}" value="${esc(helperName(r.assigned_helper_id, lang) || '')}"><datalist id="helper-list">${helpers().map(h => `<option value="${esc(lang === 'bn' ? h.name_bn : h.name_en)}" data-id="${h.id}">`).join('')}</datalist></div><div class="field"><label for="assign-backup">${tt('detail.backup')}</label><input id="assign-backup" name="backup" class="input" list="helper-list" placeholder="${tt('detail.assignPh')}" value="${esc(helperName(r.backup_helper_id, lang) || '')}"></div><button type="submit" class="btn btn-primary">${tt('detail.assign')}</button></form>` : '';
  const claimBtn = (ctx.role === 'expatriate-helper' && r.status === 'pending' && !r.assigned_helper_id)
    ? `<p class="mt-4"><button type="button" class="btn btn-primary" data-action="claim" data-request="${esc(r.request_no)}">${tt('detail.claim')}</button></p>` : '';
  const actions = !canTransition ? `<p class="muted">${ctx.t('exp.status.' + r.status)}</p>` : (editable ? `
    <form data-form="transition">
      <div class="field"><label for="new-status">${tt('detail.newStatus')}</label><select id="new-status" name="to" class="input">${STATUSES.map(s => `<option value="${s}"${s === r.status ? ' selected' : ''}>${ctx.t('exp.status.' + s)}</option>`).join('')}</select></div>
      <div class="field"><label for="tr-note">${tt('detail.noteLabel')}</label><textarea id="tr-note" name="note" class="input" rows="3" required minlength="10"></textarea></div>
      ${r.status === 'in_progress' ? `<div class="field"><label><input type="checkbox" name="noExpense"> ${tt('detail.noExpenseCheck')}</label></div>` : ''}
      ${r.status === 'completed' ? `<div class="field"><label><input type="checkbox" name="confirmed"> ${tt('detail.confirmCheck')}</label></div>` : ''}
      <p class="small muted">${tt('detail.completeHint')} ${tt('detail.closeHint')}</p>
      <button type="submit" class="btn btn-primary btn-block">${tt('detail.apply')}</button>
    </form>
    ${ctx.role === 'expatriate-helper' ? `<p class="small muted mt-4">${tt('detail.rejectHint')}</p>` : ''}`
    : `<div class="error-box"><p>${tt('detail.readOnly')}</p></div>`);
  return `<span class="demo-badge">${ctx.t('app.demo')}</span>
  <p><a href="#/expatriate">← ${tt('detail.back')}</a></p>
  <div class="view-head"><div><h1><span class="num">${esc(r.request_no)}</span></h1><p class="sub">${esc(r.service_name_bn)} · ${fmtDate(r.created_at, lang)}</p></div>
  <div class="row">${badge(r.status)}${r.urgency === 'urgent' ? plainBadge(tt('list.urgent')) : ''}${r.is_emergency ? plainBadge(tt('list.emergency')) : ''}${isStale(r) ? plainBadge(tt('list.stale')) : ''}</div></div>
  <div class="detail-grid"><div>
    <section class="card"><h3>${tt('detail.service')}</h3><dl class="kv">
      <dt>${tt('detail.service')}</dt><dd>${esc(svc ? (lang === 'bn' ? svc.name_bn : svc.name_en) : r.service_name_bn)}</dd>
      <dt>${tt('detail.forWhom')}</dt><dd>${esc(r.for_whom_bn)}</dd><dt>${tt('detail.details')}</dt><dd>${esc(r.details_bn)}</dd>
      <dt>${tt('detail.urgency')}</dt><dd>${r.urgency === 'urgent' ? tt('list.urgent') : tt('list.normal')}</dd>
      <dt>${tt('detail.neededBy')}</dt><dd>${fmtDate(r.needed_by, lang)}</dd><dt>${tt('detail.created')}</dt><dd>${fmtDateTime(r.created_at, lang)}</dd></dl></section>
    <section class="card"><h3>${tt('detail.progress')}</h3>${meridianTimeline(r, lang)}</section>
    <section class="card"><h3>${tt('detail.history')}</h3>${updates.length ? updates.map(u => `<div class="list-row"><div class="grow"><strong>${ctx.t('exp.status.' + u.status_from)} → ${ctx.t('exp.status.' + u.status_to)}</strong><br>${esc(u.note_bn)}<br><span class="small muted">${esc(helperName(u.author_id, lang) || u.author_id)} · ${fmtDateTime(u.created_at, lang)}</span></div></div>`).join('') : `<p class="muted">${tt('detail.noHistory')}</p>`}</section>
    <section class="card"><h3>${tt('detail.notes')}</h3>
      ${editable && open ? `<form data-form="note"><div class="field"><label for="note-text">${tt('detail.noteLabel')}</label><textarea id="note-text" name="note" class="input" rows="3" required minlength="10" placeholder="${tt('detail.notePh')}"></textarea></div><button type="submit" class="btn btn-secondary">${tt('detail.addNote')}</button></form>` : ''}
      <h3 class="mt-6">${tt('detail.photos')}</h3>
      ${photos.length ? photos.map(p => `<div class="list-row"><div class="grow">${esc(photoCaption(p))}${photoMeta(p) ? `<br><span class="small muted">${photoMeta(p)}</span>` : ''}</div></div>`).join('') : `<p class="muted">${tt('detail.noPhotos')}</p>`}
      ${editable && open ? `<form data-form="photo" class="mt-4"><div class="field"><label for="photo-caption">${tt('detail.photoCaptionPh')}</label><input id="photo-caption" name="caption" class="input" required minlength="3"></div><button type="submit" class="btn btn-secondary">${tt('detail.addPhoto')}</button></form>` : ''}</section>
    <section class="card"><h3>${tt('detail.expenses')}</h3>
      ${r.no_expense_declaration ? `<p><strong>${tt('detail.noExpenseDecl')}</strong></p>` : ''}
      ${exps.length ? renderTable({ rows: exps, columns: [
        { key: 'item_bn', label: tt('detail.expenseItem'), render: e => esc(e.item_bn) },
        { key: 'kind', label: tt('detail.expenseKind'), render: e => tt('detail.kind' + e.kind[0].toUpperCase() + e.kind.slice(1)) },
        { key: 'amount', label: tt('detail.expenseAmount'), render: e => `<span class="num">${fmtBDT(e.amount, lang)}</span>` },
        { key: 'voucher', label: tt('detail.expenseVoucher'), render: e => esc(e.voucher || '') }
      ] }) : `<p class="muted">${tt('detail.noExpenses')}</p>`}
      ${exps.length ? `<p><strong>${tt('detail.expenseTotal')}: <span class="num">${fmtBDT(total, lang)}</span></strong></p>` : ''}
      ${editable && open ? `<form data-form="expense" class="mt-4"><div class="row"><div class="field grow"><label for="exp-item">${tt('detail.expenseItem')}</label><input id="exp-item" name="item" class="input" required></div><div class="field"><label for="exp-kind">${tt('detail.expenseKind')}</label><select id="exp-kind" name="kind" class="input"><option value="product">${tt('detail.kindProduct')}</option><option value="transport">${tt('detail.kindTransport')}</option><option value="other">${tt('detail.kindOther')}</option></select></div><div class="field"><label for="exp-amount">${tt('detail.expenseAmount')}</label><input id="exp-amount" name="amount" type="number" min="1" step="1" class="input" required></div></div><div class="field"><label for="exp-voucher">${tt('detail.expenseVoucher')}</label><input id="exp-voucher" name="voucher" class="input" placeholder="${tt('detail.voucherPh')}"></div><button type="submit" class="btn btn-secondary">${tt('detail.addExpense')}</button></form>` : `<p class="small muted mt-4">${tt('detail.expensesClosed')}</p>`}</section>
  </div><aside>
    <section class="card"><h3>${tt('detail.assignment')}</h3><dl class="kv"><dt>${tt('detail.primary')}</dt><dd>${esc(helperName(r.assigned_helper_id, lang) || tt('detail.none'))}</dd><dt>${tt('detail.backup')}</dt><dd>${esc(helperName(r.backup_helper_id, lang) || tt('detail.none'))}</dd></dl>${assignForm}${claimBtn}</section>
    <section class="card"><h3>${tt('detail.applicant')}</h3>${applicantCard}</section>
    <section class="card"><h3>${tt('detail.actions')}</h3>${actions}</section>
    <section class="card"><h3>${tt('detail.tracking')}</h3><p><span class="num">${esc(r.request_no)}</span> — ${badge(r.status)}</p><p class="small muted mt-4">${tt('detail.trackingNote')}</p></section>
  </aside></div>`;
}

function handleForm(ctx, f) {
  const r = store.service_requests.find(x => x.request_no === ctx.params.requestNo);
  if (!r) return;
  const fd = new FormData(f);
  const kind = f.dataset.form;
  if (kind === 'transition') {
    const to = fd.get('to'), note = String(fd.get('note') || '');
    ctx.modal({ title: ctx.t('expatriate.detail.confirmTitle'), body: `<p>${ctx.t('expatriate.detail.confirmBody')}</p><p><span class="num">${esc(r.request_no)}</span>: ${ctx.t('exp.status.' + r.status)} → ${ctx.t('exp.status.' + to)}</p>`, confirmLabel: ctx.t('expatriate.detail.apply'), onConfirm: () => { if (doTransition(ctx, r, to, note, !!fd.get('noExpense'), !!fd.get('confirmed'))) { ctx.rerender(); setTimeout(() => ctx.toast(ctx.t('expatriate.detail.changed')), 350); } } });
  } else if (kind === 'note') {
    const note = String(fd.get('note') || '');
    if (note.trim().length < 10) { ctx.toast(ctx.t('expatriate.detail.noteShort')); return; }
    store.service_request_updates.unshift({ id: 'upd-demo-' + Date.now(), request_no: r.request_no, author_id: ctx.user.id, status_from: r.status, status_to: r.status, note_bn: note, created_at: new Date().toISOString() });
    r.last_update_at = new Date().toISOString();
    writeAudit(ctx.user.id, ctx.role, 'expatriate.note', 'service_request', r.request_no, null, note.slice(0, 40));
    ctx.rerender(); setTimeout(() => ctx.toast(ctx.t('expatriate.detail.noteAdded')), 350);
  } else if (kind === 'photo') {
    const caption = String(fd.get('caption') || '').trim();
    if (caption.length < 3) return;
    (r.photos = r.photos || []).unshift({ caption_bn: caption, label: 'photo-' + Date.now() });
    ctx.rerender(); setTimeout(() => ctx.toast(ctx.t('expatriate.detail.photoAdded')), 350);
  } else if (kind === 'expense') {
    const amount = parseInt(fd.get('amount'), 10);
    if (!amount || amount < 1) return;
    store.service_request_expenses.push({ id: 'exp-demo-' + Date.now(), request_no: r.request_no, item_bn: String(fd.get('item')), item_en: String(fd.get('item')), kind: String(fd.get('kind') || 'other'), amount, voucher: String(fd.get('voucher') || ''), recorded_by: ctx.user.id });
    r.last_update_at = new Date().toISOString();
    writeAudit(ctx.user.id, ctx.role, 'expatriate.expense', 'service_request', r.request_no, null, String(amount));
    ctx.rerender(); setTimeout(() => ctx.toast(ctx.t('expatriate.detail.expenseAdded')), 350);
  } else if (kind === 'assign') {
    const byName = name => helpers().find(h => (getLang() === 'bn' ? h.name_bn : h.name_en) === String(name || '').trim());
    const p = byName(fd.get('primary')), b = byName(fd.get('backup'));
    const oldP = r.assigned_helper_id;
    if (fd.get('primary')) r.assigned_helper_id = p ? p.id : r.assigned_helper_id;
    if (fd.get('backup')) r.backup_helper_id = b ? b.id : null;
    writeAudit(ctx.user.id, ctx.role, 'expatriate.assign', 'service_request', r.request_no, oldP, r.assigned_helper_id);
    ctx.rerender(); setTimeout(() => ctx.toast(ctx.t('expatriate.detail.assigned')), 350);
  }
}
