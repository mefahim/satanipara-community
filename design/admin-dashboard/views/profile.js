// profile.js — Own profile + own password change (both roles). Password change is
// SIMULATED in this prototype (no real auth): the real system uses Argon2id,
// 12 chars minimum (16 for Super Admin), breach screening and a history of 5.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store, writeAudit } from '../js/lib/store.js';
import { fmtDateTime, esc } from '../js/lib/format.js';
import { field, errorSummary, validateRequired } from '../js/components/forms.js';
const STRINGS = {
bn: {
'title':'আমার প্রোফাইল', 'profile.sub':'নিজের তথ্য ও পাসওয়ার্ড — শুধু নিজের জন্য।', 'profile.title':'আমার প্রোফাইল', 'profile.name':'নাম', 'profile.nameBn':'নাম (বাংলা)', 'profile.nameEn':'নাম (English)', 'profile.phone':'মোবাইল', 'profile.role':'ভূমিকা',
'profile.area':'এলাকা', 'profile.lastLogin':'শেষ লগইন', 'profile.memberSince':'সদস্য হওয়ার তারিখ', 'profile.roleSa':'সুপার অ্যাডমিন', 'profile.roleHelper':'সহায়ক',
'profile.save':'প্রোফাইল সংরক্ষণ করুন', 'profile.saved':'প্রোফাইল সংরক্ষণ করা হয়েছে।',
'pw.title':'পাসওয়ার্ড পরিবর্তন', 'pw.note':'আসল ব্যবস্থায় পাসওয়ার্ড Argon2id দিয়ে সংরক্ষিত হয়; ১২ অক্ষর সর্বনিম্ন (সুপার অ্যাডমিনের জন্য ১৬), লঙ্ঘিত পাসওয়ার্ড যাচাই করা হয়। এই প্রোটোটাইপে পরিবর্তনটি অনুকরণ করা হয়েছে।',
'pw.current':'বর্তমান পাসওয়ার্ড', 'pw.new':'নতুন পাসওয়ার্ড', 'pw.confirm':'নতুন পাসওয়ার্ড আবার লিখুন', 'pw.min':'কমপক্ষে ১২ অক্ষর; সুপার অ্যাডমিনের জন্য ১৬ অক্ষর।',
'pw.change':'পাসওয়ার্ড পরিবর্তন করুন', 'pw.changed':'পাসওয়ার্ড পরিবর্তন করা হয়েছে (অনুকরণ)।',
'pw.errCurrent':'বর্তমান পাসওয়ার্ড লিখুন।', 'pw.errShort':'নতুন পাসওয়ার্ডটি খুব ছোট।', 'pw.errMismatch':'দুটি নতুন পাসওয়ার্ড মেলেনি।',
'session.title':'সেশন', 'session.idle':'নিষ্ক্রিয় সময়সীমা', 'session.minutes':'মিনিট'
},
en: {
'title':'My profile', 'profile.sub':'Your own details and password — for you only.', 'profile.title':'My profile', 'profile.name':'Name', 'profile.nameBn':'Name (Bengali)', 'profile.nameEn':'Name (English)', 'profile.phone':'Mobile', 'profile.role':'Role',
'profile.area':'Area', 'profile.lastLogin':'Last login', 'profile.memberSince':'Member since', 'profile.roleSa':'Super Admin', 'profile.roleHelper':'Helper',
'profile.save':'Save profile', 'profile.saved':'Profile saved.',
'pw.title':'Change password', 'pw.note':'In the real system passwords are stored with Argon2id; 12 characters minimum (16 for Super Admin), with breach screening. This change is simulated in the prototype.',
'pw.current':'Current password', 'pw.new':'New password', 'pw.confirm':'New password again', 'pw.min':'At least 12 characters; 16 for Super Admin.',
'pw.change':'Change password', 'pw.changed':'Password changed (simulated).',
'pw.errCurrent':'Enter the current password.', 'pw.errShort':'The new password is too short.', 'pw.errMismatch':'The two new passwords do not match.',
'session.title':'Session', 'session.idle':'Idle timeout', 'session.minutes':'minutes'
}};
registerStrings('profile', STRINGS);
export const Profile = {
  route: '#/profile',
  title: { bn: 'আমার প্রোফাইল', en: 'My profile' },
  breadcrumb: ['nav.dashboard', 'nav.profile'],
  roles: ['super-admin', 'expatriate-helper'],
  permissions: ['profile.view'],
  render(ctx){
    const lang = getLang();
    const u = ctx.user;
    const idle = u.role === 'super-admin' ? store.settings.system.session_sa_idle_min : store.settings.system.session_helper_idle_min;
    return `<span class="demo-badge">${t('app.demo')}</span><div class="view-head"><div><h1>${t('profile.title')}</h1><p class="sub">${t('profile.sub')}</p></div></div>
    <section class="card"><h3>${t('profile.title')}</h3>
    <dl class="kv">
      <dt>${t('profile.name')}</dt><dd>${esc(lang === 'bn' ? u.name_bn : u.name_en)}</dd>
      <dt>${t('profile.phone')}</dt><dd><span class="num">${esc(u.phone)}</span></dd>
      <dt>${t('profile.role')}</dt><dd>${u.role === 'super-admin' ? t('profile.roleSa') : t('profile.roleHelper')}</dd>
      <dt>${t('profile.area')}</dt><dd>${esc(u.area)}</dd>
      <dt>${t('profile.lastLogin')}</dt><dd>${u.last_login ? fmtDateTime(u.last_login, lang) : '—'}</dd>
      <dt>${t('profile.memberSince')}</dt><dd>${u.created_at ? fmtDateTime(u.created_at, lang) : '—'}</dd>
    </dl>
    <form id="profile-form" novalidate class="mt-6">
      ${field({ id: 'name_bn', label: t('profile.nameBn'), value: u.name_bn || '', required: true })}
      ${field({ id: 'name_en', label: t('profile.nameEn'), value: u.name_en || '' })}
      ${field({ id: 'area', label: t('profile.area'), value: u.area || '' })}
      <button type="submit" class="btn btn-primary">${t('profile.save')}</button>
    </form></section>
    <section class="card"><h3>${t('pw.title')}</h3>
    <p class="small muted">${t('pw.note')}</p>
    <div id="pw-summary"></div>
    <form id="pw-form" novalidate class="mt-4">
      ${field({ id: 'pw-current', label: t('pw.current'), type: 'password', required: true, attrs: 'autocomplete="current-password"' })}
      ${field({ id: 'pw-new', label: t('pw.new'), type: 'password', required: true, hint: t('pw.min'), attrs: 'autocomplete="new-password"' })}
      ${field({ id: 'pw-confirm', label: t('pw.confirm'), type: 'password', required: true, attrs: 'autocomplete="new-password"' })}
      <button type="submit" class="btn btn-primary">${t('pw.change')}</button>
    </form></section>
    <section class="card"><h3>${t('session.title')}</h3>
    <dl class="kv"><dt>${t('session.idle')}</dt><dd>${idle} ${t('session.minutes')}</dd></dl></section>`;
  },
  onMount(ctx){ bindProfile(ctx); },
  onUnmount(){}
};
function bindProfile(ctx){
  const root = document.getElementById('view');
  if(!root) return;
  const pf = root.querySelector('#profile-form');
  if(pf) pf.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(pf);
    const u = ctx.user;
    u.name_bn = String(data.get('name_bn') || u.name_bn);
    u.name_en = String(data.get('name_en') || u.name_en);
    u.area = String(data.get('area') || u.area);
    writeAudit(u.id, ctx.role, 'profile.update', 'user', u.id, null, 'updated');
    Promise.resolve(ctx.rerender()).then(() => ctx.toast(t('profile.saved')));
  });
  const pwf = root.querySelector('#pw-form');
  if(pwf) pwf.addEventListener('submit', e => {
    e.preventDefault();
    const u = ctx.user;
    const minLen = u.role === 'super-admin' ? 16 : 12;
    const cur = root.querySelector('#pw-current');
    const nw = root.querySelector('#pw-new');
    const cf = root.querySelector('#pw-confirm');
    const summary = root.querySelector('#pw-summary');
    const errors = [];
    if(!validateRequired(cur.value, 1)) errors.push({ id: 'pw-current', message: t('profile.pw.errCurrent') });
    if(!validateRequired(nw.value, minLen)) errors.push({ id: 'pw-new', message: t('profile.pw.errShort') });
    if(nw.value !== cf.value) errors.push({ id: 'pw-confirm', message: t('profile.pw.errMismatch') });
    if(errors.length){
      summary.innerHTML = errorSummary(errors);
      const s = summary.querySelector('.error-summary');
      if(s) s.focus();
      const first = root.querySelector('#' + errors[0].id);
      if(first){ first.setAttribute('aria-invalid', 'true'); first.focus(); }
      return;
    }
    summary.innerHTML = '';
    writeAudit(u.id, ctx.role, 'profile.password.change', 'user', u.id, null, 'changed');
    ctx.toast(t('profile.pw.changed'));
    pwf.reset();
  });
}
