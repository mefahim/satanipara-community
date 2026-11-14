// Members view — Journey C: member list + pending approvals, detail (profile /
// family / requests / activity), edit. Super Admin only. All data DEMO-labelled.
// Demo gaps (reported, not invented): no date of birth (age band shows updating),
// no visibility/consent fields beyond donor opt-in; expatriate requests carry no
// member link so request history matches on phone only. Members DO carry a
// household_id in the demo data (m-1..m-4) — shown as a household link.
// v2: shared statCard/statGrid, real table sorting (?sort=&dir=), field()
// textarea/select variants, .link-more, no 350 ms toast delay.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { buildQueryString } from '../js/lib/router.js';
import { store, filterList, writeAudit } from '../js/lib/store.js';
import { fmtDate, fmtPhoneMasked, fmtPhoneFull, fmtNum, esc } from '../js/lib/format.js';
import { badge } from '../js/components/badges.js';
import { renderTable, bindTableRows, bindTableSort } from '../js/components/table.js';
import { statGrid } from '../js/components/stat.js';
import { field, errorSummary, validateRequired } from '../js/components/forms.js';
import { emptyState } from '../js/components/states.js';
import { notFoundHtml } from '../js/lib/guards.js';

const STRINGS = {
  bn: {
    'list.title': 'সদস্য', 'list.subtitle': 'সম্প্রদায়ের সদস্য তালিকা ও আবেদন যাচাই।',
    'list.pendingTitle': 'সদস্য অনুমোদন',
    'list.pendingNote': 'অপেক্ষমাণ আবেদন যাচাই করে অনুমোদন বা প্রত্যাখ্যান করুন। অনুমোদনে সদস্য আইডি দেওয়া হয়।',
    'list.searchPh': 'নাম, মোবাইল বা সদস্য আইডি খুঁজুন', 'list.statusAll': 'সব অবস্থা',
    'list.status.pending': 'অপেক্ষমাণ', 'list.status.approved': 'অনুমোদিত',
    'list.status.rejected': 'প্রত্যাখ্যাত', 'list.status.suspended': 'স্থগিত',
    'list.typeAll': 'সব ধরন', 'list.type.resident': 'স্থানীয় বাসিন্দা',
    'list.type.expat': 'প্রবাসী', 'list.type.student': 'শিক্ষার্থী',
    'list.areaAll': 'সব এলাকা', 'list.sortNewest': 'নতুন আগে',
    'list.sortOldest': 'পুরোনো আগে', 'list.sortName': 'নাম অনুযায়ী',
    'list.colName': 'নাম', 'list.colId': 'সদস্য আইডি', 'list.colPhone': 'মোবাইল', 'list.colArea': 'এলাকা',
    'list.colType': 'ধরন', 'list.colStatus': 'অবস্থা', 'list.colApplied': 'আবেদনের তারিখ', 'list.countTotal': 'মোট',
    'list.countPending': 'অপেক্ষমাণ', 'list.countApproved': 'অনুমোদিত',
    'list.countRejected': 'প্রত্যাখ্যাত', 'list.countSuspended': 'স্থগিত',
    'list.prev': 'আগের পাতা', 'list.next': 'পরের পাতা',
    'list.noId': 'অনুমোদনে দেওয়া হবে', 'detail.back': 'সদস্য তালিকায় ফিরুন',
    'detail.tabProfile': 'প্রোফাইল', 'detail.tabFamily': 'পরিবার',
    'detail.tabRequests': 'অনুরোধের ইতিহাস', 'detail.tabActivity': 'কার্যক্রম',
    'detail.personal': 'ব্যক্তিগত তথ্য', 'detail.kName': 'নাম',
    'detail.kId': 'সদস্য আইডি', 'detail.kPhone': 'মোবাইল (বিস্তারিত দৃশ্যে)',
    'detail.kArea': 'এলাকা', 'detail.kType': 'ধরন', 'detail.kHousehold': 'পরিবার',
    'detail.kStatus': 'সদস্যপদ অবস্থা', 'detail.kApplied': 'আবেদনের তারিখ',
    'detail.kDonor': 'রক্তদানে আগ্রহ', 'detail.kAge': 'বয়সের সীমা',
    'detail.kVisibility': 'দৃশ্যমানতা ও সম্মতি', 'detail.donorYes': 'হ্যাঁ',
    'detail.donorNo': 'না', 'detail.rejectionReason': 'প্রত্যাখ্যানের কারণ',
    'detail.suspensionReason': 'স্থগিতের কারণ', 'detail.familyTitle': 'পরিবার / গৃহস্থালি',
    'detail.familyNote': 'পরিবারের সদস্য যোগ বা সম্পাদনা করা যায়।',
    'detail.familyHouseholdNote': 'এই সদস্যের পরিবারের রেকর্ড দেখুন:',
    'detail.familyEmpty': 'কোনো পরিবারের সদস্য নথিভুক্ত নেই।', 'detail.familyName': 'নাম',
    'detail.familyRelation': 'সম্পর্ক', 'detail.familyAdd': 'পরিবারের সদস্য যোগ করুন',
    'detail.familyAdded': 'পরিবারের সদস্য যোগ করা হয়েছে।', 'detail.reqTitle': 'প্রবাসী সহায়তার অনুরোধ',
    'detail.reqNote': 'নমুনা অনুরোধগুলোতে সদস্য অ্যাকাউন্টের সংযোগ নেই; মোবাইল নম্বর মিলিয়ে দেখানো হয়।',
    'detail.reqEmpty': 'এই সদস্যের নামে কোনো অনুরোধ পাওয়া যায়নি।', 'detail.colReq': 'অনুরোধ নম্বর',
    'detail.colService': 'সেবা', 'detail.colDate': 'তারিখ',
    'detail.actTitle': 'সদস্য-সংক্রান্ত কার্যক্রম', 'detail.actEmpty': 'এই সদস্যের বিষয়ে কোনো লগ নেই।',
    'detail.colAction': 'কাজ', 'detail.colChange': 'পরিবর্তন',
    'detail.colActor': 'কারী', 'detail.approve': 'অনুমোদন করুন',
    'detail.reject': 'প্রত্যাখ্যান করুন', 'detail.suspend': 'স্থগিত করুন',
    'detail.reinstate': 'পুনর্বহাল করুন', 'detail.edit': 'তথ্য সম্পাদনা',
    'detail.deleteRequest': 'অ্যাকাউন্ট মুছে ফেলার অনুরোধ', 'detail.approveTitle': 'সদস্য অনুমোদন',
    'detail.approveBody': '{name} ({phone}) কে সদস্য হিসেবে অনুমোদন করা হবে। অনুমোদনে একটি অনন্য সদস্য আইডি দেওয়া হবে এবং সদস্য লগইন করতে পারবেন। এই কাজটি অডিট লগে লেখা হবে।',
    'detail.approvedToast': 'সদস্য অনুমোদিত হয়েছে। সদস্য আইডি দেওয়া হয়েছে।',
    'detail.rejectTitle': 'আবেদন প্রত্যাখ্যান',
    'detail.rejectBody': '{name} ({phone})-এর আবেদন প্রত্যাখ্যাত হবে। কারণ আবেদনকারীকে দেখানো হবে। প্রত্যাখ্যাত আবেদনকারী নতুন আবেদন করতে পারবেন।',
    'detail.reasonLabel': 'কারণ (অবশ্যই লিখতে হবে)', 'detail.reasonHint': 'কমপক্ষে ১০ অক্ষর লিখুন।',
    'detail.reasonShort': 'কারণ কমপক্ষে ১০ অক্ষরের হতে হবে।', 'detail.rejectedToast': 'আবেদন প্রত্যাখ্যাত হয়েছে।',
    'detail.suspendTitle': 'সদস্যপদ স্থগিত',
    'detail.suspendBody': '{name} ({phone})-এর সদস্যপদ স্থগিত করা হবে। স্থগিত হলে সদস্যের সব সেশন সঙ্গে সঙ্গে বাতিল হবে।',
    'detail.suspendedToast': 'সদস্যপদ স্থগিত করা হয়েছে।', 'detail.reinstateTitle': 'সদস্যপদ পুনর্বহাল',
    'detail.reinstateBody': '{name} ({phone})-এর সদস্যপদ আবার চালু করা হবে।',
    'detail.reinstatedToast': 'সদস্যপদ পুনর্বহাল করা হয়েছে।', 'detail.deleteTitle': 'অ্যাকাউন্ট মুছে ফেলার অনুরোধ',
    'detail.deleteBody': '{name}-এর অ্যাকাউন্ট মুছে ফেলার অনুরোধ নথিভুক্ত করা হবে। অনুরোধের তারিখ থেকে ৩০ দিনের অপেক্ষা (গ্রেস) সময় থাকবে; অর্থ বা অনুরোধের রেকর্ড থাকলে তথ্য মুছে না ফেলে নামহীন (অ্যানোনিমাইজ) করা হবে।',
    'detail.deleteToast': 'মুছে ফেলার অনুরোধ নথিভুক্ত হয়েছে। ৩০ দিনের গ্রেস সময় প্রযোজ্য।',
    'detail.deletionBanner': 'মুছে ফেলার অনুরোধ চলমান — গ্রেস সময় শেষ হবে {date} তারিখে।',
    'edit.title': 'সদস্যের তথ্য সম্পাদনা', 'edit.nameBn': 'নাম (বাংলা)',
    'edit.nameEn': 'নাম (English)', 'edit.phone': 'মোবাইল নম্বর',
    'edit.phoneHint': 'মোবাইল নম্বর বদলালে সুপার অ্যাডমিনের পুনঃযাচাই প্রয়োজন।', 'edit.area': 'এলাকা',
    'edit.type': 'ধরন', 'edit.donor': 'রক্তদানে আগ্রহী',
    'edit.savedToast': 'সদস্যের তথ্য সংরক্ষিত হয়েছে।', 'edit.errName': 'নাম লিখতে হবে।',
    'edit.errPhone': 'সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন (01 দিয়ে শুরু)।'
  },
  en: {
    'list.title': 'Members', 'list.subtitle': 'Community member list and application review.',
    'list.pendingTitle': 'Member Approvals',
    'list.pendingNote': 'Review pending applications to approve or reject. Approval issues a member ID.',
    'list.searchPh': 'Search name, phone or member ID', 'list.statusAll': 'All statuses',
    'list.status.pending': 'Pending', 'list.status.approved': 'Approved',
    'list.status.rejected': 'Rejected', 'list.status.suspended': 'Suspended',
    'list.typeAll': 'All types', 'list.type.resident': 'Resident',
    'list.type.expat': 'Expatriate', 'list.type.student': 'Student',
    'list.areaAll': 'All areas', 'list.sortNewest': 'Newest first',
    'list.sortOldest': 'Oldest first', 'list.sortName': 'By name', 'list.colName': 'Name', 'list.colId': 'Member ID',
    'list.colPhone': 'Phone', 'list.colArea': 'Area', 'list.colType': 'Type', 'list.colStatus': 'Status',
    'list.colApplied': 'Applied on', 'list.countTotal': 'Total',
    'list.countPending': 'Pending', 'list.countApproved': 'Approved',
    'list.countRejected': 'Rejected', 'list.countSuspended': 'Suspended',
    'list.prev': 'Previous page', 'list.next': 'Next page',
    'list.noId': 'Issued on approval', 'detail.back': 'Back to member list',
    'detail.tabProfile': 'Profile', 'detail.tabFamily': 'Family',
    'detail.tabRequests': 'Request history', 'detail.tabActivity': 'Activity',
    'detail.personal': 'Personal details', 'detail.kName': 'Name',
    'detail.kId': 'Member ID', 'detail.kPhone': 'Phone (detail view)', 'detail.kArea': 'Area', 'detail.kType': 'Type',
    'detail.kHousehold': 'Household',
    'detail.kStatus': 'Membership status', 'detail.kApplied': 'Applied on',
    'detail.kDonor': 'Blood donor opt-in', 'detail.kAge': 'Age band',
    'detail.kVisibility': 'Visibility and consent', 'detail.donorYes': 'Yes',
    'detail.donorNo': 'No', 'detail.rejectionReason': 'Rejection reason',
    'detail.suspensionReason': 'Suspension reason', 'detail.familyTitle': 'Family / household',
    'detail.familyNote': 'Family members can be added or edited.',
    'detail.familyHouseholdNote': 'See this member’s household record:',
    'detail.familyEmpty': 'No family members recorded.', 'detail.familyName': 'Name',
    'detail.familyRelation': 'Relation', 'detail.familyAdd': 'Add family member',
    'detail.familyAdded': 'Family member added.', 'detail.reqTitle': 'Expatriate support requests',
    'detail.reqNote': 'Demo requests carry no member-account link; they are matched on phone number.',
    'detail.reqEmpty': 'No requests found for this member.', 'detail.colReq': 'Request number',
    'detail.colService': 'Service', 'detail.colDate': 'Date',
    'detail.actTitle': 'Member-related activity', 'detail.actEmpty': 'No log entries for this member.',
    'detail.colAction': 'Action', 'detail.colChange': 'Change',
    'detail.colActor': 'Actor', 'detail.approve': 'Approve', 'detail.reject': 'Reject', 'detail.suspend': 'Suspend',
    'detail.reinstate': 'Reinstate', 'detail.edit': 'Edit details',
    'detail.deleteRequest': 'Account deletion request', 'detail.approveTitle': 'Approve member',
    'detail.approveBody': '{name} ({phone}) will be approved as a member. Approval issues a unique member ID and enables login. This action is written to the audit log.',
    'detail.approvedToast': 'Member approved. A member ID has been issued.',
    'detail.rejectTitle': 'Reject application',
    'detail.rejectBody': 'The application from {name} ({phone}) will be rejected. The reason will be shown to the applicant. A rejected applicant may apply again.',
    'detail.reasonLabel': 'Reason (required)', 'detail.reasonHint': 'Write at least 10 characters.',
    'detail.reasonShort': 'The reason must be at least 10 characters.',
    'detail.rejectedToast': 'Application rejected.', 'detail.suspendTitle': 'Suspend membership',
    'detail.suspendBody': 'The membership of {name} ({phone}) will be suspended. Suspension revokes all of the member\u2019s sessions immediately.',
    'detail.suspendedToast': 'Membership suspended.', 'detail.reinstateTitle': 'Reinstate membership',
    'detail.reinstateBody': 'The membership of {name} ({phone}) will be active again.',
    'detail.reinstatedToast': 'Membership reinstated.', 'detail.deleteTitle': 'Account deletion request',
    'detail.deleteBody': 'A deletion request will be recorded for {name}. A 30-day grace period applies from the request date; where finance or request records exist, the data is anonymised instead of deleted.',
    'detail.deleteToast': 'Deletion request recorded. A 30-day grace period applies.',
    'detail.deletionBanner': 'Deletion request in progress — grace period ends {date}.',
    'edit.title': 'Edit member details', 'edit.nameBn': 'Name (Bengali)',
    'edit.nameEn': 'Name (English)', 'edit.phone': 'Phone number',
    'edit.phoneHint': 'Changing the phone number requires Super Admin re-verification.', 'edit.area': 'Area',
    'edit.type': 'Type', 'edit.donor': 'Interested in blood donation',
    'edit.savedToast': 'Member details saved.', 'edit.errName': 'A name is required.',
    'edit.errPhone': 'Enter a valid 11-digit phone number starting with 01.'
  }
};
registerStrings('members', STRINGS);

// Column keys that the shared table sort may order by (?sort=&dir=). The
// legacy sort <select> (newest/oldest/name) still works and clears any
// column sort when it changes.
const LIST_SORT_KEYS = ['name_bn', 'member_id', 'status', 'created_at'];

export const Members = {
  route: '#/members',
  title: { bn: 'সদস্য', en: 'Members' },
  breadcrumb: ['nav.dashboard', 'nav.members'],
  roles: ['super-admin'],
  permissions: ['members.view'],
  render(ctx){
    if(ctx.path.endsWith('/edit')) return editHtml(ctx);
    if(ctx.params.id) return detailHtml(ctx);
    return listHtml(ctx);
  },
  onMount(ctx){
    bindTableRows(document.getElementById('view'));
    const view = document.getElementById('view');
    if(!view) return;
    const go = qs => { location.hash = '#/members' + qs; };
    bindTableSort(view, (key, dir) => {
      // On a detail page the sort stays on that member (tab preserved via query).
      const base = ctx.params.id ? '#/members/' + ctx.params.id : '#/members';
      location.hash = base + buildQuery(ctx, { sort: key, dir, page: 1 });
    });
    const q = view.querySelector('[data-m-q]');
    if(q) q.addEventListener('change', () => go(buildQuery(ctx, { q: q.value, page: 1 })));
    const st = view.querySelector('[data-m-status]');
    if(st) st.addEventListener('change', () => go(buildQuery(ctx, { status: st.value, page: 1 })));
    const ty = view.querySelector('[data-m-type]');
    if(ty) ty.addEventListener('change', () => go(buildQuery(ctx, { type: ty.value, page: 1 })));
    const ar = view.querySelector('[data-m-area]');
    if(ar) ar.addEventListener('change', () => go(buildQuery(ctx, { area: ar.value, page: 1 })));
    const so = view.querySelector('[data-m-sort]');
    if(so) so.addEventListener('change', () => go(buildQuery(ctx, { sort: so.value, dir: '', page: 1 })));
    const pp = view.querySelector('[data-per-page]');
    if(pp) pp.addEventListener('change', () => go(buildQuery(ctx, { per: pp.value, page: 1 })));
    view.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', () => handleAction(ctx, b.dataset.action)));
    const form = view.querySelector('#member-edit-form');
    if(form) form.addEventListener('submit', e => { e.preventDefault(); saveEdit(ctx); });
    const fam = view.querySelector('#family-add-form');
    if(fam) fam.addEventListener('submit', e => {
      e.preventDefault();
      const m = findMember(ctx.params.id);
      const name = view.querySelector('#fam-name').value.trim();
      const rel = view.querySelector('#fam-relation').value.trim();
      if(!m || !validateRequired(name) || !validateRequired(rel)) return;
      m.family.push({ name_bn: name, relation_bn: rel });
      writeAudit(ctx.user.id, ctx.role, 'member.family.add', 'member', m.member_id || m.id, null, name);
      ctx.rerender();
      ctx.toast(t('members.detail.familyAdded'));
    });
  },
  onUnmount(){}
};

function findMember(id){ return store.members.find(m => m.id === id); }
function buildQuery(ctx, patch){ return buildQueryString(ctx.query, patch); }
function tableSort(ctx, keys){
  const k = ctx.query.sort, d = ctx.query.dir;
  return k && keys.includes(k) && (d === 'asc' || d === 'desc') ? { key: k, dir: d } : null;
}
function typeLabel(m){
  if(m.type === 'expat') return t('members.list.type.expat');
  if(m.type === 'student') return t('members.list.type.student');
  return t('members.list.type.resident');
}
function nameOf(m){ const lang = getLang(); return lang === 'bn' ? m.name_bn : (m.name_en || m.name_bn); }
function householdOf(m){ return m.household_id ? store.households.find(h => h.id === m.household_id) : null; }

function listHtml(ctx){
  const lang = getLang();
  const pendingOnly = ctx.query.status === 'pending';
  let rows = filterList(store.members, { q: ctx.query.q || '', fields: ['name_bn', 'name_en', 'phone', 'member_id'] });
  if(ctx.query.status) rows = rows.filter(m => m.status === ctx.query.status);
  if(ctx.query.type) rows = rows.filter(m => m.type === ctx.query.type);
  if(ctx.query.area) rows = rows.filter(m => m.area === ctx.query.area);
  const colSort = tableSort(ctx, LIST_SORT_KEYS);
  const sort = ctx.query.sort || 'newest';
  if(!colSort) rows.sort((a, b) => sort === 'oldest' ? a.created_at.localeCompare(b.created_at)
    : sort === 'name' ? nameOf(a).localeCompare(nameOf(b)) : b.created_at.localeCompare(a.created_at));
  const page = parseInt(ctx.query.page, 10) || 1;
  const per = Math.min(parseInt(ctx.query.per, 10) || 20, 50);
  const pages = Math.max(Math.ceil(rows.length / per), 1);
  const areas = [...new Set(store.members.map(m => m.area))];
  const c = s => store.members.filter(m => m.status === s).length;
  const chip = (value, label) => `<a class="chip" href="#/members${buildQuery(ctx, { status: value, page: 1 })}" aria-pressed="${(ctx.query.status || '') === value}">${label}</a>`;
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${pendingOnly ? t('members.list.pendingTitle') : t('members.list.title')}</h1>
  <p class="sub">${pendingOnly ? t('members.list.pendingNote') : t('members.list.subtitle')}</p></div></div>
  ${statGrid([
    { href: '#/members', num: fmtNum(store.members.length, lang), label: t('members.list.countTotal') },
    { href: '#/members?status=pending', num: fmtNum(c('pending'), lang), label: t('members.list.countPending') },
    { href: '#/members?status=approved', num: fmtNum(c('approved'), lang), label: t('members.list.countApproved') },
    { href: '#/members?status=rejected', num: fmtNum(c('rejected'), lang), label: t('members.list.countRejected') },
    { href: '#/members?status=suspended', num: fmtNum(c('suspended'), lang), label: t('members.list.countSuspended') }
  ])}
  <div class="filters mt-4" role="search">
    <input class="input search-box" type="search" data-m-q value="${esc(ctx.query.q || '')}" placeholder="${esc(t('members.list.searchPh'))}" aria-label="${esc(t('members.list.searchPh'))}">
    ${chip('', t('members.list.statusAll'))}${chip('pending', t('members.list.status.pending'))}${chip('approved', t('members.list.status.approved'))}${chip('rejected', t('members.list.status.rejected'))}${chip('suspended', t('members.list.status.suspended'))}
    <select class="input" data-m-type aria-label="${esc(t('members.list.colType'))}">
      <option value="">${t('members.list.typeAll')}</option>
      <option value="resident"${ctx.query.type === 'resident' ? ' selected' : ''}>${t('members.list.type.resident')}</option>
      <option value="expat"${ctx.query.type === 'expat' ? ' selected' : ''}>${t('members.list.type.expat')}</option>
      <option value="student"${ctx.query.type === 'student' ? ' selected' : ''}>${t('members.list.type.student')}</option>
    </select>
    <select class="input" data-m-area aria-label="${esc(t('members.list.colArea'))}">
      <option value="">${t('members.list.areaAll')}</option>
      ${areas.map(a => `<option${ctx.query.area === a ? ' selected' : ''}>${esc(a)}</option>`).join('')}
    </select>
    <select class="input" data-m-sort aria-label="${esc(t('members.list.sortNewest'))}">
      <option value="newest"${sort === 'newest' ? ' selected' : ''}>${t('members.list.sortNewest')}</option>
      <option value="oldest"${sort === 'oldest' ? ' selected' : ''}>${t('members.list.sortOldest')}</option>
      <option value="name"${sort === 'name' ? ' selected' : ''}>${t('members.list.sortName')}</option>
    </select>
  </div>
  <section class="card mt-4">${renderTable({ columns: [
    { key: 'name_bn', label: t('members.list.colName'), sortable: true, render: m => `<strong>${esc(nameOf(m))}</strong>` },
    { key: 'member_id', label: t('members.list.colId'), sortable: true, render: m => m.member_id ? `<span class="num">${esc(m.member_id)}</span>` : `<span class="muted small">${t('members.list.noId')}</span>` },
    { key: 'phone', label: t('members.list.colPhone'), render: m => `<span class="num">${fmtPhoneMasked(m.phone)}</span>` },
    { key: 'area', label: t('members.list.colArea'), render: m => esc(m.area) },
    { key: 'type', label: t('members.list.colType'), render: m => typeLabel(m) },
    { key: 'status', label: t('members.list.colStatus'), sortable: true, render: m => badge(m.status, t('members.list.status.' + m.status)) },
    { key: 'created_at', label: t('members.list.colApplied'), sortable: true, render: m => fmtDate(m.created_at, lang) }
  ], rows, page, perPage: per, onRowClick: m => '#/members/' + m.id, stacked: true, sort: colSort })}
  <div class="pagination">
    ${page > 1 ? `<a class="btn btn-secondary btn-sm" href="#/members${buildQuery(ctx, { page: page - 1 })}">${t('members.list.prev')}</a>` : `<span class="muted small">${t('members.list.prev')}</span>`}
    ${page < pages ? `<a class="btn btn-secondary btn-sm" href="#/members${buildQuery(ctx, { page: page + 1 })}">${t('members.list.next')}</a>` : `<span class="muted small">${t('members.list.next')}</span>`}
  </div></section>`;
}

function detailHtml(ctx){
  const lang = getLang();
  const m = findMember(ctx.params.id);
  if(!m) return notFoundHtml();
  const tab = ctx.query.tab || 'profile';
  const tabLink = tb => `#/members/${m.id}?tab=${tb}`;
  const tabBtn = (tb, label) => `<a class="chip" href="${tabLink(tb)}" aria-pressed="${tab === tb}">${label}</a>`;
  let body = '';
  if(tab === 'family') body = familyHtml(ctx, m);
  else if(tab === 'requests') body = requestsHtml(ctx, m);
  else if(tab === 'activity') body = activityHtml(ctx, m);
  else body = profileHtml(ctx, m);
  const actions = [];
  if(m.status === 'pending'){
    actions.push(`<button type="button" class="btn btn-primary btn-block" data-action="approve">${t('members.detail.approve')}</button>`);
    actions.push(`<button type="button" class="btn btn-danger btn-block" data-action="reject">${t('members.detail.reject')}</button>`);
  }
  if(m.status === 'approved') actions.push(`<button type="button" class="btn btn-danger btn-block" data-action="suspend">${t('members.detail.suspend')}</button>`);
  if(m.status === 'suspended') actions.push(`<button type="button" class="btn btn-primary btn-block" data-action="reinstate">${t('members.detail.reinstate')}</button>`);
  actions.push(`<a class="btn btn-secondary btn-block" href="#/members/${m.id}/edit">${t('members.detail.edit')}</a>`);
  actions.push(`<button type="button" class="btn btn-ghost btn-block" data-action="delete-request">${t('members.detail.deleteRequest')}</button>`);
  return `<span class="demo-badge">${t('app.demo')}</span>
  <p><a class="link-more" href="#/members">${t('members.detail.back')}</a></p>
  <div class="view-head"><div><h1>${esc(nameOf(m))}</h1>
  <p class="sub">${m.member_id ? `<span class="num">${esc(m.member_id)}</span>` : t('members.list.noId')} · ${badge(m.status, t('members.list.status.' + m.status))}</p></div></div>
  ${m.deletion_requested_at ? `<div class="banner" role="alert"><span>${esc(t('members.detail.deletionBanner').replace('{date}', fmtDate(m.deletion_grace_until, lang)))}</span></div>` : ''}
  <div class="filters" role="tablist">${tabBtn('profile', t('members.detail.tabProfile'))}${tabBtn('family', t('members.detail.tabFamily'))}${tabBtn('requests', t('members.detail.tabRequests'))}${tabBtn('activity', t('members.detail.tabActivity'))}</div>
  <div class="detail-grid mt-4"><div>${body}</div>
  <aside class="card"><h3>${t('members.detail.kStatus')}</h3><p class="mt-4">${badge(m.status, t('members.list.status.' + m.status))}</p>
  <div class="mt-4">${actions.join('')}</div></aside></div>`;
}

function profileHtml(ctx, m){
  const lang = getLang();
  const hh = householdOf(m);
  const kv = (k, v) => `<dt>${k}</dt><dd>${v}</dd>`;
  return `<section class="card"><h3>${t('members.detail.personal')}</h3><dl class="kv mt-4">
  ${kv(t('members.detail.kName'), esc(nameOf(m)) + (lang === 'bn' && m.name_en ? `<br><span class="small muted">${esc(m.name_en)}</span>` : ''))}
  ${kv(t('members.detail.kId'), m.member_id ? `<span class="num">${esc(m.member_id)}</span>` : `<span class="muted">${t('members.list.noId')}</span>`)}
  ${kv(t('members.detail.kPhone'), `<span class="num">${fmtPhoneFull(m.phone)}</span>`)}
  ${kv(t('members.detail.kArea'), esc(m.area))}
  ${kv(t('members.detail.kType'), typeLabel(m))}
  ${hh ? kv(t('members.detail.kHousehold'), `<a href="#/households/${hh.id}">${esc(lang === 'bn' ? hh.name_bn : (hh.name_en || hh.name_bn))}</a>`) : ''}
  ${kv(t('members.detail.kStatus'), badge(m.status, t('members.list.status.' + m.status)))}
  ${kv(t('members.detail.kApplied'), fmtDate(m.created_at, lang))}
  ${kv(t('members.detail.kDonor'), m.donor_opt_in ? t('members.detail.donorYes') : t('members.detail.donorNo'))}
  ${kv(t('members.detail.kAge'), `<span class="muted">${t('common.updating')}</span>`)}
  ${kv(t('members.detail.kVisibility'), `<span class="muted">${t('common.updating')}</span>`)}
  ${m.rejection_reason_bn ? kv(t('members.detail.rejectionReason'), esc(m.rejection_reason_bn)) : ''}
  ${m.suspension_reason ? kv(t('members.detail.suspensionReason'), esc(m.suspension_reason)) : ''}
  </dl></section>`;
}

function familyHtml(ctx, m){
  const lang = getLang();
  const hh = householdOf(m);
  return `<section class="card"><h3>${t('members.detail.familyTitle')}</h3>
  <p class="small muted mt-4">${t('members.detail.familyNote')}</p>
  ${hh ? `<p class="small mt-4">${t('members.detail.familyHouseholdNote')} <a href="#/households/${hh.id}">${esc(lang === 'bn' ? hh.name_bn : (hh.name_en || hh.name_bn))}</a></p>` : ''}
  ${m.family.length ? `<ul class="mt-4">${m.family.map(f => `<li class="list-row"><div class="grow"><strong>${esc(f.name_bn)}</strong><br><span class="small muted">${esc(f.relation_bn)}</span></div></li>`).join('')}</ul>` : emptyState(t('members.detail.familyEmpty'))}
  <form id="family-add-form" class="mt-6">
    ${field({ id: 'fam-name', label: t('members.detail.familyName'), required: true })}
    ${field({ id: 'fam-relation', label: t('members.detail.familyRelation'), required: true })}
    <button type="submit" class="btn btn-primary">${t('members.detail.familyAdd')}</button>
  </form></section>`;
}

function requestsHtml(ctx, m){
  const lang = getLang();
  const reqs = store.service_requests.filter(r => r.applicant_phone === m.phone);
  return `<section class="card"><h3>${t('members.detail.reqTitle')}</h3>
  <p class="small muted mt-4">${t('members.detail.reqNote')}</p>
  ${reqs.length ? renderTable({ columns: [
    { key: 'request_no', label: t('members.detail.colReq'), sortable: true, render: r => `<span class="num">${esc(r.request_no)}</span>` },
    { key: 'service_name_bn', label: t('members.detail.colService'), render: r => esc(r.service_name_bn) },
    { key: 'status', label: t('members.list.colStatus'), sortable: true, render: r => badge(r.status) },
    { key: 'created_at', label: t('members.detail.colDate'), sortable: true, render: r => fmtDate(r.created_at, lang) }
  ], rows: reqs, page: 1, perPage: 20, onRowClick: r => '#/expatriate/' + r.request_no, stacked: true, sort: tableSort(ctx, ['request_no', 'status', 'created_at']) }) : emptyState(t('members.detail.reqEmpty'))}</section>`;
}

function activityHtml(ctx, m){
  const lang = getLang();
  const rows = store.activity_log.filter(a => a.subject_id === m.id || a.subject_id === m.member_id);
  return `<section class="card"><h3>${t('members.detail.actTitle')}</h3>
  ${rows.length ? renderTable({ columns: [
    { key: 'action', label: t('members.detail.colAction'), sortable: true, render: a => esc(a.action) },
    { key: 'change', label: t('members.detail.colChange'), render: a => `${esc(a.old_value ?? '—')} → ${esc(a.new_value ?? '—')}` },
    { key: 'actor', label: t('members.detail.colActor'), render: a => esc(a.actor_role) },
    { key: 'created_at', label: t('members.detail.colDate'), sortable: true, render: a => fmtDate(a.created_at, lang) }
  ], rows, page: 1, perPage: 20, stacked: true, sort: tableSort(ctx, ['action', 'created_at']) }) : emptyState(t('members.detail.actEmpty'))}</section>`;
}

function editHtml(ctx){
  const m = findMember(ctx.params.id);
  if(!m) return notFoundHtml();
  return `<span class="demo-badge">${t('app.demo')}</span>
  <p><a class="link-more" href="#/members/${m.id}">${t('members.detail.back')}</a></p>
  <div class="view-head"><div><h1>${t('members.edit.title')}</h1><p class="sub">${esc(nameOf(m))}</p></div></div>
  <form id="member-edit-form" class="card" novalidate><div id="edit-errors"></div>
    ${field({ id: 'e-name-bn', label: t('members.edit.nameBn'), value: m.name_bn, required: true })}
    ${field({ id: 'e-name-en', label: t('members.edit.nameEn'), value: m.name_en || '' })}
    ${field({ id: 'e-phone', label: t('members.edit.phone'), value: m.phone, required: true, hint: t('members.edit.phoneHint'), attrs: 'inputmode="tel"' })}
    ${field({ id: 'e-area', label: t('members.edit.area'), value: m.area, required: true })}
    ${field({ id: 'e-type', label: t('members.edit.type'), value: m.type, options: [
      { value: 'resident', label: t('members.list.type.resident') },
      { value: 'expat', label: t('members.list.type.expat') },
      { value: 'student', label: t('members.list.type.student') }
    ] })}
    <div class="field"><label><input type="checkbox" id="e-donor"${m.donor_opt_in ? ' checked' : ''}> ${t('members.edit.donor')}</label></div>
    <div class="row"><button type="submit" class="btn btn-primary">${t('common.save')}</button>
    <a class="btn btn-secondary" href="#/members/${m.id}">${t('common.cancel')}</a></div>
  </form>`;
}

function saveEdit(ctx){
  const m = findMember(ctx.params.id);
  const view = document.getElementById('view');
  const nameBn = view.querySelector('#e-name-bn').value.trim();
  const phone = view.querySelector('#e-phone').value.trim();
  const errors = [];
  if(!validateRequired(nameBn)) errors.push({ id: 'e-name-bn', message: t('members.edit.errName') });
  if(!/^01[0-9]{9}$/.test(phone)) errors.push({ id: 'e-phone', message: t('members.edit.errPhone') });
  const box = view.querySelector('#edit-errors');
  if(errors.length){
    box.innerHTML = errorSummary(errors);
    const s = box.querySelector('.error-summary'); if(s) s.focus();
    return;
  }
  const old = m.status;
  m.name_bn = nameBn;
  m.name_en = view.querySelector('#e-name-en').value.trim();
  m.phone = phone;
  m.area = view.querySelector('#e-area').value.trim();
  m.type = view.querySelector('#e-type').value;
  m.donor_opt_in = view.querySelector('#e-donor').checked;
  writeAudit(ctx.user.id, ctx.role, 'member.update', 'member', m.member_id || m.id, old, m.status);
  location.hash = '#/members/' + m.id;
  ctx.toast(t('members.edit.savedToast'));
}

function nextMemberId(){
  let max = 0;
  for(const m of store.members){
    const n = m.member_id ? parseInt(m.member_id.slice(-4), 10) : 0;
    if(n > max) max = n;
  }
  return 'MB-2026-' + String(max + 1).padStart(4, '0');
}

function reasonModal(ctx, { titleKey, bodyHtml, confirmKey, onConfirm }){
  let reason = '';
  ctx.modal({
    title: t(titleKey),
    body: bodyHtml + `<div class="mt-4">${field({ id: 'm-reason', type: 'textarea', label: t('members.detail.reasonLabel'), hint: t('members.detail.reasonHint'), rows: 3 })}</div>`,
    confirmLabel: t(confirmKey),
    danger: true,
    onConfirm: () => { if(reason.trim().length >= 10) onConfirm(reason.trim()); else ctx.toast(t('members.detail.reasonShort')); }
  });
  const ta = document.getElementById('m-reason');
  const cb = document.querySelector('[data-modal-confirm]');
  if(cb) cb.disabled = true;
  if(ta) ta.addEventListener('input', () => { reason = ta.value; if(cb) cb.disabled = reason.trim().length < 10; });
}

function handleAction(ctx, action){
  const m = findMember(ctx.params.id);
  if(!m) return;
  const body = key => `<p>${t(key).replace('{name}', esc(nameOf(m))).replace('{phone}', fmtPhoneMasked(m.phone))}</p>`;
  if(action === 'approve'){
    const id = nextMemberId();
    ctx.modal({
      title: t('members.detail.approveTitle'),
      body: body('members.detail.approveBody') + `<p class="mt-4"><strong>${t('members.detail.kId')}:</strong> <span class="num">${id}</span></p>`,
      confirmLabel: t('members.detail.approve'),
      onConfirm: () => {
        m.status = 'approved'; m.member_id = id;
        writeAudit(ctx.user.id, ctx.role, 'member.approve', 'member', id, 'pending', 'approved');
        ctx.rerender();
        ctx.toast(t('members.detail.approvedToast'));
      }
    });
  }
  if(action === 'reject'){
    reasonModal(ctx, { titleKey: 'members.detail.rejectTitle', bodyHtml: body('members.detail.rejectBody'), confirmKey: 'members.detail.reject',
      onConfirm: reason => {
        m.status = 'rejected'; m.rejection_reason_bn = reason;
        writeAudit(ctx.user.id, ctx.role, 'member.reject', 'member', m.id, 'pending', 'rejected');
        ctx.rerender();
        ctx.toast(t('members.detail.rejectedToast'));
      } });
  }
  if(action === 'suspend'){
    reasonModal(ctx, { titleKey: 'members.detail.suspendTitle', bodyHtml: body('members.detail.suspendBody'), confirmKey: 'members.detail.suspend',
      onConfirm: reason => {
        m.status = 'suspended'; m.suspension_reason = reason;
        writeAudit(ctx.user.id, ctx.role, 'member.suspend', 'member', m.member_id || m.id, 'approved', 'suspended');
        ctx.rerender();
        ctx.toast(t('members.detail.suspendedToast'));
      } });
  }
  if(action === 'reinstate'){
    ctx.modal({
      title: t('members.detail.reinstateTitle'),
      body: body('members.detail.reinstateBody'),
      confirmLabel: t('members.detail.reinstate'),
      onConfirm: () => {
        m.status = 'approved'; m.suspension_reason = null;
        writeAudit(ctx.user.id, ctx.role, 'member.reinstate', 'member', m.member_id || m.id, 'suspended', 'approved');
        ctx.rerender();
        ctx.toast(t('members.detail.reinstatedToast'));
      }
    });
  }
  if(action === 'delete-request'){
    ctx.modal({
      title: t('members.detail.deleteTitle'),
      body: body('members.detail.deleteBody'),
      confirmLabel: t('members.detail.deleteRequest'),
      danger: true,
      onConfirm: () => {
        const at = new Date();
        m.deletion_requested_at = at.toISOString();
        m.deletion_grace_until = new Date(at.getTime() + 30 * 86400000).toISOString();
        writeAudit(ctx.user.id, ctx.role, 'member.delete.request', 'member', m.member_id || m.id, m.status, 'deletion-requested');
        ctx.rerender();
        ctx.toast(t('members.detail.deleteToast'));
      }
    });
  }
}
