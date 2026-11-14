// Expatriate Requests — queue (#/expatriate) + request detail (#/expatriate/:requestNo).
// Design Iteration 2 (v2): shared page header, statGrid, sortable tables, field(),
// .link-more, no 350ms toast delay, live now() clock. Behaviour preserved exactly.
// Journey G. State machine: pending → accepted → in_progress → completed → closed;
// exits rejected (reason required, Super Admin only) / cancelled (Super Admin only,
// applicant-initiated). Helper: claim unassigned pending; advance only assigned
// requests; NEVER reject/cancel/close — closure is the Super Admin's job after
// applicant confirmation, and the UI now EXPLAINS that instead of silently gating
// it (audit D3). Completion needs ≥1 expense line OR a no-expense declaration.
// Closure needs applicant confirmation. Applicant info: Super Admin always;
// Helper only when assigned. No service-charge field anywhere; the no-charge note
// is shown on queue + detail. The 999 disclaimer is provided by the shell —
// not duplicated here.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { setHash } from '../js/lib/router.js';
import { store, storeAdd, writeAudit, now } from '../js/lib/store.js';
import { fmtBDT, fmtDate, fmtDateTime, fmtNum, fmtPhoneMasked, fmtPhoneFull, esc, fmtAgo } from '../js/lib/format.js';
import { badge, plainBadge } from '../js/components/badges.js';
import { renderTable, bindTableRows, bindTableSort } from '../js/components/table.js';
import { statGrid } from '../js/components/stat.js';
import { field } from '../js/components/forms.js';
import { meridianTimeline } from '../js/components/timeline.js';
import { emptyState } from '../js/components/states.js';
import { notFoundHtml } from '../js/lib/guards.js';

const STRINGS = {
  bn: {
    'list.title': 'প্রবাসী অনুরোধ', 'list.sub': 'প্রবাসী সহায়তার অনুরোধের সারি — অবস্থা, সেবা ও জরুরি ভিত্তিতে ফিল্টার করুন।',
    'list.noCharge': 'এই সহায়তার জন্য কোনো সেবা মূল্য নেই — আবেদনকারীর কাছ থেকে কোনো টাকা নেওয়া হয় না।',
    'list.ertLink': 'জরুরি দল দেখুন', 'list.servicesLink': 'সেবার তালিকা দেখুন',
    'list.kpiPending': 'অপেক্ষমাণ', 'list.kpiActive': 'সক্রিয়', 'list.kpiUrgent': 'জরুরি', 'list.kpiStale': '৭২ ঘণ্টার বেশি পুরনো',
    'list.searchPh': 'অনুরোধ নম্বর বা আবেদনকারীর নাম লিখুন…', 'list.allStatuses': 'সব অবস্থা', 'list.allServices': 'সব সেবা',
    'list.allUrgency': 'সব জরুরি মাত্রা', 'list.allAssigned': 'সব দায়িত্ব', 'list.assignedOnly': 'আমাকে দেওয়া', 'list.unassignedOnly': 'দায়িত্বহীন',
    'list.clear': 'ফিল্টার মুছুন', 'list.colRequest': 'অনুরোধ', 'list.colService': 'সেবা', 'list.colApplicant': 'আবেদনকারী',
    'list.colStatus': 'অবস্থা', 'list.colUrgency': 'জরুরি মাত্রা', 'list.colAssigned': 'দায়িত্বপ্রাপ্ত', 'list.colUpdated': 'সর্বশেষ হালনাগাদ',
    'list.urgent': 'জরুরি', 'list.normal': 'সাধারণ', 'list.emergency': 'জরুরি ঘটনা', 'list.stale': '৭২ ঘণ্টার বেশি হালনাগাদ নেই',
    'list.unassigned': 'দায়িত্ব দেওয়া হয়নি', 'list.empty': 'এই ফিল্টারে কোনো অনুরোধ নেই।',
    'detail.notFound': 'অনুরোধটি পাওয়া যায়নি।', 'detail.back': 'সারিতে ফিরুন',
    'detail.summary': 'সারসংক্ষেপ', 'detail.lastUpdate': 'সর্বশেষ হালনাগাদ', 'detail.latestNote': 'সর্বশেষ নোট',
    'detail.noNoteYet': 'এখনো কোনো নোট লেখা হয়নি।', 'detail.expenseSummary': 'খরচের সারসংক্ষেপ',
    'detail.nextAction': 'পরবর্তী করণীয়', 'detail.nextActionNone': 'এই অনুরোধে আর কোনো অবস্থা পরিবর্তন নেই।',
    'detail.agoJustNow': 'এইমাত্র', 'detail.agoMinutes': '{n} মিনিট আগে', 'detail.agoHours': '{n} ঘণ্টা আগে', 'detail.agoDays': '{n} দিন আগে',
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
    'detail.chooseStatus': 'নতুন অবস্থা বেছে নিন…',
    'detail.apply': 'প্রয়োগ করুন', 'detail.illegal': 'এই অবস্থা পরিবর্তন বৈধ নয়।', 'detail.changed': 'অবস্থা পরিবর্তন হয়েছে।',
    'detail.readOnly': 'এই অনুরোধটি আপনার দায়িত্বে নয় — শুধু দেখা যাবে, পরিবর্তন করা যাবে না।',
    'detail.rejectHint': 'প্রত্যাখ্যান শুধু সুপার অ্যাডমিন করতে পারেন।', 'detail.closeHint': 'বন্ধ করতে আবেদনকারীর নিশ্চয়তা আবশ্যক।',
    'detail.completeHint': 'সম্পন্ন করতে কমপক্ষে একটি খরচের লাইন অথবা “কোনো খরচ হয়নি” ঘোষণা আবশ্যক।',
    'detail.helperCloseWhy': 'সহায়ক অনুরোধ বন্ধ করতে পারেন না। আবেদনকারী সম্পন্ন হওয়া নিশ্চিত করলে সুপার অ্যাডমিন অনুরোধটি বন্ধ করেন।',
    'detail.helperExitWhy': 'প্রত্যাখ্যান বা বাতিল শুধু সুপার অ্যাডমিন করতে পারেন।',
    'detail.cancelHint': 'বাতিল শুধু আবেদনকারীর নিজের অনুরোধে করা হয়।',
    'detail.rejectNoteHint': 'প্রত্যাখ্যান বা বাতিলের ক্ষেত্রে এই নোটটিই কারণ হিসেবে লেখা হবে।',
    'detail.saOnlySuffix': ' — শুধু সুপার অ্যাডমিন',
    'detail.tracking': 'আবেদনকারীর ট্র্যাকিং প্রাকদর্শন', 'detail.trackingNote': 'সর্বজনীন ট্র্যাকিংয়ে শুধু অনুরোধ নম্বর ও অবস্থা দেখানো হয় (স্তর-S)। নাম, নোট ও ছবি দেখানো হয় না।',
    'detail.confirmTitle': 'নিশ্চিত করুন', 'detail.confirmBody': 'অনুরোধের অবস্থা পরিবর্তন হবে। এই কাজটি লগে লেখা হবে।',
    'detail.expensesClosed': 'এই অনুরোধে আর খরচ যোগ করা যাবে না।'
  },
  en: {
    'list.title': 'Expatriate Requests', 'list.sub': 'Queue of expatriate support requests — filter by status, service and urgency.',
    'list.noCharge': 'There is no service charge for this support — no money is taken from the applicant.',
    'list.ertLink': 'View emergency team', 'list.servicesLink': 'View service catalogue',
    'list.kpiPending': 'Pending', 'list.kpiActive': 'Active', 'list.kpiUrgent': 'Urgent', 'list.kpiStale': 'Stale over 72 hours',
    'list.searchPh': 'Search by request number or applicant name…', 'list.allStatuses': 'All statuses', 'list.allServices': 'All services',
    'list.allUrgency': 'All urgency levels', 'list.allAssigned': 'All assignments', 'list.assignedOnly': 'Assigned to me', 'list.unassignedOnly': 'Unassigned',
    'list.clear': 'Clear filters', 'list.colRequest': 'Request', 'list.colService': 'Service', 'list.colApplicant': 'Applicant',
    'list.colStatus': 'Status', 'list.colUrgency': 'Urgency', 'list.colAssigned': 'Assigned to', 'list.colUpdated': 'Last updated',
    'list.urgent': 'Urgent', 'list.normal': 'Normal', 'list.emergency': 'Emergency', 'list.stale': 'No update for over 72 hours',
    'list.unassigned': 'Unassigned', 'list.empty': 'No requests match these filters.',
    'detail.notFound': 'Request not found.', 'detail.back': 'Back to queue',
    'detail.summary': 'Summary', 'detail.lastUpdate': 'Last updated', 'detail.latestNote': 'Latest note',
    'detail.noNoteYet': 'No note has been written yet.', 'detail.expenseSummary': 'Expense summary',
    'detail.nextAction': 'Next step', 'detail.nextActionNone': 'No further status change is possible for this request.',
    'detail.agoJustNow': 'just now', 'detail.agoMinutes': '{n} minutes ago', 'detail.agoHours': '{n} hours ago', 'detail.agoDays': '{n} days ago',
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
    'detail.chooseStatus': 'Choose a new status…',
    'detail.apply': 'Apply', 'detail.illegal': 'This status change is not allowed.', 'detail.changed': 'Status changed.',
    'detail.readOnly': 'This request is not assigned to you — view only, no changes allowed.',
    'detail.rejectHint': 'Only a Super Admin can reject a request.', 'detail.closeHint': 'Closing needs the applicant’s confirmation.',
    'detail.completeHint': 'Completion needs at least one expense line or a “no expense incurred” declaration.',
    'detail.helperCloseWhy': 'A helper cannot close a request. Once the applicant confirms completion, a Super Admin closes it.',
    'detail.helperExitWhy': 'Only a Super Admin can reject or cancel a request.',
    'detail.cancelHint': 'A request is cancelled only at the applicant’s own request.',
    'detail.rejectNoteHint': 'For a rejection or cancellation, this note is recorded as the reason.',
    'detail.saOnlySuffix': ' — Super Admin only',
    'detail.tracking': 'Applicant tracking preview', 'detail.trackingNote': 'Public tracking shows only the request number and status (Tier-S). Names, notes and photos are not shown.',
    'detail.confirmTitle': 'Confirm', 'detail.confirmBody': 'The request status will change. This action will be written to the log.',
    'detail.expensesClosed': 'No more expenses can be added to this request.'
  }
};
registerStrings('expatriate', STRINGS);

const STATUSES = ['pending', 'accepted', 'in_progress', 'completed', 'closed', 'rejected', 'cancelled'];
const NEXT = { pending: ['accepted', 'rejected', 'cancelled'], accepted: ['in_progress', 'rejected', 'cancelled'], in_progress: ['completed', 'cancelled'], completed: ['closed'], closed: [], rejected: [], cancelled: [] };
// Exits a Helper may never take, even with applicant confirmation (audit D3):
// closure is the Super Admin's job after applicant confirmation.
const SA_ONLY = ['rejected', 'cancelled', 'closed'];
const STALE_MS = 72 * 3600 * 1000;
const isSA = ctx => ctx.role === 'super-admin';
const helpers = () => store.users.filter(u => u.role === 'expatriate-helper' && u.status === 'active');
const helperName = (id, lang) => { const u = store.users.find(x => x.id === id); return u ? (lang === 'bn' ? u.name_bn : u.name_en) : null; };
// Staleness uses the shared live clock now() (DS v2, audit D-03) — never a frozen date.
const isStale = r => r.status === 'in_progress' && (now() - new Date(r.last_update_at || r.created_at).getTime()) > STALE_MS;
const isAssignedTo = (ctx, r) => ctx.user && (r.assigned_helper_id === ctx.user.id || r.backup_helper_id === ctx.user.id);
const canEdit = (ctx, r) => isSA(ctx) || (ctx.role === 'expatriate-helper' && isAssignedTo(ctx, r));
const expensesFor = no => store.service_request_expenses.filter(e => e.request_no === no);
const updatesFor = no => store.service_request_updates.filter(u => u.request_no === no).sort((a, b) => b.created_at.localeCompare(a.created_at));
// G4-1: per-step timestamps for the Meridian timeline — latest update whose
// status_to is the step; pending falls back to the request's created_at.
function stepTimesFor(r, updates){
  const times = { pending: r.created_at };
  for(const u of (updates || updatesFor(r.request_no))){
    if(!times[u.status_to] || u.created_at > times[u.status_to]) times[u.status_to] = u.created_at;
  }
  return times;
}
const canSeeApplicant = (ctx, r) => isSA(ctx) || isAssignedTo(ctx, r);



// Next PERMITTED action(s) for this viewer, with the gate each one still needs.
// Helpers see only their own permitted moves; SA-only exits are explained, not hidden.
function nextActionsHtml(ctx, r) {
  const tt = k => ctx.t('expatriate.' + k);
  const next = NEXT[r.status] || [];
  if (!next.length) return `<p class="muted">${tt('detail.nextActionNone')}</p>`;
  const permitted = next.filter(to => isSA(ctx) || !SA_ONLY.includes(to));
  const gateNote = to => {
    if (to === 'completed') return tt('detail.completeHint');
    if (to === 'closed') return tt('detail.closeHint');
    if (to === 'rejected' || to === 'cancelled') return tt('detail.rejectNoteHint');
    return '';
  };
  const lines = permitted.map(to => `<li><strong>${ctx.t('exp.status.' + to)}</strong>${gateNote(to) ? ` — <span class="muted">${gateNote(to)}</span>` : ''}</li>`).join('');
  const blocked = next.filter(to => !isSA(ctx) && SA_ONLY.includes(to));
  const blockedNote = blocked.length
    ? `<p class="small muted">${blocked.includes('closed') ? tt('detail.helperCloseWhy') : tt('detail.helperExitWhy')}</p>` : '';
  if (!permitted.length) return blockedNote || `<p class="muted">${tt('detail.nextActionNone')}</p>`;
  return `<ul>${lines}</ul>${blockedNote}`;
}

function transitionError(ctx, r, to, note, noExpense, confirmed) {
  const tt = k => ctx.t('expatriate.' + k);
  if (!to || !(NEXT[r.status] || []).includes(to)) return tt('detail.illegal');
  // Role gate with an explanation, not a bare "not allowed" (audit D3):
  // Helpers never close/reject/cancel — the reason is stated in the message.
  if (SA_ONLY.includes(to) && !isSA(ctx)) return to === 'closed' ? tt('detail.helperCloseWhy') : tt('detail.helperExitWhy');
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
  storeAdd('service_request_updates', { id: 'upd-demo-' + Date.now(), request_no: r.request_no, author_id: ctx.user.id, status_from: from, status_to: to, note_bn: note, created_at: r.last_update_at });
  writeAudit(ctx.user.id, ctx.role, 'expatriate.transition', 'service_request', r.request_no, from, to);
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
    bindTableSort(root, (key, dir) => setHash('#/expatriate', { ...ctx.query, sort: key, dir }));
    root.querySelectorAll('[data-filter]').forEach(el => el.addEventListener('change', () => {
      const params = {};
      root.querySelectorAll('[data-filter]').forEach(f => { if (f.value) params[f.dataset.filter] = f.value; });
      setHash('#/expatriate', params);
    }));
    const clear = root.querySelector('[data-clear]');
    if (clear) clear.addEventListener('click', () => { location.hash = '#/expatriate'; });
    root.querySelectorAll('form[data-form]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); handleForm(ctx, f); }));
    root.querySelectorAll('[data-action="claim"]').forEach(b => b.addEventListener('click', () => {
      const r = store.service_requests.find(x => x.request_no === b.dataset.request);
      if (!r || r.assigned_helper_id || r.status !== 'pending') return;
      r.assigned_helper_id = ctx.user.id; r.last_update_at = new Date().toISOString();
      writeAudit(ctx.user.id, ctx.role, 'expatriate.claim', 'service_request', r.request_no, null, ctx.user.id);
      ctx.rerender(); ctx.toast(ctx.t('expatriate.detail.claimed'));
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
  const c = { pending: store.service_requests.filter(r => r.status === 'pending').length, active: store.service_requests.filter(r => ['accepted', 'in_progress'].includes(r.status)).length, urgent: store.service_requests.filter(r => r.urgency === 'urgent' && ['pending', 'accepted', 'in_progress'].includes(r.status)).length, stale: store.service_requests.filter(isStale).length };
  const sel = (name, val, opts) => `<select class="input" data-filter="${name}" aria-label="${opts[0]}"><option value="">${opts[0]}</option>${opts.slice(1).map(o => `<option value="${o[0]}"${val === o[0] ? ' selected' : ''}>${o[1]}</option>`).join('')}</select>`;
  const sort = ctx.query.sort ? { key: ctx.query.sort, dir: ctx.query.dir === 'desc' ? 'desc' : 'asc' } : null;
  return `<span class="demo-badge">${ctx.t('app.demo')}</span>
  <div class="view-head"><div><h1>${tt('list.title')}</h1><p class="sub">${tt('list.sub')}</p><p class="small muted">${tt('list.noCharge')}</p></div></div>
  ${isSA(ctx) ? `<p class="row"><a class="link-more" href="#/emergency-team">${tt('list.ertLink')}</a><a class="link-more" href="#/services">${tt('list.servicesLink')}</a></p>` : ''}
  ${statGrid([
    { href: '#/expatriate?status=pending', num: fmtNum(c.pending, lang), label: tt('list.kpiPending') },
    { href: '#/expatriate?status=in_progress', num: fmtNum(c.active, lang), label: tt('list.kpiActive') },
    { href: '#/expatriate?urgency=urgent', num: fmtNum(c.urgent, lang), label: tt('list.kpiUrgent') },
    { href: '#/expatriate?status=in_progress', num: fmtNum(c.stale, lang), label: tt('list.kpiStale') }
  ])}
  <div class="filters mt-4" role="search">
    <input class="input search-box" type="search" data-filter="q" value="${esc(ctx.query.q || '')}" placeholder="${tt('list.searchPh')}" aria-label="${tt('list.searchPh')}">
    <button type="button" class="btn btn-ghost btn-sm" data-clear>${tt('list.clear')}</button>
  </div>
  <div class="two-col">
    ${sel('status', fStatus, [tt('list.allStatuses'), ...STATUSES.map(s => [s, ctx.t('exp.status.' + s)])])}
    ${sel('service', fService, [tt('list.allServices'), ...store.service_types.map(s => [s.key, lang === 'bn' ? s.name_bn : s.name_en])])}
    ${sel('urgency', fUrg, [tt('list.allUrgency'), ['urgent', tt('list.urgent')], ['normal', tt('list.normal')]])}
    ${sel('assigned', fAsg, [tt('list.allAssigned'), ['mine', tt('list.assignedOnly')], ['unassigned', tt('list.unassignedOnly')]])}
  </div>
  ${rows.length ? renderTable({ stacked: true, rows, sort, columns: [
    { key: 'request_no', label: tt('list.colRequest'), sortable: true, render: r => `<span class="num">${esc(r.request_no)}</span>${r.is_emergency ? `<br>${plainBadge(tt('list.emergency'))}` : ''}` },
    { key: 'service_name_bn', label: tt('list.colService'), sortable: true, render: r => esc(r.service_name_bn) },
    { key: 'applicant_name_bn', label: tt('list.colApplicant'), sortable: true, render: r => `${esc(r.applicant_name_bn)}<br><span class="small muted num">${fmtPhoneMasked(r.applicant_phone)}</span>` },
    { key: 'status', label: tt('list.colStatus'), sortable: true, render: r => badge(r.status) },
    { key: 'urgency', label: tt('list.colUrgency'), render: r => r.urgency === 'urgent' ? plainBadge(tt('list.urgent')) : tt('list.normal') },
    { key: 'assigned_helper_id', label: tt('list.colAssigned'), sortable: true, render: r => esc(helperName(r.assigned_helper_id, lang) || tt('list.unassigned')) },
    { key: 'last_update_at', label: tt('list.colUpdated'), sortable: true, render: r => `${fmtDate(r.last_update_at || r.created_at, lang)}<br><span class="small muted">${fmtAgo(r.last_update_at || r.created_at, lang)}</span>${isStale(r) ? `<br>${plainBadge(tt('list.stale'))}` : ''}` }
  ], onRowClick: r => '#/expatriate/' + r.request_no }) : emptyState(tt('list.empty'))}`;
}

function detailHtml(ctx) {
  const lang = getLang(), tt = k => ctx.t('expatriate.' + k);
  const r = store.service_requests.find(x => x.request_no === ctx.params.requestNo);
  if (!r) return notFoundHtml();
  const exps = expensesFor(r.request_no), total = exps.reduce((a, e) => a + e.amount, 0);
  const updates = updatesFor(r.request_no);
  const latestNote = updates.length ? updates[0].note_bn : null;
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
  const assignForm = isSA(ctx) ? `<form data-form="assign" class="mt-4">
      ${field({ id: 'primary', label: tt('detail.primary'), attrs: 'list="helper-list"', value: helperName(r.assigned_helper_id, lang) || '' })}
      ${field({ id: 'backup', label: tt('detail.backup'), attrs: 'list="helper-list"', value: helperName(r.backup_helper_id, lang) || '' })}
      <datalist id="helper-list">${helpers().map(h => `<option value="${esc(lang === 'bn' ? h.name_bn : h.name_en)}" data-id="${h.id}">`).join('')}</datalist>
      <button type="submit" class="btn btn-primary">${tt('detail.assign')}</button></form>` : '';
  const claimBtn = (ctx.role === 'expatriate-helper' && r.status === 'pending' && !r.assigned_helper_id)
    ? `<p class="mt-4"><button type="button" class="btn btn-primary" data-action="claim" data-request="${esc(r.request_no)}">${tt('detail.claim')}</button></p>` : '';
  const actions = !canTransition ? `<p class="muted">${ctx.t('exp.status.' + r.status)}</p>` : (editable ? transitionForm(ctx, r) : `<div class="error-box"><p>${tt('detail.readOnly')}</p></div>`);
  const expenseSummary = r.no_expense_declaration ? tt('detail.noExpenseDecl')
    : (exps.length ? `${fmtBDT(total, lang)} · ${fmtNum(exps.length, lang)} ${tt('detail.expenseItem')}` : tt('detail.noExpenses'));
  return `<span class="demo-badge">${ctx.t('app.demo')}</span>
  <p><a class="link-more" href="#/expatriate">← ${tt('detail.back')}</a></p>
  <div class="view-head"><div><h1><span class="num">${esc(r.request_no)}</span></h1><p class="sub">${esc(r.service_name_bn)} · ${fmtDate(r.created_at, lang)}</p></div>
  <div class="row">${badge(r.status)}${r.urgency === 'urgent' ? plainBadge(tt('list.urgent')) : ''}${r.is_emergency ? plainBadge(tt('list.emergency')) : ''}${isStale(r) ? plainBadge(tt('list.stale')) : ''}</div></div>
  <div class="detail-grid"><div>
    <section class="card"><h3>${tt('detail.summary')}</h3><dl class="kv">
      <dt>${tt('list.colStatus')}</dt><dd>${badge(r.status)}</dd>
      <dt>${tt('detail.urgency')}</dt><dd>${r.urgency === 'urgent' ? tt('list.urgent') : tt('list.normal')}${r.is_emergency ? ` · ${tt('list.emergency')}` : ''}</dd>
      <dt>${tt('detail.primary')}</dt><dd>${esc(helperName(r.assigned_helper_id, lang) || tt('detail.none'))}</dd>
      <dt>${tt('detail.lastUpdate')}</dt><dd>${fmtDateTime(r.last_update_at || r.created_at, lang)} · <span class="muted">${fmtAgo(r.last_update_at || r.created_at, lang)}</span></dd>
      <dt>${tt('detail.latestNote')}</dt><dd>${latestNote ? esc(latestNote) : `<span class="muted">${tt('detail.noNoteYet')}</span>`}</dd>
      <dt>${tt('detail.expenseSummary')}</dt><dd>${esc(expenseSummary)}</dd>
      <dt>${tt('detail.nextAction')}</dt><dd>${nextActionsHtml(ctx, r)}</dd></dl>
      <p class="small muted mt-4">${tt('list.noCharge')}</p></section>
    <section class="card"><h3>${tt('detail.service')}</h3><dl class="kv">
      <dt>${tt('detail.service')}</dt><dd>${esc(svc ? (lang === 'bn' ? svc.name_bn : svc.name_en) : r.service_name_bn)}</dd>
      <dt>${tt('detail.forWhom')}</dt><dd>${esc(r.for_whom_bn)}</dd><dt>${tt('detail.details')}</dt><dd>${esc(r.details_bn)}</dd>
      <dt>${tt('detail.urgency')}</dt><dd>${r.urgency === 'urgent' ? tt('list.urgent') : tt('list.normal')}</dd>
      <dt>${tt('detail.neededBy')}</dt><dd>${fmtDate(r.needed_by, lang)}</dd><dt>${tt('detail.created')}</dt><dd>${fmtDateTime(r.created_at, lang)}</dd></dl></section>
    <section class="card"><h3>${tt('detail.progress')}</h3>${meridianTimeline(r, lang, stepTimesFor(r, updates))}</section>
    <section class="card"><h3>${tt('detail.history')}</h3>${updates.length ? updates.map(u => `<div class="list-row"><div class="grow"><strong>${ctx.t('exp.status.' + u.status_from)} → ${ctx.t('exp.status.' + u.status_to)}</strong><br>${esc(u.note_bn)}<br><span class="small muted">${esc(helperName(u.author_id, lang) || u.author_id)} · ${fmtDateTime(u.created_at, lang)}</span></div></div>`).join('') : `<p class="muted">${tt('detail.noHistory')}</p>`}</section>
    <section class="card"><h3>${tt('detail.notes')}</h3>
      ${editable && open ? `<form data-form="note">${field({ id: 'note', label: tt('detail.noteLabel'), type: 'textarea', rows: 3, required: true, attrs: 'minlength="10" placeholder="' + esc(tt('detail.notePh')) + '"' })}<button type="submit" class="btn btn-secondary">${tt('detail.addNote')}</button></form>` : ''}
      <h3 class="mt-6">${tt('detail.photos')}</h3>
      ${photos.length ? photos.map(p => `<div class="list-row"><div class="grow">${esc(photoCaption(p))}${photoMeta(p) ? `<br><span class="small muted">${photoMeta(p)}</span>` : ''}</div></div>`).join('') : `<p class="muted">${tt('detail.noPhotos')}</p>`}
      ${editable && open ? `<form data-form="photo" class="mt-4">${field({ id: 'caption', label: tt('detail.photoCaptionPh'), required: true, attrs: 'minlength="3"' })}<button type="submit" class="btn btn-secondary">${tt('detail.addPhoto')}</button></form>` : ''}</section>
    <section class="card"><h3>${tt('detail.expenses')}</h3>
      ${r.no_expense_declaration ? `<p><strong>${tt('detail.noExpenseDecl')}</strong></p>` : ''}
      ${exps.length ? renderTable({ rows: exps, columns: [
        { key: 'item_bn', label: tt('detail.expenseItem'), render: e => esc(e.item_bn) },
        { key: 'kind', label: tt('detail.expenseKind'), render: e => tt('detail.kind' + e.kind[0].toUpperCase() + e.kind.slice(1)) },
        { key: 'amount', label: tt('detail.expenseAmount'), render: e => `<span class="num">${fmtBDT(e.amount, lang)}</span>` },
        { key: 'voucher', label: tt('detail.expenseVoucher'), render: e => esc(e.voucher || '') }
      ] }) : `<p class="muted">${tt('detail.noExpenses')}</p>`}
      ${exps.length ? `<p><strong>${tt('detail.expenseTotal')}: <span class="num">${fmtBDT(total, lang)}</span></strong></p>` : ''}
      ${editable && open ? `<form data-form="expense" class="mt-4">
        ${field({ id: 'item', label: tt('detail.expenseItem'), required: true })}
        <div class="two-col">
          ${field({ id: 'kind', label: tt('detail.expenseKind'), options: [{ value: 'product', label: tt('detail.kindProduct') }, { value: 'transport', label: tt('detail.kindTransport') }, { value: 'other', label: tt('detail.kindOther') }] })}
          ${field({ id: 'amount', label: tt('detail.expenseAmount'), type: 'number', required: true, attrs: 'min="1" step="1"' })}
        </div>
        ${field({ id: 'voucher', label: tt('detail.expenseVoucher'), attrs: 'placeholder="' + esc(tt('detail.voucherPh')) + '"' })}
        <button type="submit" class="btn btn-secondary">${tt('detail.addExpense')}</button></form>` : `<p class="small muted mt-4">${tt('detail.expensesClosed')}</p>`}</section>
  </div><aside>
    <section class="card"><h3>${tt('detail.assignment')}</h3><dl class="kv"><dt>${tt('detail.primary')}</dt><dd>${esc(helperName(r.assigned_helper_id, lang) || tt('detail.none'))}</dd><dt>${tt('detail.backup')}</dt><dd>${esc(helperName(r.backup_helper_id, lang) || tt('detail.none'))}</dd></dl>${assignForm}${claimBtn}</section>
    <section class="card"><h3>${tt('detail.applicant')}</h3>${applicantCard}</section>
    <section class="card"><h3>${tt('detail.actions')}</h3>${actions}</section>
    <section class="card"><h3>${tt('detail.tracking')}</h3><p><span class="num">${esc(r.request_no)}</span> — ${badge(r.status)}</p><p class="small muted mt-4">${tt('detail.trackingNote')}</p></section>
  </aside></div>`;
}

// Transition form. SA-only exits stay VISIBLE to Helpers as disabled options with
// the reason written out (audit D3) — never silently hidden, never silently gated.
function transitionForm(ctx, r) {
  const tt = k => ctx.t('expatriate.' + k);
  const next = NEXT[r.status] || [];
  const forbidden = to => SA_ONLY.includes(to) && !isSA(ctx);
  const enabled = next.filter(to => !forbidden(to));
  const options = [`<option value="">${tt('detail.chooseStatus')}</option>`].concat(next.map(to =>
    `<option value="${to}"${forbidden(to) ? ' disabled' : ''}>${ctx.t('exp.status.' + to)}${forbidden(to) ? tt('detail.saOnlySuffix') : ''}</option>`)).join('');
  const explains = [];
  if (next.includes('closed') && !isSA(ctx)) explains.push(tt('detail.helperCloseWhy'));
  if (next.some(to => (to === 'rejected' || to === 'cancelled') && !isSA(ctx))) explains.push(tt('detail.helperExitWhy'));
  const hints = [];
  if (enabled.includes('completed')) hints.push(tt('detail.completeHint'));
  if (enabled.includes('closed')) hints.push(tt('detail.closeHint'));
  if (enabled.includes('cancelled') && isSA(ctx)) hints.push(tt('detail.cancelHint'));
  if (enabled.some(to => to === 'rejected' || to === 'cancelled')) hints.push(tt('detail.rejectNoteHint'));
  return `
    <form data-form="transition">
      <div class="field"><label for="to">${tt('detail.newStatus')}</label><select id="to" name="to" class="input">${options}</select></div>
      ${field({ id: 'tr-note', label: tt('detail.noteLabel'), type: 'textarea', rows: 3, required: true, attrs: 'minlength="10"' })}
      ${enabled.includes('completed') ? `<div class="field"><label><input type="checkbox" name="noExpense"> ${tt('detail.noExpenseCheck')}</label></div>` : ''}
      ${enabled.includes('closed') ? `<div class="field"><label><input type="checkbox" name="confirmed"> ${tt('detail.confirmCheck')}</label></div>` : ''}
      ${explains.length ? `<div class="error-box"><p>${explains.join(' ')}</p></div>` : ''}
      ${hints.length ? `<p class="small muted">${hints.join(' ')}</p>` : ''}
      <button type="submit" class="btn btn-primary btn-block"${enabled.length ? '' : ' disabled'}>${tt('detail.apply')}</button>
    </form>`;
}

function handleForm(ctx, f) {
  const r = store.service_requests.find(x => x.request_no === ctx.params.requestNo);
  if (!r) return;
  const fd = new FormData(f);
  const kind = f.dataset.form;
  if (kind === 'transition') {
    const to = fd.get('to'), note = String(fd.get('tr-note') || '');
    if (!to) { ctx.toast(ctx.t('expatriate.detail.illegal')); return; }
    ctx.modal({ title: ctx.t('expatriate.detail.confirmTitle'), body: `<p>${ctx.t('expatriate.detail.confirmBody')}</p><p><span class="num">${esc(r.request_no)}</span>: ${ctx.t('exp.status.' + r.status)} → ${ctx.t('exp.status.' + to)}</p>`, confirmLabel: ctx.t('expatriate.detail.apply'), onConfirm: () => { if (doTransition(ctx, r, to, note, !!fd.get('noExpense'), !!fd.get('confirmed'))) { ctx.rerender(); ctx.toast(ctx.t('expatriate.detail.changed')); } } });
  } else if (kind === 'note') {
    const note = String(fd.get('note') || '');
    if (note.trim().length < 10) { ctx.toast(ctx.t('expatriate.detail.noteShort')); return; }
    storeAdd('service_request_updates', { id: 'upd-demo-' + Date.now(), request_no: r.request_no, author_id: ctx.user.id, status_from: r.status, status_to: r.status, note_bn: note, created_at: new Date().toISOString() });
    r.last_update_at = new Date().toISOString();
    writeAudit(ctx.user.id, ctx.role, 'expatriate.note', 'service_request', r.request_no, null, note.slice(0, 40));
    ctx.rerender(); ctx.toast(ctx.t('expatriate.detail.noteAdded'));
  } else if (kind === 'photo') {
    const caption = String(fd.get('caption') || '').trim();
    if (caption.length < 3) return;
    (r.photos = r.photos || []).unshift({ caption_bn: caption, label: 'photo-' + Date.now() });
    ctx.rerender(); ctx.toast(ctx.t('expatriate.detail.photoAdded'));
  } else if (kind === 'expense') {
    const amount = parseInt(fd.get('amount'), 10);
    if (!amount || amount < 1) return;
    store.service_request_expenses.push({ id: 'exp-demo-' + Date.now(), request_no: r.request_no, item_bn: String(fd.get('item')), item_en: String(fd.get('item')), kind: String(fd.get('kind') || 'other'), amount, voucher: String(fd.get('voucher') || ''), recorded_by: ctx.user.id });
    r.last_update_at = new Date().toISOString();
    writeAudit(ctx.user.id, ctx.role, 'expatriate.expense', 'service_request', r.request_no, null, String(amount));
    ctx.rerender(); ctx.toast(ctx.t('expatriate.detail.expenseAdded'));
  } else if (kind === 'assign') {
    const byName = name => helpers().find(h => (getLang() === 'bn' ? h.name_bn : h.name_en) === String(name || '').trim());
    const p = byName(fd.get('primary')), b = byName(fd.get('backup'));
    const oldP = r.assigned_helper_id;
    if (fd.get('primary')) r.assigned_helper_id = p ? p.id : r.assigned_helper_id;
    if (fd.get('backup')) r.backup_helper_id = b ? b.id : null;
    writeAudit(ctx.user.id, ctx.role, 'expatriate.assign', 'service_request', r.request_no, oldP, r.assigned_helper_id);
    ctx.rerender(); ctx.toast(ctx.t('expatriate.detail.assigned'));
  }
}
