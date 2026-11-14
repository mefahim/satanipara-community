// Login view — mobile + password only, NO OTP anywhere. Client-side demo only (simulated).
// Demo logins printed on screen, labelled simulated (FRESH credentials, audit §3.8).
// States: login / pending / expired / forced-change, reachable from the demo-states link.
import { t } from '../js/i18n.js';
import { login, getSession } from '../js/lib/auth.js';
import { toast } from '../js/components/toast.js';
import { registerStrings } from '../js/i18n.js';
registerStrings('login', { bn: {}, en: {} }); // shell strings already cover login; namespace reserved.
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
        const res = login(phone, pw);
        if(!res.ok){
          errEl.textContent = res.error === 'locked' ? t('login.locked') : t('login.failed');
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
    }
    const go = document.getElementById('onboard-continue');
    if(go) go.addEventListener('click', () => { onboarded = true; toast(t('login.onboardingTitle')); location.hash = '#/dashboard'; });
    const allow = document.getElementById('notify-allow');
    if(allow) allow.addEventListener('click', () => { const n = document.getElementById('notify-note'); if(n) n.textContent = t('app.simulated'); });
  }
};
function shellWrap(inner){
  return `<div class="login-page"><div class="login-inner">
    <div class="login-brand"><div class="crest">সা</div>
    <h1>${t('app.name')}</h1><p>${t('app.tagline')} · শিক্ষা • ঐক্য • শান্তি • প্রগতি</p></div>
    <div class="login-sheet">${inner}</div>
    <p class="small" style="color:var(--gold-soft)">${t('app.demo')} — ${t('app.simulated')}</p>
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
  <table><tr><th>Role</th><th>Mobile</th><th>Password</th></tr>
  <tr><td>Super Admin</td><td><code>01990000000</code></td><td><code>AdminDemo-2026</code></td></tr>
  <tr><td>Super Admin 2</td><td><code>01990000002</code></td><td><code>AdminDemo-2026b</code></td></tr>
  <tr><td>Helper</td><td><code>01990000001</code></td><td><code>HelperDemo-2026</code></td></tr></table></div>
  <p class="login-state-links"><a href="#/login/pending">${t('login.demoStates')}</a> · <a href="#/login/pending">${t('login.pendingTitle')}</a> · <a href="#/login/expired">${t('login.expiredTitle')}</a> · <a href="#/login/forced">${t('login.forcedTitle')}</a></p>`);
}
function stateHtml(kind){
  const title = kind === 'pending' ? t('login.pendingTitle') : t('login.expiredTitle');
  const body = kind === 'pending' ? t('login.pendingBody') : t('login.expiredBody');
  return shellWrap(`<h2>${title}</h2><p class="mt-4">${body}</p><p class="mt-4"><a class="btn btn-primary" href="#/login">${t('common.back')}</a></p>`);
}
function forcedHtml(){
  return shellWrap(`<h2>${t('login.forcedTitle')}</h2><p class="small muted">${t('login.forcedBody')}</p>
  <form id="login-form" onsubmit="return false">
  <div class="field"><label for="npw">${t('login.newPassword')} *</label><input id="npw" type="password" class="input"><div class="hint">12+ chars; 16+ for Super Admin</div></div>
  <div class="field"><label for="cpw">${t('login.confirmPassword')} *</label><input id="cpw" type="password" class="input"></div>
  <button type="button" class="btn btn-primary btn-block" onclick="location.hash='#/login'">${t('common.save')}</button></form>
  <p class="login-state-links"><a href="#/login">${t('common.back')}</a></p>`);
}
function onboardingHtml(){
  return shellWrap(`<h2>${t('login.onboardingTitle')}</h2><p class="mt-4">${t('login.onboardingBody')}</p>
  <div class="card" style="margin-top:16px"><strong>${t('login.notifyPrompt')}</strong>
  <p class="small muted" id="notify-note"></p>
  <div class="row mt-4"><button type="button" id="notify-allow" class="btn btn-primary btn-sm">${t('login.notifyAllow')}</button>
  <button type="button" class="btn btn-secondary btn-sm" id="notify-skip">${t('login.notifySkip')}</button></div></div>
  <button type="button" id="onboard-continue" class="btn btn-primary btn-block mt-4">${t('common.confirm')}</button>`);
}
