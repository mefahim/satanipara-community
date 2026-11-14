// audit.js — Audit log: view + filter only. The log is IMMUTABLE (append-only):
// there is no delete, edit or truncate action anywhere in this view, by design.
// Only ~10 demo rows are seeded (the audit brief said ~25 — reported as a gap).
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store, filterList } from '../js/lib/store.js';
import { fmtDateTime, fmtNum, esc } from '../js/lib/format.js';
import { renderTable, bindTableRows, bindTableSort } from '../js/components/table.js';
import { actionLabel } from '../js/lib/action-label.js';
import { renderFilters, bindFilters } from '../js/components/filters.js';
import { emptyState } from '../js/components/states.js';
import { statGrid } from '../js/components/stat.js';
const STRINGS = {
bn: {
'title':'অডিট লগ', 'crumbDetail':'অডিট বিবরণ', 'list.title':'অডিট লগ', 'list.note':'প্রতিটি গুরুত্বপূর্ণ কাজের রেকর্ড — কে, কী, কখন, কোন রেকর্ডে। এই লগ অপরিবর্তনীয়: কোনো সারি মোছা বা বদলানো যায় না।',
'list.seedNote':'ডেমো তথ্যে ১০টি সারি আছে।', 'filter.all':'সব',
'stat.total':'মোট রেকর্ড', 'stat.login':'লগইন', 'stat.finance':'অর্থ', 'stat.member':'সদস্য',
'group.login':'লগইন', 'group.member':'সদস্য', 'group.request':'প্রবাসী অনুরোধ', 'group.finance':'অর্থ', 'group.blood':'রক্ত', 'group.export':'এক্সপোর্ট', 'group.settings':'সেটিংস', 'group.message':'বার্তা', 'group.other':'অন্যান্য',
'col.time':'সময়', 'col.actor':'কার্যকরী', 'col.action':'কাজ', 'col.subject':'রেকর্ড', 'col.change':'পরিবর্তন',
'detail.actor':'কার্যকরী', 'detail.role':'ভূমিকা', 'detail.action':'কাজ', 'detail.subject':'রেকর্ড', 'detail.subjectType':'রেকর্ডের ধরন',
'detail.old':'আগের মান', 'detail.new':'নতুন মান', 'detail.ip':'আইপি', 'detail.time':'সময়', 'detail.none':'—',
'detail.immutable':'এই লগ অপরিবর্তনীয় — কোনো সারি মোছা, বদলানো বা খালি করা যায় না।', 'back.list':'তালিকায় ফিরুন',
'action.login':'লগইন', 'action.member.approve':'সদস্য অনুমোদন', 'action.member.reject':'সদস্য প্রত্যাখ্যান', 'action.member.suspend':'সদস্য স্থগিত', 'action.member.reinstate':'সদস্য পুনর্বহাল', 'action.member.update':'সদস্য হালনাগাদ', 'action.member.family.add':'পরিবারের সদস্য যোগ', 'action.member.delete.request':'সদস্য মোছার অনুরোধ',
'action.request.transition':'অনুরোধের অবস্থা পরিবর্তন', 'action.request.complete':'অনুরোধ সম্পন্ন', 'action.expatriate.assign':'সহায়ক নিয়োগ', 'action.expatriate.claim':'অনুরোধ গ্রহণ', 'action.expatriate.expense':'ব্যয় যোগ', 'action.expatriate.note':'নোট যোগ', 'action.expatriate.transition':'অনুরোধের অবস্থা পরিবর্তন',
'action.finance.create':'লেজার খসড়া তৈরি', 'action.finance.edit':'লেজার খসড়া সম্পাদনা', 'action.finance.publish':'লেজার প্রকাশ', 'action.finance.reject':'লেজার প্রত্যাখ্যান', 'action.finance.discard':'খসড়া বাতিল', 'action.finance.reversal.create':'বিপরীত এন্ট্রির খসড়া তৈরি', 'action.finance.reversal.publish':'বিপরীত এন্ট্রি প্রকাশ', 'action.finance.reverse.approve':'বিপরীত এন্ট্রি অনুমোদন', 'action.finance.report.prepare':'বার্ষিক প্রতিবেদন প্রস্তুত', 'action.finance.report.publish':'বার্ষিক প্রতিবেদন প্রকাশ', 'action.finance.report.reject':'বার্ষিক প্রতিবেদন প্রত্যাখ্যান',
'action.blood.consent.grant':'রক্তদাতার সম্মতি প্রদান', 'action.blood.consent.requested':'রক্তদাতার সম্মতি চাওয়া', 'action.blood.consent.revoke':'রক্তদাতার সম্মতি প্রত্যাহার', 'action.blood.phone.reveal':'রক্তদাতার নম্বর প্রকাশ', 'action.blood.request.cancelled':'রক্তের অনুরোধ বাতিল', 'action.blood.request.fulfilled':'রক্তের অনুরোধ পূরণ',
'action.content.create':'কনটেন্ট তৈরি', 'action.content.update':'কনটেন্ট হালনাগাদ', 'action.content.verify':'চাকরির বিজ্ঞপ্তি যাচাই', 'action.content.to-review':'পর্যালোচনায় পাঠানো', 'action.content.publish':'কনটেন্ট প্রকাশ', 'action.content.unpublish':'প্রকাশনা প্রত্যাহার', 'action.content.archive':'কনটেন্ট আর্কাইভ',
'action.household.create':'পরিবার তৈরি', 'action.household.update':'পরিবার হালনাগাদ', 'action.household.archive':'পরিবার আর্কাইভ', 'action.household.unarchive':'পরিবার আর্কাইভ থেকে ফেরানো',
'action.directory.create':'ডিরেক্টরি এন্ট্রি তৈরি', 'action.directory.update':'ডিরেক্টরি হালনাগাদ', 'action.directory.archive':'ডিরেক্টরি আর্কাইভ', 'action.directory.unarchive':'ডিরেক্টরি আর্কাইভ থেকে ফেরানো', 'action.directory.visibility':'দৃশ্যমানতা পরিবর্তন',
'action.activities.create':'কার্যক্রম তৈরি', 'action.activities.update':'কার্যক্রম হালনাগাদ', 'action.achievement.create':'অর্জন তৈরি', 'action.achievement.update':'অর্জন হালনাগাদ', 'action.achievement.archive':'অর্জন আর্কাইভ', 'action.achievement.unarchive':'অর্জন আর্কাইভ থেকে ফেরানো',
'action.milestone.create':'মাইলফলক তৈরি', 'action.milestone.update':'মাইলফলক হালনাগাদ', 'action.milestone.publish':'মাইলফলক প্রকাশ', 'action.milestone.unpublish':'মাইলফলক প্রকাশনা প্রত্যাহার', 'action.milestone.archive':'মাইলফলক আর্কাইভ', 'action.milestone.unarchive':'মাইলফলক আর্কাইভ থেকে ফেরানো',
'action.constitution.create':'গঠনতন্ত্রের সংস্করণ তৈরি', 'action.constitution.set_current':'গঠনতন্ত্রের বর্তমান সংস্করণ নির্ধারণ', 'action.committee.add':'কমিটি সদস্য যোগ', 'action.committee.remove':'কমিটি সদস্য অপসারণ',
'action.user.create':'ব্যবহারকারী তৈরি', 'action.user.update':'ব্যবহারকারী হালনাগাদ', 'action.user.activate':'ব্যবহারকারী সক্রিয়', 'action.user.suspend':'ব্যবহারকারী স্থগিত', 'action.user.role.change':'ভূমিকা পরিবর্তন', 'action.user.password.reset':'পাসওয়ার্ড রিসেট',
'action.settings.change':'সেটিংস পরিবর্তন', 'action.message.read':'বার্তা পড়া', 'action.message.reply':'বার্তার উত্তর', 'action.message.resolve':'বার্তা সমাধান', 'action.notifications.mark_all_read':'সব বিজ্ঞপ্তি পঠিত চিহ্নিত',
'action.profile.update':'প্রোফাইল হালনাগাদ', 'action.profile.password.change':'পাসওয়ার্ড পরিবর্তন', 'action.sessions.logout_all':'সব ডিভাইস থেকে লগ আউট',
'action.export.members':'সদস্য তথ্য রপ্তানি', 'action.export.reports':'প্রতিবেদন রপ্তানি',
'action.data_request.start':'তথ্য-অধিকার অনুরোধ শুরু', 'action.data_request.complete':'তথ্য-অধিকার অনুরোধ সম্পন্ন', 'action.data_request.cancel':'তথ্য-অধিকার অনুরোধ বাতিল', 'action.data_request.anonymise':'তথ্য বেনামি করা',
'action.emergency.oncall':'জরুরি সাড়া দলের ডিউটি পরিবর্তন', 'action.service_types.edit':'সেবার ধরন সম্পাদনা', 'action.service_types.toggle':'সেবার ধরন সক্রিয়/নিষ্ক্রিয়',
'action.faq.create':'প্রশ্নোত্তর তৈরি', 'action.faq.update':'প্রশ্নোত্তর হালনাগাদ', 'action.faq.delete':'প্রশ্নোত্তর মোছা', 'action.media.create':'মিডিয়া যোগ', 'action.media.delete':'মিডিয়া মোছা'
},
en: {
'title':'Audit log', 'crumbDetail':'Audit detail', 'list.title':'Audit log', 'list.note':'A record of every important action — who, what, when, on which record. This log is immutable: no row can be deleted or changed.',
'list.seedNote':'The demo data has 10 rows.', 'filter.all':'All',
'stat.total':'Total records', 'stat.login':'Logins', 'stat.finance':'Finance', 'stat.member':'Members',
'group.login':'Login', 'group.member':'Member', 'group.request':'Expatriate request', 'group.finance':'Finance', 'group.blood':'Blood', 'group.export':'Export', 'group.settings':'Settings', 'group.message':'Message', 'group.other':'Other',
'col.time':'Time', 'col.actor':'Actor', 'col.action':'Action', 'col.subject':'Record', 'col.change':'Change',
'detail.actor':'Actor', 'detail.role':'Role', 'detail.action':'Action', 'detail.subject':'Record', 'detail.subjectType':'Record type',
'detail.old':'Old value', 'detail.new':'New value', 'detail.ip':'IP', 'detail.time':'Time', 'detail.none':'—',
'detail.immutable':'This log is immutable — no row can be deleted, changed or truncated.', 'back.list':'Back to list',
'action.login':'Login', 'action.member.approve':'Member approved', 'action.member.reject':'Member rejected', 'action.member.suspend':'Member suspended', 'action.member.reinstate':'Member reinstated', 'action.member.update':'Member updated', 'action.member.family.add':'Family member added', 'action.member.delete.request':'Member deletion requested',
'action.request.transition':'Request status changed', 'action.request.complete':'Request completed', 'action.expatriate.assign':'Helper assigned', 'action.expatriate.claim':'Request claimed', 'action.expatriate.expense':'Expense added', 'action.expatriate.note':'Note added', 'action.expatriate.transition':'Request status changed',
'action.finance.create':'Ledger draft created', 'action.finance.edit':'Ledger draft edited', 'action.finance.publish':'Ledger entry published', 'action.finance.reject':'Ledger entry rejected', 'action.finance.discard':'Draft discarded', 'action.finance.reversal.create':'Reversal draft created', 'action.finance.reversal.publish':'Reversal entry published', 'action.finance.reverse.approve':'Reversal entry approved', 'action.finance.report.prepare':'Annual report prepared', 'action.finance.report.publish':'Annual report published', 'action.finance.report.reject':'Annual report rejected',
'action.blood.consent.grant':'Donor consent granted', 'action.blood.consent.requested':'Donor consent requested', 'action.blood.consent.revoke':'Donor consent revoked', 'action.blood.phone.reveal':'Donor phone revealed', 'action.blood.request.cancelled':'Blood request cancelled', 'action.blood.request.fulfilled':'Blood request fulfilled',
'action.content.create':'Content created', 'action.content.update':'Content updated', 'action.content.verify':'Job circular verified', 'action.content.to-review':'Sent to review', 'action.content.publish':'Content published', 'action.content.unpublish':'Content unpublished', 'action.content.archive':'Content archived',
'action.household.create':'Household created', 'action.household.update':'Household updated', 'action.household.archive':'Household archived', 'action.household.unarchive':'Household restored from archive',
'action.directory.create':'Directory entry created', 'action.directory.update':'Directory entry updated', 'action.directory.archive':'Directory entry archived', 'action.directory.unarchive':'Directory entry restored', 'action.directory.visibility':'Visibility changed',
'action.activities.create':'Activity created', 'action.activities.update':'Activity updated', 'action.achievement.create':'Achievement created', 'action.achievement.update':'Achievement updated', 'action.achievement.archive':'Achievement archived', 'action.achievement.unarchive':'Achievement restored',
'action.milestone.create':'Milestone created', 'action.milestone.update':'Milestone updated', 'action.milestone.publish':'Milestone published', 'action.milestone.unpublish':'Milestone unpublished', 'action.milestone.archive':'Milestone archived', 'action.milestone.unarchive':'Milestone restored',
'action.constitution.create':'Constitution version created', 'action.constitution.set_current':'Current constitution version set', 'action.committee.add':'Committee member added', 'action.committee.remove':'Committee member removed',
'action.user.create':'User created', 'action.user.update':'User updated', 'action.user.activate':'User activated', 'action.user.suspend':'User suspended', 'action.user.role.change':'Role changed', 'action.user.password.reset':'Password reset',
'action.settings.change':'Settings changed', 'action.message.read':'Message read', 'action.message.reply':'Message replied', 'action.message.resolve':'Message resolved', 'action.notifications.mark_all_read':'All notifications marked read',
'action.profile.update':'Profile updated', 'action.profile.password.change':'Password changed', 'action.sessions.logout_all':'Logged out of all devices',
'action.export.members':'Member data exported', 'action.export.reports':'Report exported',
'action.data_request.start':'Data-rights request started', 'action.data_request.complete':'Data-rights request completed', 'action.data_request.cancel':'Data-rights request cancelled', 'action.data_request.anonymise':'Data anonymised',
'action.emergency.oncall':'Emergency team duty changed', 'action.service_types.edit':'Service type edited', 'action.service_types.toggle':'Service type toggled',
'action.faq.create':'FAQ created', 'action.faq.update':'FAQ updated', 'action.faq.delete':'FAQ deleted', 'action.media.create':'Media added', 'action.media.delete':'Media deleted'
}};
registerStrings('audit', STRINGS);
function actionGroup(action){
  if(action.startsWith('login')) return 'login';
  if(action.startsWith('member')) return 'member';
  if(action.startsWith('request')) return 'request';
  if(action.startsWith('finance')) return 'finance';
  if(action.startsWith('blood')) return 'blood';
  if(action.startsWith('export')) return 'export';
  if(action.startsWith('settings')) return 'settings';
  if(action.startsWith('message')) return 'message';
  return 'other';
}
function actorName(id, lang){
  const u = store.users.find(x => x.id === id) || store.members.find(x => x.id === id);
  if(!u) return id;
  return lang === 'bn' ? u.name_bn : u.name_en;
}
function changeText(a){
  const o = a.old_value ?? null, n = a.new_value ?? null;
  if(o === null && n === null) return t('audit.detail.none');
  if(o === null) return '→ ' + String(n);
  if(n === null) return String(o) + ' → —';
  return String(o) + ' → ' + String(n);
}
// D8 / audit D-10: actionLabel now lives in js/lib/action-label.js; re-exported
// here so existing imports keep working.
export { actionLabel } from '../js/lib/action-label.js';
export const Audit = {
  route: '#/audit',
  title: { bn: 'অডিট লগ', en: 'Audit log' },
  breadcrumb: ['nav.dashboard', 'nav.audit'],
  roles: ['super-admin'],
  permissions: ['audit.view'],
  render(ctx){
    const lang = getLang();
    if(ctx.params.id) return detailHtml(ctx, lang);
    return listHtml(ctx, lang);
  },
  onMount(ctx){ bindAudit(ctx); },
  onUnmount(){}
};
function head(title, note){
  return `<span class="demo-badge">${t('app.demo')}</span><div class="view-head"><div><h1>${esc(title)}</h1>${note ? `<p class="sub muted">${esc(note)}</p>` : ''}</div></div>`;
}
function listHtml(ctx, lang){
  const q = ctx.query.q || '', group = ctx.query.group || 'all';
  let rows = filterList(store.activity_log, { q, fields: ['action', 'subject_id', 'subject_type', 'actor'] });
  if(group !== 'all') rows = rows.filter(a => actionGroup(a.action) === group);
  rows = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const groups = ['login', 'member', 'request', 'finance', 'blood', 'export', 'settings', 'message', 'other'];
  const chips = [{ value: 'all', label: t('audit.filter.all') }, ...groups.map(g => ({ value: g, label: t('audit.group.' + g) }))];
  const sort = ctx.query.sort ? { key: ctx.query.sort, dir: ctx.query.dir === 'desc' ? 'desc' : 'asc' } : null;
  const all = store.activity_log;
  return `${head(t('audit.list.title'), t('audit.list.note'))}
  ${statGrid([
    { num: fmtNum(all.length, lang), label: t('audit.stat.total') },
    { num: fmtNum(all.filter(a => actionGroup(a.action) === 'login').length, lang), label: t('audit.stat.login') },
    { num: fmtNum(all.filter(a => actionGroup(a.action) === 'finance').length, lang), label: t('audit.stat.finance') },
    { num: fmtNum(all.filter(a => actionGroup(a.action) === 'member').length, lang), label: t('audit.stat.member') }
  ])}
  <p class="small muted">${t('audit.list.seedNote')}</p>
  ${renderFilters({ q, chips, activeChip: group })}
  ${rows.length ? renderTable({ columns: [
    { key: 'created_at', label: t('audit.col.time'), sortable: true, render: a => fmtDateTime(a.created_at, lang) },
    { key: 'actor', label: t('audit.col.actor'), sortable: true, render: a => esc(actorName(a.actor, lang)) },
    { key: 'action', label: t('audit.col.action'), sortable: true, render: a => esc(actionLabel(a.action)) },
    { key: 'subject_id', label: t('audit.col.subject'), sortable: true, render: a => `<span class="num">${esc(a.subject_id)}</span>` },
    { key: 'change', label: t('audit.col.change'), render: a => esc(changeText(a)) }
  ], rows, page: parseInt(ctx.query.page || '1', 10), perPage: 20, onRowClick: a => '#/audit/' + a.id, stacked: true, sort }) : emptyState(t('common.empty'), '', '')}`;
}
function detailHtml(ctx, lang){
  const a = store.activity_log.find(x => x.id === ctx.params.id);
  if(!a) return `<div class="card"><h1>${t('notfound.title')}</h1><p class="mt-4">${t('notfound.body')}</p><p class="mt-4"><a class="btn btn-primary" href="#/audit">${t('audit.back.list')}</a></p></div>`;
  return `${head(t('audit.crumbDetail'))}
  <section class="card"><dl class="kv">
    <dt>${t('audit.detail.actor')}</dt><dd>${esc(actorName(a.actor, lang))} <span class="small muted num">(${esc(a.actor)})</span></dd>
    <dt>${t('audit.detail.role')}</dt><dd>${esc(a.actor_role)}</dd>
    <dt>${t('audit.detail.action')}</dt><dd>${esc(actionLabel(a.action))} <span class="small muted num">(${esc(a.action)})</span></dd>
    <dt>${t('audit.detail.subjectType')}</dt><dd>${esc(a.subject_type)}</dd>
    <dt>${t('audit.detail.subject')}</dt><dd><span class="num">${esc(a.subject_id)}</span></dd>
    <dt>${t('audit.detail.old')}</dt><dd>${a.old_value === null || a.old_value === undefined ? t('audit.detail.none') : esc(String(a.old_value))}</dd>
    <dt>${t('audit.detail.new')}</dt><dd>${a.new_value === null || a.new_value === undefined ? t('audit.detail.none') : esc(String(a.new_value))}</dd>
    <dt>${t('audit.detail.ip')}</dt><dd><span class="num">${esc(a.ip)}</span></dd>
    <dt>${t('audit.detail.time')}</dt><dd>${fmtDateTime(a.created_at, lang)}</dd>
  </dl>
  <p class="mt-4"><strong>${t('audit.col.change')}:</strong> <span class="num">${esc(changeText(a))}</span></p>
  <div class="banner mt-4" role="note"><span>${t('audit.detail.immutable')}</span></div>
  <p class="mt-4"><a class="btn btn-primary" href="#/audit">${t('audit.back.list')}</a></p></section>`;
}
function bindAudit(ctx){
  const root = document.getElementById('view');
  if(!root) return;
  bindTableRows(root);
  bindTableSort(root, (key, dir) => {
    const qs = { ...ctx.query, sort: key, dir, page: 1 };
    location.hash = '#/audit' + hashQs(qs);
  });
  bindFilters(root, {
    onSearch: v => { location.hash = '#/audit' + hashQs({ ...ctx.query, q: v, page: 1 }); },
    onChip: v => { location.hash = '#/audit' + hashQs({ ...ctx.query, group: v === 'all' ? '' : v, page: 1 }); },
    onClear: () => { location.hash = '#/audit'; }
  });
}
function hashQs(qs){
  const str = Object.entries(qs).filter(([, v]) => v !== '' && v != null).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
  return str ? '?' + str : '';
}
