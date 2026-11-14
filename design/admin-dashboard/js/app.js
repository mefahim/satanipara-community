// app.js v2 — boot, hash router, STABLE shell, view mounting, theme/lang init.
// BN + light defaults on first load, unconditional setTheme('light'), session-only,
// never prefers-color-scheme. Router uses dynamic import() per route (see lib/router.js):
// a not-yet-built view file fails to import and renders a "module in build" state.
//
// DS v2 architecture (audit D-02, D-05): the shell renders ONCE per signed-in user
// (buildShell) and only #view re-renders per route. #modal-root, #drawer-root and
// #toasts live OUTSIDE #app (see index.html) so modals, drawers and toasts survive
// navigation — the 350ms `rerender(); setTimeout(toast, 350)` pattern in views is
// now harmless but no longer needed. All shell controls are bound ONCE via a
// single delegated document click listener (bindShellOnce); nothing re-binds per
// render, so no listener can leak. View onUnmount() is now actually called.
import { t, getLang, setLang } from './i18n.js';
import { parseHash, matchRoute, loadView } from './lib/router.js';
import { getSession, getUser, logout, switchUser } from './lib/auth.js';
import { store, counts, unreadCount, activeSuperAdmins } from './lib/store.js';
import { can, deniedHtml, notFoundHtml, buildingHtml } from './lib/guards.js';
import { toast } from './components/toast.js';
import { openModal } from './components/modal.js';
import { openDrawer } from './components/drawer.js';
import { openSheet } from './components/sheet.js';
import { icon } from './components/icons.js';
import { fmtBDT, esc } from './lib/format.js';

let theme = 'light';
export function setTheme(th){ theme = th === 'dark' ? 'dark' : 'light'; document.documentElement.setAttribute('data-theme', theme); updateThemeIcon(); }
export function getTheme(){ return theme; }

// Nav data — ONE implementation driven by role + viewport (css/shell.css).
// `icon` is an icons.js name (never emoji). Bottom nav shows primary
// destinations only; everything else lives in the drawer / More sheet.
const NAV_SA = [
  { group:'nav.overview', items:[ { key:'nav.dashboard', href:'#/dashboard', path:'/dashboard', icon:'dashboard' } ] },
  { group:'nav.operations', items:[
    { key:'nav.expatriate', href:'#/expatriate', path:'/expatriate', icon:'expatriate' },
    { key:'nav.blood', href:'#/blood/requests', path:'/blood/requests', icon:'blood' } ] },
  { group:'nav.community', items:[
    { key:'nav.members', href:'#/members', path:'/members', icon:'members' },
    { key:'nav.approvals', href:'#/members?status=pending', path:'/members', query:{status:'pending'}, icon:'approvals' },
    { key:'nav.households', href:'#/households', path:'/households', icon:'households' },
    { key:'nav.directory', href:'#/directory', path:'/directory', icon:'directory' },
    { key:'nav.professionals', href:'#/directory?kind=professionals', path:'/directory', query:{kind:'professionals'}, icon:'professionals' },
    { key:'nav.institutions', href:'#/directory?kind=institutions', path:'/directory', query:{kind:'institutions'}, icon:'institutions' },
    { key:'nav.infrastructure', href:'#/infrastructure', path:'/infrastructure', icon:'infrastructure' },
    { key:'nav.freedom', href:'#/freedom-fighters', path:'/freedom-fighters', icon:'freedom' } ] },
  { group:'nav.organisation', items:[
    { key:'nav.history', href:'#/organisation/history', path:'/organisation/history', icon:'history' },
    { key:'nav.constitution', href:'#/organisation/constitution', path:'/organisation/constitution', icon:'constitution' },
    { key:'nav.committee', href:'#/organisation/committee', path:'/organisation/committee', icon:'committee' },
    { key:'nav.advisory', href:'#/organisation/committee?tab=advisory', path:'/organisation/committee', query:{tab:'advisory'}, icon:'advisory' },
    { key:'nav.former', href:'#/organisation/committee?tab=former', path:'/organisation/committee', query:{tab:'former'}, icon:'former' },
    { key:'nav.achievements', href:'#/organisation/achievements', path:'/organisation/achievements', icon:'achievements' } ] },
  { group:'nav.activities', items:[
    { key:'nav.annual', href:'#/activities', path:'/activities', icon:'annual' },
    { key:'nav.categories', href:'#/activities/categories', path:'/activities/categories', icon:'categories' },
    { key:'nav.archives', href:'#/activities/archives', path:'/activities/archives', icon:'archives' } ] },
  { group:'nav.content', items:[
    { key:'nav.notices', href:'#/content/notices', path:'/content/notices', icon:'notices' },
    { key:'nav.news', href:'#/content/news', path:'/content/news', icon:'news' },
    { key:'nav.events', href:'#/content/events', path:'/content/events', icon:'events' },
    { key:'nav.jobs', href:'#/content/jobs', path:'/content/jobs', icon:'jobs' },
    { key:'nav.student', href:'#/content/achievements', path:'/content/achievements', icon:'student' },
    { key:'nav.gallery', href:'#/gallery', path:'/gallery', icon:'gallery' },
    { key:'nav.faq', href:'#/faq', path:'/faq', icon:'faq' },
    { key:'nav.media', href:'#/media', path:'/media', icon:'media' } ] },
  { group:'nav.finance', items:[
    { key:'nav.financeOverview', href:'#/finance', path:'/finance', icon:'finance' },
    { key:'nav.ledger', href:'#/finance/ledger', path:'/finance/ledger', icon:'ledger' },
    { key:'nav.pendingFinance', href:'#/finance/pending', path:'/finance/pending', icon:'pending' },
    { key:'nav.projects', href:'#/finance/projects', path:'/finance/projects', icon:'projects' },
    { key:'nav.financeCategories', href:'#/finance/categories', path:'/finance/categories', icon:'financeCategories' },
    { key:'nav.summaries', href:'#/finance/summaries', path:'/finance/summaries', icon:'summaries' },
    { key:'nav.reports', href:'#/finance/reports', path:'/finance/reports', icon:'reports' } ] },
  { group:'nav.communication', items:[
    { key:'nav.notifications', href:'#/notifications', path:'/notifications', icon:'notifications' },
    { key:'nav.deliveryLog', href:'#/notifications/log', path:'/notifications/log', icon:'deliveryLog' } ] },
  { group:'nav.administration', items:[
    { key:'nav.users', href:'#/users', path:'/users', icon:'users' },
    { key:'nav.roles', href:'#/roles', path:'/roles', icon:'roles' },
    { key:'nav.audit', href:'#/audit', path:'/audit', icon:'audit' },
    { key:'nav.health', href:'#/health', path:'/health', icon:'health' },
    { key:'nav.settings', href:'#/settings', path:'/settings', icon:'settings' } ] }
];
const NAV_EH = [
  { group:'nav.overview', items:[ { key:'nav.dashboard', href:'#/dashboard', path:'/dashboard', icon:'dashboard' } ] },
  { group:'nav.operations', items:[ { key:'nav.expatriate', href:'#/expatriate', path:'/expatriate', icon:'expatriate' } ] },
  { group:'nav.communication', items:[ { key:'nav.notifications', href:'#/notifications', path:'/notifications', icon:'notifications' } ] },
  { group:'nav.administration', items:[ { key:'nav.profile', href:'#/profile', path:'/profile', icon:'profile' } ] }
];
// Bottom nav — primary destinations only (mobile <640px).
const BOTTOM_SA = [
  { key:'nav.dashboard', href:'#/dashboard', path:'/dashboard', icon:'dashboard' },
  { key:'nav.expatriate', href:'#/expatriate', path:'/expatriate', icon:'expatriate' },
  { key:'nav.members', href:'#/members', path:'/members', icon:'members' },
  { key:'nav.financeOverview', href:'#/finance', path:'/finance', icon:'finance' }
];
const BOTTOM_EH = [
  { key:'nav.dashboard', href:'#/dashboard', path:'/dashboard', icon:'dashboard' },
  { key:'nav.expatriate', href:'#/expatriate', path:'/expatriate', icon:'expatriate' },
  { key:'nav.notifications', href:'#/notifications', path:'/notifications', icon:'notifications' },
  { key:'nav.profile', href:'#/profile', path:'/profile', icon:'profile' }
];

let currentView = null;
let currentTitle = '';
let currentCrumbs = [];
let shellKey = null; // user id the current shell was built for ('anon' = signed out)
let shellBound = false;
let mobileSheetEl = null;

export const shell = {
  setTitle(title){ currentTitle = title; const el = document.getElementById('page-title'); if(el) el.textContent = title; document.title = title ? `${title} — ${t('app.name')}` : t('app.name'); },
  setBreadcrumb(keys){ currentCrumbs = keys; renderCrumbs(); },
  setCounts(c){ const el = document.getElementById('bell-count'); if(el){ const n = c.unreadNotifications ?? 0; el.textContent = n > 99 ? '99+' : String(n); el.style.display = n ? 'flex' : 'none'; } },
  modal: openModal, toast, drawer: openDrawer, sheet: openSheet
};
window.shell = shell;

function crumbHref(key){
  if(key === 'dashboard' || key === 'nav.dashboard') return '#/dashboard';
  const groups = [...NAV_SA, ...NAV_EH];
  for(const g of groups){
    if(g.group === key) return g.items[0].href; // group label -> first item in the group
    const it = g.items.find(i => i.key === key);
    if(it) return it.href;
  }
  return '#/dashboard';
}
function renderCrumbs(){
  const el = document.getElementById('crumbs');
  if(!el) return;
  // Audit D-04 fix: every non-final crumb links to its REAL parent route,
  // never to #/dashboard. Final crumb is plain bold text.
  el.innerHTML = currentCrumbs.map((k, i) => { const label = k === 'dashboard' ? t('nav.dashboard') : t(k); return i === currentCrumbs.length - 1 ? `<b>${esc(label)}</b>` : `<a href="${crumbHref(k)}">${esc(label)}</a><span class="sep">›</span>`; }).join('');
}
function isActive(item, path, query){
  if(item.query){ if(path !== item.path) return false; return Object.entries(item.query).every(([k,v]) => query[k] === v); }
  return path === item.path || path.startsWith(item.path + '/');
}
function navHtml(role, path, query){
  const groups = role === 'expatriate-helper' ? NAV_EH : NAV_SA;
  return groups.map(g => `<div class="nav-group"><div class="nav-group-label">${esc(t(g.group))}</div>
    ${g.items.map(it => `<a class="nav-item${isActive(it, path, query) ? ' active' : ''}" href="${it.href}" ${isActive(it, path, query) ? 'aria-current="page"' : ''}><span class="nav-ico" aria-hidden="true">${icon(it.icon)}</span><span>${esc(t(it.key))}</span></a>`).join('')}</div>`).join('');
}
function bottomNavHtml(role, path, query){
  const items = role === 'expatriate-helper' ? BOTTOM_EH : BOTTOM_SA;
  const links = items.map(it => `<a href="${it.href}" class="${isActive(it, path, query) ? 'active' : ''}" ${isActive(it, path, query) ? 'aria-current="page"' : ''}>${icon(it.icon, 22)}<span>${esc(t(it.key))}</span></a>`).join('');
  return `${links}<a href="#" data-open-more role="button" aria-label="${esc(t('nav.more'))}">${icon('more', 22)}<span>${esc(t('nav.more'))}</span></a>`;
}
function shellHtml(user, path, query){
  const oneAdmin = user.role === 'super-admin' && activeSuperAdmins() === 1;
  const unread = unreadCount(user.id);
  return `<a class="skip-link" href="#view">Skip to content</a>
  <div class="shell">
    <aside class="sidebar" aria-label="Main navigation">
      <div class="sidebar-head"><div class="crest">সা</div><div><div class="brand">${esc(t('app.name'))}</div><div class="tagline">${esc(t('app.tagline'))}</div></div>
      <button type="button" class="icon-btn nav-collapse" id="nav-collapse-btn" aria-label="${esc(t('nav.collapse'))}" aria-expanded="true">${icon('back')}</button></div>
      <nav class="nav" id="side-nav">${navHtml(user.role, path, query)}</nav>
    </aside>
    <div class="main">
      <header class="topbar">
        <button type="button" class="icon-btn nav-toggle" id="nav-toggle" aria-label="${esc(t('common.menu'))}">${icon('menu')}</button>
        <div><h1 id="page-title">${esc(currentTitle || t('dashboard.title'))}</h1><div class="crumbs" id="crumbs"></div></div>
        <div class="topbar-spacer"></div>
        <div class="seg" role="group" aria-label="${esc(t('common.language'))}">
          <button type="button" data-lang="bn" aria-pressed="${getLang() === 'bn'}">বাংলা</button>
          <button type="button" data-lang="en" aria-pressed="${getLang() === 'en'}">EN</button>
        </div>
        <button type="button" class="icon-btn" id="theme-toggle" aria-label="${esc(t('common.theme'))}"></button>
        <a class="icon-btn" href="#/notifications" aria-label="${esc(t('common.notifications'))}">${icon('notifications')}<span class="count" id="bell-count" style="display:${unread ? 'flex' : 'none'}">${unread > 99 ? '99+' : unread}</span></a>
        <span class="role-badge">${user.role === 'super-admin' ? 'Super Admin' : 'Helper'}</span>
        <div class="user-menu"><button type="button" class="icon-btn" id="user-menu-btn" aria-label="User menu" aria-haspopup="true">${icon('profile')}</button>
          <div class="user-menu-panel" id="user-menu-panel" hidden>
            <div style="padding:8px 12px"><strong>${esc(user.name_bn)}</strong><br><span class="small muted">${esc(user.phone)}</span></div><hr>
            <p class="small muted" style="padding:4px 12px">${esc(t('common.demoSwitch'))}</p>
            ${['u-sa1', 'u-sa2', 'u-h1'].map(id => { const a = store.users.find(u => u.id === id); return a ? `<button type="button" data-switch-user="${a.id}">${esc(a.name_bn)} — <span class="num">${esc(a.phone)}</span>${a.id === user.id ? ' ✓' : ''}</button>` : ''; }).join('')}
            <hr><button type="button" data-go="#/profile">${esc(t('nav.profile'))}</button>
            <button type="button" data-logout>${esc(t('common.logout'))}</button>
          </div></div>
      </header>
      <div class="banner" id="one-admin-banner" role="alert" ${oneAdmin ? '' : 'hidden'}><span aria-hidden="true">${icon('alert')}</span><span><strong>${esc(t('banner.oneAdmin'))}</strong></span></div>
      <main class="view" id="view" tabindex="-1"></main>
    </div>
    <nav class="bottomnav" id="bottom-nav" aria-label="Primary">${bottomNavHtml(user.role, path, query)}</nav>
  </div>`;
}
function updateThemeIcon(){
  const th = document.getElementById('theme-toggle');
  if(th) th.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
}
// Re-render ONLY the chrome that depends on role / route / language / theme.
// Never touches #view, #modal-root, #drawer-root or #toasts.
function updateShellChrome(user, path, query){
  const sideNav = document.getElementById('side-nav');
  if(sideNav) sideNav.innerHTML = navHtml(user.role, path, query);
  const bottom = document.getElementById('bottom-nav');
  if(bottom) bottom.innerHTML = bottomNavHtml(user.role, path, query);
  document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === getLang())));
  const banner = document.getElementById('one-admin-banner');
  if(banner) banner.hidden = !(user.role === 'super-admin' && activeSuperAdmins() === 1);
  updateThemeIcon();
  renderCrumbs();
}
function buildShell(user, path, query){
  const app = document.getElementById('app');
  app.innerHTML = shellHtml(user, path, query);
  shellKey = user.id;
  updateThemeIcon();
}
function buildAnonShell(){
  const app = document.getElementById('app');
  app.innerHTML = `<div class="shell"><div class="main"><main class="view" id="view" tabindex="-1"></main></div></div>`;
  shellKey = 'anon';
}
// Mobile sheet (hamburger + bottom-nav "More"): full grouped nav + lang/theme.
function openMobileSheet(user){
  closeMobileSheet();
  const { path, query } = parseHash(location.hash);
  const el = document.createElement('div');
  el.innerHTML = `<div class="sheet-backdrop" data-close></div><div class="mobile-sheet" role="dialog" aria-modal="true" aria-label="${esc(t('common.menu'))}"><div class="row"><strong class="grow">${esc(t('app.name'))}</strong><button type="button" class="icon-btn" data-close aria-label="${esc(t('common.close'))}">${icon('close')}</button></div><div class="row" style="padding:12px"><div class="seg" role="group" aria-label="${esc(t('common.language'))}"><button type="button" data-sheet-lang="bn" aria-pressed="${getLang() === 'bn'}">বাংলা</button><button type="button" data-sheet-lang="en" aria-pressed="${getLang() === 'en'}">EN</button></div><button type="button" class="btn btn-secondary btn-sm" data-sheet-theme>${esc(t('common.theme'))}</button></div><nav class="nav">${navHtml(user.role, path, query)}</nav></div>`;
  document.body.appendChild(el);
  mobileSheetEl = el;
  const onKey = e => { if(e.key === 'Escape'){ e.stopPropagation(); closeMobileSheet(); const nt = document.getElementById('nav-toggle'); if(nt) nt.focus(); } };
  el._onKey = onKey;
  document.addEventListener('keydown', onKey, true);
}
function closeMobileSheet(){
  if(!mobileSheetEl) return;
  if(mobileSheetEl._onKey) document.removeEventListener('keydown', mobileSheetEl._onKey, true);
  mobileSheetEl.remove();
  mobileSheetEl = null;
}
// ONE delegated click listener for the whole shell, bound once in boot()
// (audit D-02 fix). It survives shell rebuilds because it lives on document;
// per-element listeners are never added, so nothing can leak per render.
function bindShellOnce(){
  if(shellBound) return;
  shellBound = true;
  document.addEventListener('click', e => {
    const langBtn = e.target.closest('[data-lang]');
    if(langBtn){ setLang(langBtn.dataset.lang); render(); return; }
    const sheetLang = e.target.closest('[data-sheet-lang]');
    if(sheetLang){ setLang(sheetLang.dataset.sheetLang); closeMobileSheet(); render(); return; }
    if(e.target.closest('#theme-toggle') || e.target.closest('[data-sheet-theme]')){ setTheme(theme === 'dark' ? 'light' : 'dark'); return; }
    const umb = e.target.closest('#user-menu-btn');
    const panel = document.getElementById('user-menu-panel');
    if(umb && panel){ panel.hidden = !panel.hidden; return; }
    const sw = e.target.closest('[data-switch-user]');
    if(sw){
      const u = switchUser(sw.dataset.switchUser);
      if(u){ if(panel) panel.hidden = true; location.hash = '#/dashboard'; render(); }
      return;
    }
    const go = e.target.closest('[data-go]');
    if(go){ if(panel) panel.hidden = true; location.hash = go.dataset.go; return; }
    if(e.target.closest('[data-logout]')){ logout(); location.hash = '#/login'; render(); return; }
    if(e.target.closest('#nav-toggle') || e.target.closest('[data-open-more]')){
      e.preventDefault();
      const user = getUser();
      if(user) openMobileSheet(user);
      return;
    }
    const nc = e.target.closest('#nav-collapse-btn');
    if(nc){
      const sh = document.querySelector('.shell');
      if(sh){ const collapsed = sh.classList.toggle('nav-collapsed'); nc.setAttribute('aria-expanded', String(!collapsed)); }
      return;
    }
    if(e.target.closest('[data-close]')){ closeMobileSheet(); return; }
    if(e.target.closest('.mobile-sheet .nav-item')){ closeMobileSheet(); return; }
    // Click outside the user menu closes it.
    if(panel && !e.target.closest('.user-menu')) panel.hidden = true;
  });
}
function makeCtx(route, user, path, query){
  return {
    params: route.params || {}, query, path, role: user ? user.role : null, user,
    store, t, format: { fmtBDT }, modal: openModal, toast, drawer: openDrawer, sheet: openSheet, shell,
    rerender: () => render()
  };
}
async function renderView(path, query, user){
  const mount = document.getElementById('view');
  if(!mount) return;
  const route = matchRoute(path);
  const showInView = (html, titleKey, crumbs) => {
    mount.innerHTML = html;
    shell.setTitle(t(titleKey));
    shell.setBreadcrumb(crumbs);
  };
  if(!route){ showInView(notFoundHtml(), 'notfound.title', ['nav.dashboard']); return; }
  if(route.pattern === '/denied'){ if(!user){ location.hash = '#/login'; return; } showInView(deniedHtml(''), 'denied.title', ['nav.dashboard']); return; }
  if(route.pattern === '/404'){ if(!user){ location.hash = '#/login'; return; } showInView(notFoundHtml(), 'notfound.title', ['nav.dashboard']); return; }
  if(route.roles && !user){ location.hash = '#/login'; return; }
  // Role guard + permission guard (DS v2, audit D-18 — WIRED, not removed):
  // route.permissions[] are now enforced via can(); the first missing
  // permission is named on the denied screen.
  if(route.roles && user && !route.roles.includes(user.role)){
    showInView(deniedHtml(route.permissions[0] || ''), 'denied.title', ['nav.dashboard']); return;
  }
  if(route.permissions && route.permissions.length && user){
    const missing = route.permissions.filter(p => !can(user.role, p));
    if(missing.length){ showInView(deniedHtml(missing[0]), 'denied.title', ['nav.dashboard']); return; }
  }
  let view;
  try { view = await loadView(route); }
  catch (err){
    // Not-yet-built view: "module in build" state, never a blank page or crash.
    showInView((path.startsWith('/expatriate') ? `<div class="disclaimer-999" role="note">${esc(t('disclaimer.999'))}</div>` : '') + buildingHtml(path), 'building.title', ['nav.dashboard']);
    return;
  }
  const ctx = makeCtx(route, user, path, query);
  // onUnmount is now actually called (audit D-16 fix).
  if(currentView && typeof currentView.onUnmount === 'function'){ try { currentView.onUnmount(); } catch (_) { /* prototype: ignore */ } }
  currentView = view;
  const isExpat = path.startsWith('/expatriate');
  mount.innerHTML = (isExpat ? `<div class="disclaimer-999" role="note">${esc(t('disclaimer.999'))}</div>` : '') + view.render(ctx);
  shell.setTitle(view.title ? (getLang() === 'bn' ? view.title.bn : view.title.en) : t('dashboard.title'));
  shell.setBreadcrumb(view.breadcrumb || ['dashboard']);
  if(user) shell.setCounts({ unreadNotifications: unreadCount(user.id), ...counts() });
  if(view.onMount) view.onMount(ctx);
}
async function render(){
  const { path, query } = parseHash(location.hash);
  const user = getUser();
  const app = document.getElementById('app');
  const isLogin = path.startsWith('/login');
  if(!user && !isLogin){ location.hash = '#/login'; return; }
  if(!user){
    // Signed out: minimal shell, login view fills #view.
    if(shellKey !== 'anon') buildAnonShell();
    app.classList.remove('auth-mode');
    await renderView(path, query, null);
    return;
  }
  if(shellKey !== user.id) buildShell(user, path, query);
  // Logged-in user on a login route sees the login/onboarding view with the
  // shell chrome hidden (auth-mode), exactly as v1 rendered it full-page.
  app.classList.toggle('auth-mode', isLogin);
  if(!isLogin) updateShellChrome(user, path, query);
  await renderView(path, query, user);
}
function boot(){
  setTheme('light'); // unconditional — light opens by default, never prefers-color-scheme.
  setLang('bn');
  document.documentElement.lang = 'bn';
  bindShellOnce();
  window.addEventListener('hashchange', render);
  render();
}
boot();
