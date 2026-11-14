// Users view — Journey M: user list, create (Super Admin / Expatriate Helper
// only — never President/Treasurer/GS, no role builder), detail (Super-Admin
// password reset, role history), edit (activate/suspend, role change).
// Hard guards, enforced visibly: never remove your OWN Super Admin role; never
// leave zero active Super Admins (action disabled + reason shown).
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store, filterList, writeAudit, activeSuperAdmins } from '../js/lib/store.js';
import { fmtDate, fmtDateTime, fmtPhoneMasked, fmtPhoneFull, esc } from '../js/lib/format.js';
import { badge, plainBadge } from '../js/components/badges.js';
import { renderTable, bindTableRows } from '../js/components/table.js';
import { field, errorSummary, validateRequired } from '../js/components/forms.js';
import { emptyState } from '../js/components/states.js';
import { notFoundHtml } from '../js/lib/guards.js';

const STRINGS = {
  bn: {
    'list.title': 'ব্যবহারকারী', 'list.subtitle': 'অ্যাডমিন ব্যবহারকারী ও তাদের ভূমিকা।',
    'list.newUser': 'নতুন ব্যবহারকারী', 'list.searchPh': 'নাম বা মোবাইল খুঁজুন',
    'list.roleAll': 'সব ভূমিকা', 'list.statusAll': 'সব অবস্থা',
    'list.role.super-admin': 'সুপার অ্যাডমিন', 'list.role.expatriate-helper': 'প্রবাসী সহায়ক',
    'list.status.active': 'সক্রিয়', 'list.status.suspended': 'স্থগিত',
    'list.colName': 'নাম', 'list.colPhone': 'মোবাইল', 'list.colRole': 'ভূমিকা', 'list.colStatus': 'অবস্থা',
    'list.colLastLogin': 'শেষ লগইন', 'list.colCreated': 'তৈরির তারিখ', 'list.never': 'কখনো নয়',
    'list.toolsTitle': 'অ্যাডমিন টুলস', 'list.toolsDataRights': 'তথ্য-অধিকার অনুরোধ দেখুন',
    'list.toolsRoles': 'ভূমিকা ও অনুমতি দেখুন', 'list.oneAdminNote': 'সতর্কতা: বর্তমানে মাত্র একজন সক্রিয় সুপার অ্যাডমিন আছেন। তাঁকে স্থগিত বা ভূমিকা বদল করা যাবে না।',
    'detail.back': 'ব্যবহারকারী তালিকায় ফিরুন', 'detail.kName': 'নাম', 'detail.kPhone': 'মোবাইল (বিস্তারিত দৃশ্যে)',
    'detail.kRole': 'ভূমিকা', 'detail.kStatus': 'অবস্থা', 'detail.kArea': 'এলাকা',
    'detail.kCreated': 'তৈরির তারিখ', 'detail.kLastLogin': 'শেষ লগইন',
    'detail.roleHistory': 'ভূমিকার ইতিহাস', 'detail.historyEmpty': 'এই ব্যবহারকারীর ভূমিকা বদলের কোনো লগ নেই।',
    'detail.historyCreated': 'অ্যাকাউন্ট তৈরি — ভূমিকা দেওয়া হয়েছে', 'detail.historyNote': 'ভূমিকা বদল অডিট লগ থেকে নেওয়া হয়।',
    'detail.resetPw': 'পাসওয়ার্ড রিসেট', 'detail.resetTitle': 'পাসওয়ার্ড রিসেট',
    'detail.resetBody': '{name} ({phone})-এর জন্য একটি একবারের অস্থায়ী পাসওয়ার্ড তৈরি করা হবে। পুরোনো পাসওয়ার্ড সঙ্গে সঙ্গে বাতিল হবে।',
    'detail.resetDoneTitle': 'অস্থায়ী পাসওয়ার্ড — একবারই দেখানো হবে',
    'detail.resetOnce': 'এই পাসওয়ার্ড আর কখনো দেখানো হবে না। নিরাপদ মাধ্যমে ব্যবহারকারীকে জানান।',
    'detail.resetExpiry': 'মেয়াদ: ২৪ ঘণ্টা। প্রথম লগইনে পাসওয়ার্ড বদলাতে হবে।',
    'detail.resetToast': 'অস্থায়ী পাসওয়ার্ড তৈরি হয়েছে।',
    'detail.edit': 'তথ্য সম্পাদনা', 'detail.activate': 'সক্রিয় করুন', 'detail.suspend': 'স্থগিত করুন',
    'detail.activateTitle': 'ব্যবহারকারী সক্রিয়', 'detail.activateBody': '{name} ({phone})-কে আবার সক্রিয় করা হবে।',
    'detail.suspendTitle': 'ব্যবহারকারী স্থগিত', 'detail.suspendBody': '{name} ({phone})-কে স্থগিত করা হবে। স্থগিত হলে তাঁর সব সেশন সঙ্গে সঙ্গে বাতিল হবে।',
    'detail.suspendedToast': 'ব্যবহারকারী স্থগিত করা হয়েছে।', 'detail.activatedToast': 'ব্যবহারকারী আবার সক্রিয় করা হয়েছে।',
    'detail.selfRoleNote': 'নিজের সুপার অ্যাডমিন ভূমিকা নিজে সরানো যায় না — এমনকি আরেকজন সুপার অ্যাডমিন থাকলেও।',
    'detail.lastSaNote': 'শেষ সক্রিয় সুপার অ্যাডমিনের ভূমিকা বদলানো যাবে না — এতে কোনো সুপার অ্যাডমিন থাকবে না।',
    'detail.suspendBlockedNote': 'শেষ সক্রিয় সুপার অ্যাডমিনকে স্থগিত করা যাবে না।',
    'new.title': 'নতুন ব্যবহারকারী তৈরি', 'new.nameBn': 'নাম (বাংলা)', 'new.nameEn': 'নাম (English)',
    'new.phone': 'মোবাইল নম্বর', 'new.phoneHint': 'লগইনের জন্য এই নম্বর ব্যবহৃত হবে।',
    'new.role': 'ভূমিকা', 'new.roleHint': 'প্রথম ধাপে শুধু এই দুটি ভূমিকাই দেওয়া যায়।',
    'new.password': 'প্রাথমিক পাসওয়ার্ড', 'new.passwordHint': 'সব অ্যাকাউন্টে কমপক্ষে ১২ অক্ষর; সুপার অ্যাডমিনে কমপক্ষে ১৬ অক্ষর।',
    'new.create': 'ব্যবহারকারী তৈরি করুন', 'new.createdToast': 'ব্যবহারকারী তৈরি হয়েছে।',
    'new.errName': 'নাম লিখতে হবে।', 'new.errPhone': 'সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন (01 দিয়ে শুরু)।',
    'new.errPhoneDup': 'এই মোবাইল নম্বরে ইতিমধ্যে একটি ব্যবহারকারী আছে।',
    'new.errPassword': 'পাসওয়ার্ড খুব ছোট — সুপার অ্যাডমিনে ১৬, অন্য ভূমিকায় ১২ অক্ষর লাগবে।',
    'edit.title': 'ব্যবহারকারীর তথ্য সম্পাদনা', 'edit.nameBn': 'নাম (বাংলা)', 'edit.nameEn': 'নাম (English)',
    'edit.phone': 'মোবাইল নম্বর', 'edit.area': 'এলাকা', 'edit.role': 'ভূমিকা',
    'edit.savedToast': 'ব্যবহারকারীর তথ্য সংরক্ষিত হয়েছে।',
    'edit.errName': 'নাম লিখতে হবে।', 'edit.errPhone': 'সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন (01 দিয়ে শুরু)।'
  },
  en: {
    'list.title': 'Users', 'list.subtitle': 'Admin users and their roles.',
    'list.newUser': 'New user', 'list.searchPh': 'Search name or phone',
    'list.roleAll': 'All roles', 'list.statusAll': 'All statuses',
    'list.role.super-admin': 'Super Admin', 'list.role.expatriate-helper': 'Expatriate Helper',
    'list.status.active': 'Active', 'list.status.suspended': 'Suspended',
    'list.colName': 'Name', 'list.colPhone': 'Phone', 'list.colRole': 'Role', 'list.colStatus': 'Status',
    'list.colLastLogin': 'Last login', 'list.colCreated': 'Created', 'list.never': 'Never',
    'list.toolsTitle': 'Admin tools', 'list.toolsDataRights': 'View data-rights requests',
    'list.toolsRoles': 'View roles and permissions', 'list.oneAdminNote': 'Warning: there is currently only one active Super Admin. They cannot be suspended or have their role changed.',
    'detail.back': 'Back to user list', 'detail.kName': 'Name', 'detail.kPhone': 'Phone (detail view)',
    'detail.kRole': 'Role', 'detail.kStatus': 'Status', 'detail.kArea': 'Area',
    'detail.kCreated': 'Created', 'detail.kLastLogin': 'Last login',
    'detail.roleHistory': 'Role history', 'detail.historyEmpty': 'No role-change log entries for this user.',
    'detail.historyCreated': 'Account created — role assigned', 'detail.historyNote': 'Role changes are taken from the audit log.',
    'detail.resetPw': 'Reset password', 'detail.resetTitle': 'Reset password',
    'detail.resetBody': 'A single-use temporary password will be created for {name} ({phone}). The old password is revoked immediately.',
    'detail.resetDoneTitle': 'Temporary password — shown once only',
    'detail.resetOnce': 'This password will never be shown again. Share it with the user through a safe channel.',
    'detail.resetExpiry': 'Valid for 24 hours. The user must change it on first login.',
    'detail.resetToast': 'Temporary password created.',
    'detail.edit': 'Edit details', 'detail.activate': 'Activate', 'detail.suspend': 'Suspend',
    'detail.activateTitle': 'Activate user', 'detail.activateBody': '{name} ({phone}) will be active again.',
    'detail.suspendTitle': 'Suspend user', 'detail.suspendBody': '{name} ({phone}) will be suspended. Suspension revokes all of their sessions immediately.',
    'detail.suspendedToast': 'User suspended.', 'detail.activatedToast': 'User activated again.',
    'detail.selfRoleNote': 'You can never remove your own Super Admin role — even when another Super Admin exists.',
    'detail.lastSaNote': 'The last active Super Admin\u2019s role cannot be changed — that would leave zero Super Admins.',
    'detail.suspendBlockedNote': 'The last active Super Admin cannot be suspended.',
    'new.title': 'Create new user', 'new.nameBn': 'Name (Bengali)', 'new.nameEn': 'Name (English)',
    'new.phone': 'Phone number', 'new.phoneHint': 'This number is used to log in.',
    'new.role': 'Role', 'new.roleHint': 'In Phase 1 only these two roles can be assigned.',
    'new.password': 'Initial password', 'new.passwordHint': 'At least 12 characters for all accounts; at least 16 for Super Admin.',
    'new.create': 'Create user', 'new.createdToast': 'User created.',
    'new.errName': 'A name is required.', 'new.errPhone': 'Enter a valid 11-digit phone number starting with 01.',
    'new.errPhoneDup': 'A user already exists with this phone number.',
    'new.errPassword': 'Password too short — 16 characters for Super Admin, 12 for other roles.',
    'edit.title': 'Edit user details', 'edit.nameBn': 'Name (Bengali)', 'edit.nameEn': 'Name (English)',
    'edit.phone': 'Phone number', 'edit.area': 'Area', 'edit.role': 'Role',
    'edit.savedToast': 'User details saved.',
    'edit.errName': 'A name is required.', 'edit.errPhone': 'Enter a valid 11-digit phone number starting with 01.'
  }
};
registerStrings('users', STRINGS);

export const Users = {
  route: '#/users',
  title: { bn: 'ব্যবহারকারী', en: 'Users' },
  breadcrumb: ['nav.dashboard', 'nav.users'],
  roles: ['super-admin'],
  permissions: ['users.view'],
  render(ctx){
    if(ctx.path === '/users/new') return newHtml(ctx);
    if(ctx.path.endsWith('/edit')) return editHtml(ctx);
    if(ctx.params.id) return detailHtml(ctx);
    return listHtml(ctx);
  },
  onMount(ctx){
    bindTableRows(document.getElementById('view'));
    const view = document.getElementById('view');
    if(!view) return;
    const go = qs => { location.hash = '#/users' + qs; };
    const q = view.querySelector('[data-u-q]');
    if(q) q.addEventListener('change', () => go(buildQuery(ctx, { q: q.value, page: 1 })));
    const ro = view.querySelector('[data-u-role]');
    if(ro) ro.addEventListener('change', () => go(buildQuery(ctx, { role: ro.value, page: 1 })));
    const st = view.querySelector('[data-u-status]');
    if(st) st.addEventListener('change', () => go(buildQuery(ctx, { status: st.value, page: 1 })));
    view.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', () => handleAction(ctx, b.dataset.action)));
    const nf = view.querySelector('#user-new-form');
    if(nf) nf.addEventListener('submit', e => { e.preventDefault(); saveNew(ctx); });
    const ef = view.querySelector('#user-edit-form');
    if(ef) ef.addEventListener('submit', e => { e.preventDefault(); saveEdit(ctx); });
  },
  onUnmount(){}
};

function findUser(id){ return store.users.find(u => u.id === id); }
function buildQuery(ctx, patch){
  const q = { ...ctx.query, ...patch };
  const p = new URLSearchParams();
  for(const [k, v] of Object.entries(q)) if(v !== '' && v !== undefined && v !== null) p.set(k, v);
  const s = p.toString();
  return s ? '?' + s : '';
}
function roleLabel(role){ return t('users.list.role.' + role); }
function nameOf(u){ const lang = getLang(); return lang === 'bn' ? u.name_bn : (u.name_en || u.name_bn); }
function isSelf(ctx, u){ return ctx.user && u.id === ctx.user.id; }
function isLastSA(u){ return u.role === 'super-admin' && u.status === 'active' && activeSuperAdmins() === 1; }
function genTempPassword(){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  const buf = new Uint32Array(16);
  crypto.getRandomValues(buf);
  return [...buf].map(n => chars[n % chars.length]).join('');
}

function listHtml(ctx){
  const lang = getLang();
  let rows = filterList(store.users, { q: ctx.query.q || '', fields: ['name_bn', 'name_en', 'phone'] });
  if(ctx.query.role) rows = rows.filter(u => u.role === ctx.query.role);
  if(ctx.query.status) rows = rows.filter(u => u.status === ctx.query.status);
  rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
  const page = parseInt(ctx.query.page, 10) || 1;
  const oneAdmin = activeSuperAdmins() === 1;
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t('users.list.title')}</h1><p class="sub">${t('users.list.subtitle')}</p></div>
  <div><a class="btn btn-primary" href="#/users/new">${t('users.list.newUser')}</a></div></div>
  ${oneAdmin ? `<div class="banner" role="alert"><span>${t('users.list.oneAdminNote')}</span></div>` : ''}
  <div class="filters mt-4" role="search">
    <input class="input search-box" type="search" data-u-q value="${esc(ctx.query.q || '')}" placeholder="${esc(t('users.list.searchPh'))}" aria-label="${esc(t('users.list.searchPh'))}">
    <select class="input" data-u-role aria-label="${esc(t('users.list.colRole'))}">
      <option value="">${t('users.list.roleAll')}</option>
      <option value="super-admin"${ctx.query.role === 'super-admin' ? ' selected' : ''}>${t('users.list.role.super-admin')}</option>
      <option value="expatriate-helper"${ctx.query.role === 'expatriate-helper' ? ' selected' : ''}>${t('users.list.role.expatriate-helper')}</option>
    </select>
    <select class="input" data-u-status aria-label="${esc(t('users.list.colStatus'))}">
      <option value="">${t('users.list.statusAll')}</option>
      <option value="active"${ctx.query.status === 'active' ? ' selected' : ''}>${t('users.list.status.active')}</option>
      <option value="suspended"${ctx.query.status === 'suspended' ? ' selected' : ''}>${t('users.list.status.suspended')}</option>
    </select>
  </div>
  <section class="card mt-4">${renderTable({ columns: [
    { key: 'name_bn', label: t('users.list.colName'), render: u => `<strong>${esc(nameOf(u))}</strong>${isSelf(ctx, u) ? ` <span class="small muted">(${esc(u.phone)})</span>` : ''}` },
    { key: 'phone', label: t('users.list.colPhone'), render: u => `<span class="num">${fmtPhoneMasked(u.phone)}</span>` },
    { key: 'role', label: t('users.list.colRole'), render: u => plainBadge(roleLabel(u.role)) },
    { key: 'status', label: t('users.list.colStatus'), render: u => badge(u.status === 'active' ? 'approved' : 'rejected', t('users.list.status.' + u.status)) },
    { key: 'last_login', label: t('users.list.colLastLogin'), render: u => u.last_login ? fmtDate(u.last_login, lang) : `<span class="muted">${t('users.list.never')}</span>` },
    { key: 'created_at', label: t('users.list.colCreated'), render: u => fmtDate(u.created_at, lang) }
  ], rows, page, perPage: 20, onRowClick: u => '#/users/' + u.id, stacked: true })}</section>
  <section class="card mt-4"><h3>${t('users.list.toolsTitle')}</h3>
  <p class="mt-4"><a href="#/data-rights">${t('users.list.toolsDataRights')}</a></p>
  <p class="mt-4"><a href="#/roles">${t('users.list.toolsRoles')}</a></p></section>`;
}

function detailHtml(ctx){
  const lang = getLang();
  const u = findUser(ctx.params.id);
  if(!u) return notFoundHtml();
  const self = isSelf(ctx, u);
  const lastSA = isLastSA(u);
  const history = store.activity_log.filter(a => a.subject_id === u.id);
  const actions = [];
  actions.push(`<button type="button" class="btn btn-secondary" data-action="reset-pw">${t('users.detail.resetPw')}</button>`);
  actions.push(`<a class="btn btn-secondary" href="#/users/${u.id}/edit">${t('users.detail.edit')}</a>`);
  if(u.status === 'active'){
    actions.push(lastSA
      ? `<button type="button" class="btn btn-danger" disabled aria-disabled="true">${t('users.detail.suspend')}</button><p class="small muted">${t('users.detail.suspendBlockedNote')}</p>`
      : `<button type="button" class="btn btn-danger" data-action="toggle-status">${t('users.detail.suspend')}</button>`);
  } else {
    actions.push(`<button type="button" class="btn btn-primary" data-action="toggle-status">${t('users.detail.activate')}</button>`);
  }
  const kv = (k, v) => `<dt>${k}</dt><dd>${v}</dd>`;
  return `<span class="demo-badge">${t('app.demo')}</span>
  <p><a href="#/users">${t('users.detail.back')}</a></p>
  <div class="view-head"><div><h1>${esc(nameOf(u))}</h1>
  <p class="sub">${plainBadge(roleLabel(u.role))} ${badge(u.status === 'active' ? 'approved' : 'rejected', t('users.list.status.' + u.status))}</p></div></div>
  <div class="detail-grid"><section class="card"><dl class="kv">
  ${kv(t('users.detail.kName'), esc(nameOf(u)))}
  ${kv(t('users.detail.kPhone'), `<span class="num">${fmtPhoneFull(u.phone)}</span>`)}
  ${kv(t('users.detail.kRole'), roleLabel(u.role))}
  ${kv(t('users.detail.kStatus'), t('users.list.status.' + u.status))}
  ${kv(t('users.detail.kArea'), esc(u.area || '—'))}
  ${kv(t('users.detail.kCreated'), fmtDate(u.created_at, lang))}
  ${kv(t('users.detail.kLastLogin'), u.last_login ? fmtDateTime(u.last_login, lang) : t('users.list.never'))}
  </dl>
  ${self && u.role === 'super-admin' ? `<p class="small muted mt-4">${t('users.detail.selfRoleNote')}</p>` : ''}
  ${lastSA ? `<p class="small muted mt-4">${t('users.detail.lastSaNote')}</p>` : ''}
  <div class="mt-4" style="display:grid;gap:8px">${actions.join('')}</div></section>
  <section class="card"><h3>${t('users.detail.roleHistory')}</h3>
  <p class="small muted mt-4">${t('users.detail.historyNote')}</p>
  <div class="list-row mt-4"><div class="grow"><strong>${t('users.detail.historyCreated')}</strong><br><span class="small muted">${fmtDate(u.created_at, lang)} · ${roleLabel(u.role)}</span></div></div>
  ${history.length ? history.map(a => `<div class="list-row"><div class="grow"><strong>${esc(a.action)}</strong> — ${esc(a.old_value ?? '—')} → ${esc(a.new_value ?? '—')}<br><span class="small muted">${fmtDate(a.created_at, lang)} · ${esc(a.actor_role)}</span></div></div>`).join('') : `<p class="muted mt-4">${t('users.detail.historyEmpty')}</p>`}
  </section></div>`;
}

function newHtml(ctx){
  return `<span class="demo-badge">${t('app.demo')}</span>
  <p><a href="#/users">${t('users.detail.back')}</a></p>
  <div class="view-head"><div><h1>${t('users.new.title')}</h1></div></div>
  <form id="user-new-form" class="card"><div id="new-errors"></div>
    ${field({ id: 'n-name-bn', label: t('users.new.nameBn'), required: true })}
    ${field({ id: 'n-name-en', label: t('users.new.nameEn') })}
    ${field({ id: 'n-phone', label: t('users.new.phone'), required: true, hint: t('users.new.phoneHint'), attrs: 'inputmode="tel"' })}
    <div class="field"><label for="n-role">${t('users.new.role')} *</label>
      <select id="n-role" class="input">
        <option value="super-admin">${t('users.list.role.super-admin')}</option>
        <option value="expatriate-helper">${t('users.list.role.expatriate-helper')}</option>
      </select><div class="hint">${t('users.new.roleHint')}</div></div>
    ${field({ id: 'n-password', label: t('users.new.password'), type: 'password', required: true, hint: t('users.new.passwordHint'), attrs: 'autocomplete="new-password"' })}
    <div class="row"><button type="submit" class="btn btn-primary">${t('users.new.create')}</button>
    <a class="btn btn-secondary" href="#/users">${t('common.cancel')}</a></div>
  </form>`;
}

function editHtml(ctx){
  const u = findUser(ctx.params.id);
  if(!u) return notFoundHtml();
  const self = isSelf(ctx, u);
  const lastSA = isLastSA(u);
  const roleBlocked = (self && u.role === 'super-admin') || lastSA;
  const roleNote = self && u.role === 'super-admin' ? t('users.detail.selfRoleNote') : (lastSA ? t('users.detail.lastSaNote') : '');
  return `<span class="demo-badge">${t('app.demo')}</span>
  <p><a href="#/users/${u.id}">${t('users.detail.back')}</a></p>
  <div class="view-head"><div><h1>${t('users.edit.title')}</h1><p class="sub">${esc(nameOf(u))}</p></div></div>
  <form id="user-edit-form" class="card"><div id="edit-errors"></div>
    ${field({ id: 'e-name-bn', label: t('users.edit.nameBn'), value: u.name_bn, required: true })}
    ${field({ id: 'e-name-en', label: t('users.edit.nameEn'), value: u.name_en || '' })}
    ${field({ id: 'e-phone', label: t('users.edit.phone'), value: u.phone, required: true, attrs: 'inputmode="tel"' })}
    ${field({ id: 'e-area', label: t('users.edit.area'), value: u.area || '' })}
    <div class="field"><label for="e-role">${t('users.edit.role')} *</label>
      <select id="e-role" class="input"${roleBlocked ? ' disabled aria-disabled="true"' : ''}>
        <option value="super-admin"${u.role === 'super-admin' ? ' selected' : ''}>${t('users.list.role.super-admin')}</option>
        <option value="expatriate-helper"${u.role === 'expatriate-helper' ? ' selected' : ''}>${t('users.list.role.expatriate-helper')}</option>
      </select>${roleNote ? `<div class="hint">${roleNote}</div>` : ''}</div>
    <div class="row"><button type="submit" class="btn btn-primary">${t('common.save')}</button>
    <a class="btn btn-secondary" href="#/users/${u.id}">${t('common.cancel')}</a></div>
  </form>`;
}

function saveNew(ctx){
  const view = document.getElementById('view');
  const nameBn = view.querySelector('#n-name-bn').value.trim();
  const phone = view.querySelector('#n-phone').value.trim();
  const role = view.querySelector('#n-role').value;
  const pw = view.querySelector('#n-password').value;
  const errors = [];
  if(!validateRequired(nameBn)) errors.push({ id: 'n-name-bn', message: t('users.new.errName') });
  if(!/^01[0-9]{9}$/.test(phone)) errors.push({ id: 'n-phone', message: t('users.new.errPhone') });
  else if(store.users.some(u => u.phone === phone)) errors.push({ id: 'n-phone', message: t('users.new.errPhoneDup') });
  if(pw.length < (role === 'super-admin' ? 16 : 12)) errors.push({ id: 'n-password', message: t('users.new.errPassword') });
  const box = view.querySelector('#new-errors');
  if(errors.length){
    box.innerHTML = errorSummary(errors);
    const s = box.querySelector('.error-summary'); if(s) s.focus();
    return;
  }
  const id = 'u-new-' + Date.now().toString(36);
  store.users.push({ id, name_bn: nameBn, name_en: view.querySelector('#n-name-en').value.trim(), phone, role, area: 'সাতানীপাড়া', status: 'active', last_login: null, created_at: new Date().toISOString() });
  writeAudit(ctx.user.id, ctx.role, 'user.create', 'user', id, null, role);
  location.hash = '#/users/' + id;
  setTimeout(() => ctx.toast(t('users.new.createdToast')), 350);
}

function saveEdit(ctx){
  const u = findUser(ctx.params.id);
  const view = document.getElementById('view');
  const nameBn = view.querySelector('#e-name-bn').value.trim();
  const phone = view.querySelector('#e-phone').value.trim();
  const errors = [];
  if(!validateRequired(nameBn)) errors.push({ id: 'e-name-bn', message: t('users.edit.errName') });
  if(!/^01[0-9]{9}$/.test(phone)) errors.push({ id: 'e-phone', message: t('users.edit.errPhone') });
  else if(store.users.some(x => x.id !== u.id && x.phone === phone)) errors.push({ id: 'e-phone', message: t('users.new.errPhoneDup') });
  const box = view.querySelector('#edit-errors');
  if(errors.length){
    box.innerHTML = errorSummary(errors);
    const s = box.querySelector('.error-summary'); if(s) s.focus();
    return;
  }
  const roleSel = view.querySelector('#e-role');
  const newRole = roleSel.disabled ? u.role : roleSel.value;
  const oldRole = u.role;
  u.name_bn = nameBn;
  u.name_en = view.querySelector('#e-name-en').value.trim();
  u.phone = phone;
  u.area = view.querySelector('#e-area').value.trim();
  u.role = newRole;
  writeAudit(ctx.user.id, ctx.role, 'user.update', 'user', u.id, oldRole, newRole);
  if(newRole !== oldRole) writeAudit(ctx.user.id, ctx.role, 'user.role.change', 'user', u.id, oldRole, newRole);
  location.hash = '#/users/' + u.id;
  setTimeout(() => ctx.toast(t('users.edit.savedToast')), 350);
}

function handleAction(ctx, action){
  const u = findUser(ctx.params.id);
  if(!u) return;
  if(action === 'reset-pw'){
    ctx.modal({
      title: t('users.detail.resetTitle'),
      body: `<p>${t('users.detail.resetBody').replace('{name}', esc(nameOf(u))).replace('{phone}', fmtPhoneMasked(u.phone))}</p>`,
      confirmLabel: t('users.detail.resetPw'),
      requireReauth: true,
      onConfirm: () => {
        const pw = genTempPassword();
        writeAudit(ctx.user.id, ctx.role, 'user.password.reset', 'user', u.id, null, 'temp-issued');
        ctx.toast(t('users.detail.resetToast'));
        ctx.drawer({
          title: t('users.detail.resetDoneTitle'),
          body: `<p>${esc(nameOf(u))} — <span class="num">${fmtPhoneMasked(u.phone)}</span></p>
          <p class="mt-4"><code class="num" style="font-size:20px">${pw}</code></p>
          <p class="mt-4">${t('users.detail.resetOnce')}</p><p class="mt-4">${t('users.detail.resetExpiry')}</p>`
        });
      }
    });
  }
  if(action === 'toggle-status'){
    const suspending = u.status === 'active';
    if(suspending && isLastSA(u)) return;
    ctx.modal({
      title: t(suspending ? 'users.detail.suspendTitle' : 'users.detail.activateTitle'),
      body: `<p>${t(suspending ? 'users.detail.suspendBody' : 'users.detail.activateBody').replace('{name}', esc(nameOf(u))).replace('{phone}', fmtPhoneMasked(u.phone))}</p>`,
      confirmLabel: suspending ? t('users.detail.suspend') : t('users.detail.activate'),
      danger: suspending,
      requireReauth: true,
      onConfirm: () => {
        const old = u.status;
        u.status = suspending ? 'suspended' : 'active';
        writeAudit(ctx.user.id, ctx.role, suspending ? 'user.suspend' : 'user.activate', 'user', u.id, old, u.status);
        ctx.rerender();
        setTimeout(() => ctx.toast(suspending ? t('users.detail.suspendedToast') : t('users.detail.activatedToast')), 350);
      }
    });
  }
}
