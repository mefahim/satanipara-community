// Login view — mobile + password only, NO OTP anywhere. Client-side demo only (simulated).
// Demo logins printed on screen, labelled simulated. States: login / pending /
// expired / forced-change, reachable from the demo-states link.
// v2: real forced-change form (audit D-20 fix — no inline onclick), tap-to-fill
// demo accounts, per-role entry note, failed/locked states with attempts left,
// first-login onboarding + simulated notification prompt (skip now works).
import { t, registerStrings } from '../js/i18n.js';
import { login, getSession, isLocked } from '../js/lib/auth.js';
import { toast } from '../js/components/toast.js';
registerStrings('login', { bn: {
  'fill': 'পূরণ করুন', 'fillHint': 'ডেমো অ্যাকাউন্টে ট্যাপ করলে নম্বর ও পাসওয়ার্ড ফরমে বসে যাবে।',
  'roleNote': 'ভূমিকা অনুযায়ী আলাদা অভিজ্ঞতা — সুপার অ্যাডমিন সব কিছু দেখেন, সহায়ক শুধু নিজের সারি দেখেন।',
  'roleSa': 'সুপার অ্যাডমিন', 'roleHelper': 'প্রবাসী সহায়ক',
  'attemptsLeft': 'আর {n} বার চেষ্টা করা যাবে।', 'lockedHint': '৫ বার ভুল চেষ্টার পর অ্যাকাউন্ট সাময়িকভাবে বন্ধ থাকে (অনুকরণ)।',
  'welcomeRole': 'আপনি {role} হিসেবে লগইন করেছেন।',
  'forcedDone': 'পাসওয়ার্ড পরিবর্তন করা হয়েছে (অনুকরণ)।',
  'forcedErrShort': 'নতুন পাসওয়ার্ড কমপক্ষে ১২ অক্ষরের হতে হবে।',
  'forcedErrMismatch': 'দুটি নতুন পাসওয়ার্ড মেলেনি।',
  'notifySkipped': 'পরে চালু করা যাবে।'
}, en: {
  'fill': 'Fill in', 'fillHint': 'Tap a demo account to fill the number and password into the form.',
  'roleNote': 'A different experience per role — Super Admin sees everything, a Helper sees only their own queue.',
  'roleSa': 'Super Admin', 'roleHelper': 'Expatriate Helper',
  'attemptsLeft': '{n} attempts left.', 'lockedHint': 'After 5 wrong attempts the account is locked briefly (simulated).',
  'welcomeRole': 'You signed in as {role}.',
  'forcedDone': 'Password changed (simulated).',
  'forcedErrShort': 'The new password must be at least 12 characters.',
  'forcedErrMismatch': 'The two new passwords do not match.',
  'notifySkipped': 'You can enable it later.'
} });
let onboarded = false;
export const Login = {
  route: '#/login',
  title: { bn: 'অ্যাডমিন লগইন', en: 'Admin login' },
  breadcrumb: ['login'],
  roles: null,
  permissions: [],
  render(ctx){
    const path = ctx.path || '/login';
    if(path === '/login/pending') return stateHtml('pending');
    if(path === '/login/expired') return stateHtml('expired');
    if(path === '/login/forced') return forcedHtml();
    if(getSession() && !onboarded) return onboardingHtml();
    return formHtml();
  },
  onMount(ctx){
    const form = document.getElementById('login-form');
    if(form && form.mobile && form.password){
      form.addEventListener('submit', e => {
        e.preventDefault();
        const phone = form.mobile.value.trim();
        const pw = form.password.value;
        const errEl = document.getElementById('login-error');
        const summary = document.getElementById('login-summary');
        if(!phone || !pw){
          summary.innerHTML = `<div class="error-summary" tabindex="-1" role="alert">${t('common.required')}</div>`;
          summary.querySelector('.error-summary').focus();
          return;
        }
        if(isLocked(phone)){
          errEl.textContent = t('login.locked');
          form.password.setAttribute('aria-invalid', 'true');
          form.password.focus();
          return;
        }
        const res = login(phone, pw);
        if(!res.ok){
          const left = res.error === 'locked' ? 0 : Math.max(0, 5 - (res.attempts || 1));
          errEl.textContent = (res.error === 'locked' ? t('login.locked') : t('login.failed'))
            + (res.error === 'locked' ? '' : ' ' + t('login.attemptsLeft').replace('{n}', String(left)));
          form.password.setAttribute('aria-invalid', 'true');
          form.password.focus();
          return;
        }
        onboarded = false;
        if(ctx.rerender) ctx.rerender(); else location.hash = '#/dashboard';
      });
      const toggle = document.getElementById('pw-toggle');
      if(toggle) toggle.addEventListener('click', () => {
        const pw = form.password;
        const show = pw.type === 'password';
        pw.type = show ? 'text' : 'password';
        toggle.textContent = show ? t('login.hide') : t('login.show');
        toggle.setAttribute('aria-pressed', String(show));
      });
      document.querySelectorAll('[data-fill-account]').forEach(b => b.addEventListener('click', () => {
        form.mobile.value = b.dataset.phone || '';
        form.password.value = b.dataset.password || '';
        form.mobile.removeAttribute('aria-invalid');
        form.password.removeAttribute('aria-invalid');
        document.getElementById('login-error').textContent = '';
        form.querySelector('button[type="submit"]').focus();
      }));
    }
    const forced = document.getElementById('forced-form');
    if(forced) forced.addEventListener('submit', e => {
      e.preventDefault();
      const npw = forced.querySelector('#npw');
      const cpw = forced.querySelector('#cpw');
      const errEl = document.getElementById('forced-error');
      if(!npw.value || npw.value.length < 12){
        errEl.textContent = t('login.forcedErrShort');
        npw.setAttribute('aria-invalid', 'true');
        npw.focus();
        return;
      }
      if(npw.value !== cpw.value){
        errEl.textContent = t('login.forcedErrMismatch');
        cpw.setAttribute('aria-invalid', 'true');
        cpw.focus();
        return;
      }
      toast(t('login.forcedDone'));
      location.hash = '#/login';
    });
    const go = document.getElementById('onboard-continue');
    if(go) go.addEventListener('click', () => { onboarded = true; location.hash = '#/dashboard'; });
    const allow = document.getElementById('notify-allow');
    if(allow) allow.addEventListener('click', () => { const n = document.getElementById('notify-note'); if(n) n.textContent = t('app.simulated'); });
    const skip = document.getElementById('notify-skip');
    if(skip) skip.addEventListener('click', () => { const n = document.getElementById('notify-note'); if(n) n.textContent = t('login.notifySkipped'); });
  }
};
function shellWrap(inner){
  return `<div class="login-page"><div class="login-inner">
    <div class="login-brand"><div class="crest">সা</div>
    <h1 class="font-quote">${t('app.name')}</h1><p>${t('app.tagline')} · শিক্ষা • ঐক্য • শান্তি • প্রগতি</p></div>
    <div class="login-sheet">${inner}</div>
    <p class="small">${t('app.demo')} — ${t('app.simulated')}</p>
  </div><div class="login-foot">${t('app.name')} · ${t('disclaimer.999')}</div></div>`;
}
function formHtml(){
  return shellWrap(`<h2>${t('login.title')}</h2><p class="small muted">${t('login.subtitle')}</p>
  <div id="login-summary"></div>
  <form id="login-form" novalidate>
    <div class="field"><label for="mobile">${t('login.mobile')} *</label>
    <input id="mobile" name="mobile" type="tel" class="input" inputmode="tel" autocomplete="username" placeholder="01990000000">
    <div class="hint">${t('login.noRegister')}</div></div>
    <div class="field"><label for="password">${t('login.password')} *</label>
    <div class="row"><input id="password" name="password" type="password" class="input grow" autocomplete="current-password">
    <button type="button" id="pw-toggle" class="btn btn-secondary btn-sm" aria-pressed="false">${t('login.show')}</button></div>
    <div class="error" id="login-error" role="alert"></div></div>
    <button type="submit" class="btn btn-primary btn-block">${t('login.submit')}</button>
  </form>
  <div class="demo-creds"><strong>${t('login.demoHeading')}</strong>
  <p class="small muted">${t('login.fillHint')}</p>
  <p class="small muted">${t('login.roleNote')}</p>
  <table><tr><th>Role</th><th>Mobile</th><th>Password</th><th></th></tr>
  <tr><td>${t('login.roleSa')}</td><td><code>01990000000</code></td><td><code>AdminDemo-2026</code></td><td><button type="button" class="btn btn-ghost btn-sm" data-fill-account data-phone="01990000000" data-password="AdminDemo-2026">${t('login.fill')}</button></td></tr>
  <tr><td>${t('login.roleSa')} 2</td><td><code>01990000002</code></td><td><code>AdminDemo-2026b</code></td><td><button type="button" class="btn btn-ghost btn-sm" data-fill-account data-phone="01990000002" data-password="AdminDemo-2026b">${t('login.fill')}</button></td></tr>
  <tr><td>${t('login.roleHelper')}</td><td><code>01990000001</code></td><td><code>HelperDemo-2026</code></td><td><button type="button" class="btn btn-ghost btn-sm" data-fill-account data-phone="01990000001" data-password="HelperDemo-2026">${t('login.fill')}</button></td></tr></table>
  <p class="small muted">${t('login.lockedHint')}</p></div>
  <p class="login-state-links"><a class="link-more" href="#/login/pending">${t('login.demoStates')}</a> · <a class="link-more" href="#/login/pending">${t('login.pendingTitle')}</a> · <a class="link-more" href="#/login/expired">${t('login.expiredTitle')}</a> · <a class="link-more" href="#/login/forced">${t('login.forcedTitle')}</a></p>`);
}
function stateHtml(kind){
  const title = kind === 'pending' ? t('login.pendingTitle') : t('login.expiredTitle');
  const body = kind === 'pending' ? t('login.pendingBody') : t('login.expiredBody');
  return shellWrap(`<h2>${title}</h2><p class="mt-4">${body}</p><p class="mt-4"><a class="btn btn-primary" href="#/login">${t('common.back')}</a></p>`);
}
function forcedHtml(){
  return shellWrap(`<h2>${t('login.forcedTitle')}</h2><p class="small muted">${t('login.forcedBody')}</p>
  <form id="forced-form" novalidate>
  <div class="field"><label for="npw">${t('login.newPassword')} *</label><input id="npw" type="password" class="input" autocomplete="new-password"><div class="hint">12+ chars; 16+ for Super Admin</div></div>
  <div class="field"><label for="cpw">${t('login.confirmPassword')} *</label><input id="cpw" type="password" class="input" autocomplete="new-password"></div>
  <div class="error" id="forced-error" role="alert"></div>
  <button type="submit" class="btn btn-primary btn-block">${t('common.save')}</button></form>
  <p class="login-state-links"><a class="link-more" href="#/login">${t('common.back')}</a></p>`);
}
function onboardingHtml(){
  const u = getSession() ? getSession().user : null;
  const roleLabel = u ? (u.role === 'super-admin' ? t('login.roleSa') : t('login.roleHelper')) : '';
  return shellWrap(`<h2>${t('login.onboardingTitle')}</h2>
  ${u ? `<p class="mt-4">${t('login.welcomeRole').replace('{role}', roleLabel)}</p>` : ''}
  <p class="mt-4">${t('login.onboardingBody')}</p>
  <div class="card mt-4"><strong>${t('login.notifyPrompt')}</strong>
  <p class="small muted" id="notify-note"></p>
  <div class="row mt-4"><button type="button" id="notify-allow" class="btn btn-primary btn-sm">${t('login.notifyAllow')}</button>
  <button type="button" class="btn btn-secondary btn-sm" id="notify-skip">${t('login.notifySkip')}</button></div></div>
  <button type="button" id="onboard-continue" class="btn btn-primary btn-block mt-4">${t('common.confirm')}</button>`);
}
