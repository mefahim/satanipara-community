// settings.js — Settings (Super Admin only), grouped tabs: brand / contact /
// policy / system / sessions. Contact details show honest empty/unverified
// states (never invented). Sessions + security are SIMULATED stubs. Policy copy
// includes the no-service-charge rule, the 999 disclaimer and the ERT size.
// Links out to #/data-rights and #/services (no sidebar items for those).
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store, writeAudit } from '../js/lib/store.js';
import { fmtNum, esc } from '../js/lib/format.js';
import { field } from '../js/components/forms.js';
const STRINGS = {
bn: {
'title':'সেটিংস', 'tab.brand':'ব্র্যান্ড', 'tab.contact':'যোগাযোগ', 'tab.policy':'নীতি', 'tab.system':'সিস্টেম', 'tab.sessions':'সেশন ও নিরাপত্তা',
'brand.title':'ব্র্যান্ড ও পরিচয়', 'brand.nameBn':'নাম (বাংলা)', 'brand.nameEn':'নাম (ইংরেজি)', 'brand.tagBn':'ট্যাগলাইন (বাংলা)',
'brand.tagEn':'ট্যাগলাইন (ইংরেজি)', 'brand.sloganBn':'স্লোগান (বাংলা)', 'brand.sloganEn':'স্লোগান (ইংরেজি)',
'brand.enMissing':'ইংরেজি পাঠ এখনো দেওয়া হয়নি।', 'save':'সংরক্ষণ করুন', 'saved':'সেটিংস সংরক্ষণ করা হয়েছে।',
'contact.title':'যোগাযোগ ও অফিস', 'contact.note':'এই তথ্যগুলো এখনো যাচাই হয়নি — সংস্থার কাছ থেকে পাওয়া গেলে এখানে বসবে। কোনো তথ্য অনুমান করে লেখা হয়নি।',
'contact.address':'ঠিকানা', 'contact.phone':'ফোন', 'contact.email':'ইমেইল', 'contact.hours':'অফিসের সময়',
'contact.pending':'তথ্য হালনাগাদ হচ্ছে', 'contact.enterHint':'যাচাইকৃত তথ্য পেলে এখানে লিখুন।',
'policy.title':'নীতিমালার পাঠ', 'policy.note':'এই পাঠগুলো স্থায়ী — প্রবাসী সহায়তার পাতায় এগুলো দেখানো হয়।',
'policy.charge':'সেবা মূল্য নেই', 'policy.disclaimer':'জরুরি সেবার সতর্কতা', 'policy.ert':'জরুরি সাড়া দল',
'policy.enNote':'ইংরেজি অনুবাদ ডেমো অনুবাদ — চূড়ান্ত অনুবাদ পেশাদার পর্যালোচনা সাপেক্ষে।',
'policy.chargeEn':'Expatriate support has no service charge — only the actual cost and transport are borne by the applicant.',
'policy.disclaimerEn':'This service is not a replacement for official emergency services — call 999 first.',
'policy.ertEn':'Emergency Response Team: 3–5 people.',
'system.title':'সিস্টেম', 'system.lang':'ডিফল্ট ভাষা', 'system.theme':'ডিফল্ট থিম', 'system.saIdle':'সুপার অ্যাডমিন নিষ্ক্রিয় সময়সীমা (মিনিট)',
'system.helperIdle':'সহায়ক নিষ্ক্রিয় সময়সীমা (মিনিট)', 'system.absolute':'সর্বোচ্চ সেশন (ঘণ্টা)', 'system.retention':'সংরক্ষণ নীতি',
'system.retentionNote':'সংরক্ষণের সময়সীমা হস্তান্তরের সময় নিশ্চিত করা হবে (AO-16)। অডিট লগ স্থায়ীভাবে রাখা হয়।',
'system.persistNote':'ভাষা/থিম পছন্দ এই প্রোটোটাইপে শুধু সেশনের জন্য (Q-20 খোলা আছে)।', 'system.links':'সম্পর্কিত',
'system.dataRights':'তথ্য-অধিকার অনুরোধ', 'system.services':'সেবার তালিকা', 'system.health':'সিস্টেম স্বাস্থ্য',
'sessions.title':'সেশন ও নিরাপত্তা', 'sessions.note':'এই অংশটি অনুকরণ করা হয়েছে — আসল সেশন ব্যবস্থাপনা নয়।',
'sessions.current':'বর্তমান সেশন', 'sessions.device':'এই ব্রাউজার (ডেমো)', 'sessions.logoutAll':'সব ডিভাইস থেকে লগ আউট',
'sessions.loggedOut':'সব ডিভাইস থেকে লগ আউট করা হয়েছে (অনুকরণ)।', 'sessions.mfaTitle':'দ্বি-ধাপ যাচাই (MFA)',
'sessions.mfaNote':'ঐচ্ছিক — চালু হবে কি না, সেই সিদ্ধান্ত এখনো খোলা (AO-02)। এই প্রোটোটাইপে কোনো MFA ফ্লো নেই।',
'confirm.logoutTitle':'সব ডিভাইস থেকে লগ আউট করবেন?', 'confirm.logoutBody':'আপনার সব সক্রিয় সেশন শেষ হবে; আবার লগইন করতে হবে।'
},
en: {
'title':'Settings', 'tab.brand':'Brand', 'tab.contact':'Contact', 'tab.policy':'Policy', 'tab.system':'System', 'tab.sessions':'Sessions & security',
'brand.title':'Brand & identity', 'brand.nameBn':'Name (Bengali)', 'brand.nameEn':'Name (English)', 'brand.tagBn':'Tagline (Bengali)',
'brand.tagEn':'Tagline (English)', 'brand.sloganBn':'Slogan (Bengali)', 'brand.sloganEn':'Slogan (English)',
'brand.enMissing':'English copy not yet provided.', 'save':'Save', 'saved':'Settings saved.',
'contact.title':'Contact & office', 'contact.note':'These details are not yet verified — they will be filled in when the organisation provides them. Nothing here is guessed.',
'contact.address':'Address', 'contact.phone':'Phone', 'contact.email':'Email', 'contact.hours':'Office hours',
'contact.pending':'Updating', 'contact.enterHint':'Enter the verified detail when available.',
'policy.title':'Policy copy', 'policy.note':'These lines are permanent — they are shown on expatriate support pages.',
'policy.charge':'No service charge', 'policy.disclaimer':'Emergency-services warning', 'policy.ert':'Emergency Response Team',
'policy.enNote':'English text is a demo translation — final wording needs professional review.',
'policy.chargeEn':'Expatriate support has no service charge — only the actual cost and transport are borne by the applicant.',
'policy.disclaimerEn':'This service is not a replacement for official emergency services — call 999 first.',
'policy.ertEn':'Emergency Response Team: 3–5 people.',
'system.title':'System', 'system.lang':'Default language', 'system.theme':'Default theme', 'system.saIdle':'Super Admin idle timeout (minutes)',
'system.helperIdle':'Helper idle timeout (minutes)', 'system.absolute':'Maximum session (hours)', 'system.retention':'Retention policy',
'system.retentionNote':'Retention periods will be confirmed at handover (AO-16). The audit log is kept permanently.',
'system.persistNote':'Language / theme choice is session-only in this prototype (Q-20 open).', 'system.links':'Related',
'system.dataRights':'Data-rights requests', 'system.services':'Service catalogue', 'system.health':'System health',
'sessions.title':'Sessions & security', 'sessions.note':'This section is simulated — not real session management.',
'sessions.current':'Current session', 'sessions.device':'This browser (demo)', 'sessions.logoutAll':'Log out of all devices',
'sessions.loggedOut':'Logged out of all devices (simulated).', 'sessions.mfaTitle':'Two-step verification (MFA)',
'sessions.mfaNote':'Optional — whether it launches is still an open decision (AO-02). There is no MFA flow in this prototype.',
'confirm.logoutTitle':'Log out of all devices?', 'confirm.logoutBody':'All your active sessions will end; you will need to log in again.'
}};
registerStrings('settings', STRINGS);
const TABS = ['brand', 'contact', 'policy', 'system', 'sessions'];
export const Settings = {
  route: '#/settings',
  title: { bn: 'সেটিংস', en: 'Settings' },
  breadcrumb: ['nav.dashboard', 'nav.settings'],
  roles: ['super-admin'],
  permissions: ['settings.manage'],
  render(ctx){
    const tab = TABS.includes(ctx.query.tab) ? ctx.query.tab : 'brand';
    const lang = getLang();
    const s = store.settings;
    return `<span class="demo-badge">${t('app.demo')}</span><div class="view-head"><div><h1>${t('settings.title')}</h1></div></div>
    <div class="filters" role="tablist" aria-label="${esc(t('settings.title'))}">
      ${TABS.map(tb => `<a class="chip" role="tab" aria-selected="${tab === tb}" href="#/settings?tab=${tb}" aria-pressed="${tab === tb}">${t('settings.tab.' + tb)}</a>`).join('')}
    </div>
    ${tab === 'brand' ? brandHtml(s, lang) : ''}
    ${tab === 'contact' ? contactHtml(s) : ''}
    ${tab === 'policy' ? policyHtml(s, lang) : ''}
    ${tab === 'system' ? systemHtml(s, lang) : ''}
    ${tab === 'sessions' ? sessionsHtml(ctx, lang) : ''}`;
  },
  onMount(ctx){ bindSettings(ctx); },
  onUnmount(){}
};
function saveBtn(){ return `<button type="submit" class="btn btn-primary">${t('settings.save')}</button>`; }
function brandHtml(s, lang){
  return `<section class="card"><h3>${t('settings.brand.title')}</h3>
  <form id="settings-form" data-tab="brand" novalidate>
  ${field({ id: 'name_bn', label: t('settings.brand.nameBn'), value: s.brand.name_bn || '', required: true })}
  ${field({ id: 'name_en', label: t('settings.brand.nameEn'), value: s.brand.name_en || '' })}
  ${field({ id: 'tagline_bn', label: t('settings.brand.tagBn'), value: s.brand.tagline_bn || '', required: true })}
  ${field({ id: 'tagline_en', label: t('settings.brand.tagEn'), value: s.brand.tagline_en || '', hint: t('settings.brand.enMissing') })}
  ${field({ id: 'slogan_bn', label: t('settings.brand.sloganBn'), value: s.brand.slogan_bn || '', required: true })}
  ${field({ id: 'slogan_en', label: t('settings.brand.sloganEn'), value: s.brand.slogan_en || '', hint: t('settings.brand.enMissing') })}
  ${saveBtn()}</form></section>`;
}
function contactHtml(s){
  const c = s.contact;
  const pending = v => v === 'তথ্য হালনাগাদ হচ্ছে' || !v;
  const rows = [
    ['address_bn', t('settings.contact.address'), c.address_bn],
    ['phone_bn', t('settings.contact.phone'), c.phone_bn],
    ['email_bn', t('settings.contact.email'), c.email_bn],
    ['hours_bn', t('settings.contact.hours'), c.hours_bn]
  ];
  return `<section class="card"><h3>${t('settings.contact.title')}</h3>
  <p class="small muted">${t('settings.contact.note')}</p>
  <dl class="kv mt-4">${rows.map(([, label, v]) => `<dt>${esc(label)}</dt><dd>${pending(v) ? t('settings.contact.pending') : esc(v)}</dd>`).join('')}</dl>
  <form id="settings-form" data-tab="contact" novalidate class="mt-6">
  ${rows.map(([id, label]) => field({ id, label, value: '', hint: t('settings.contact.enterHint') })).join('')}
  ${saveBtn()}</form></section>`;
}
function policyHtml(s, lang){
  const p = s.policy;
  const items = [
    ['no_service_charge_bn', t('settings.policy.charge'), p.no_service_charge_bn, t('settings.policy.chargeEn')],
    ['disclaimer_999_bn', t('settings.policy.disclaimer'), p.disclaimer_999_bn, t('settings.policy.disclaimerEn')],
    ['ert_size_bn', t('settings.policy.ert'), p.ert_size_bn, t('settings.policy.ertEn')]
  ];
  return `<section class="card"><h3>${t('settings.policy.title')}</h3>
  <p class="small muted">${t('settings.policy.note')}</p>
  <form id="settings-form" data-tab="policy" novalidate class="mt-4">
  ${items.map(([id, label, val, en]) => field({ id, label, type: 'textarea', value: val || '', rows: 3, hint: en + ' — ' + t('settings.policy.enNote') })).join('')}
  ${saveBtn()}</form></section>`;
}
function systemHtml(s, lang){
  const sys = s.system;
  return `<section class="card"><h3>${t('settings.system.title')}</h3>
  <dl class="kv">
    <dt>${t('settings.system.lang')}</dt><dd>${sys.language_default === 'bn' ? 'বাংলা' : 'English'}</dd>
    <dt>${t('settings.system.theme')}</dt><dd>${sys.theme_default === 'light' ? 'Light' : 'Dark'}</dd>
    <dt>${t('settings.system.saIdle')}</dt><dd>${fmtNum(sys.session_sa_idle_min, lang)}</dd>
    <dt>${t('settings.system.helperIdle')}</dt><dd>${fmtNum(sys.session_helper_idle_min, lang)}</dd>
    <dt>${t('settings.system.absolute')}</dt><dd>${fmtNum(sys.session_absolute_h, lang)}</dd>
    <dt>${t('settings.system.retention')}</dt><dd>${t('settings.system.retentionNote')}</dd>
  </dl>
  <p class="small muted mt-4">${t('settings.system.persistNote')}</p>
  <h3 class="mt-6">${t('settings.system.links')}</h3>
  <p class="mt-4"><a class="btn btn-secondary" href="#/data-rights">${t('settings.system.dataRights')}</a>
  <a class="btn btn-secondary" href="#/services">${t('settings.system.services')}</a>
  <a class="btn btn-secondary" href="#/health">${t('settings.system.health')}</a></p></section>`;
}
function sessionsHtml(ctx, lang){
  return `<section class="card"><h3>${t('settings.sessions.title')}</h3>
  <p class="small muted">${t('settings.sessions.note')}</p>
  <dl class="kv mt-4">
    <dt>${t('settings.sessions.current')}</dt><dd>${esc(ctx.user.name_bn)} · <span class="num">${esc(ctx.user.phone)}</span></dd>
    <dt>${t('settings.sessions.device')}</dt><dd>${t('app.simulated')}</dd>
  </dl>
  <div class="row mt-4"><button type="button" class="btn btn-secondary" data-logout-all>${t('settings.sessions.logoutAll')}</button></div>
  <h3 class="mt-6">${t('settings.sessions.mfaTitle')}</h3>
  <p class="small muted mt-4">${t('settings.sessions.mfaNote')}</p></section>`;
}
function bindSettings(ctx){
  const root = document.getElementById('view');
  if(!root) return;
  const form = root.querySelector('#settings-form');
  if(form) form.addEventListener('submit', e => {
    e.preventDefault();
    const tab = form.dataset.tab;
    const data = new FormData(form);
    const s = store.settings;
    if(tab === 'brand'){
      s.brand.name_bn = data.get('name_bn') || s.brand.name_bn;
      s.brand.name_en = data.get('name_en') || s.brand.name_en;
      s.brand.tagline_bn = data.get('tagline_bn') || s.brand.tagline_bn;
      s.brand.tagline_en = data.get('tagline_en') || s.brand.tagline_en;
      s.brand.slogan_bn = data.get('slogan_bn') || s.brand.slogan_bn;
      s.brand.slogan_en = data.get('slogan_en') || s.brand.slogan_en;
    }
    if(tab === 'contact'){
      for(const k of ['address_bn', 'phone_bn', 'email_bn', 'hours_bn']){
        const v = String(data.get(k) || '').trim();
        if(v) s.contact[k] = v;
      }
    }
    if(tab === 'policy'){
      for(const k of ['no_service_charge_bn', 'disclaimer_999_bn', 'ert_size_bn']){
        const v = String(data.get(k) || '').trim();
        if(v) s.policy[k] = v;
      }
    }
    writeAudit(ctx.user.id, ctx.role, 'settings.change', 'settings', tab, '—', 'updated');
    ctx.rerender();
    ctx.toast(t('settings.saved'));
  });
  const lo = root.querySelector('[data-logout-all]');
  if(lo) lo.addEventListener('click', () => {
    ctx.modal({ title: t('settings.confirm.logoutTitle'), body: `<p>${esc(t('settings.confirm.logoutBody'))}</p>`,
      confirmLabel: t('settings.sessions.logoutAll'), danger: true,
      onConfirm: () => {
        writeAudit(ctx.user.id, ctx.role, 'sessions.logout_all', 'user', ctx.user.id, null, 'revoked');
        ctx.toast(t('settings.sessions.loggedOut'));
      } });
  });
}
