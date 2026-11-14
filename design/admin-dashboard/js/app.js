// app.js — boot, hash router, shell render, view mounting, theme/lang init.
// BN + light defaults on first load, unconditional setTheme('light'), session-only,
// never prefers-color-scheme. Router uses dynamic import() per route (see lib/router.js):
// a not-yet-built view file fails to import and renders a "module in build" state.
import { t, getLang, setLang, applyI18n } from './i18n.js';
import { parseHash, matchRoute, loadView } from './lib/router.js';
import { getSession, getUser, logout, switchUser } from './lib/auth.js';
import { store, counts, unreadCount, activeSuperAdmins } from './lib/store.js';
import { can, deniedHtml, notFoundHtml, buildingHtml } from './lib/guards.js';
import { toast } from './components/toast.js';
import { openModal } from './components/modal.js';
import { openDrawer } from './components/drawer.js';
import { fmtBDT, esc } from './lib/format.js';

let theme = 'light';
export function setTheme(th){ theme = th === 'dark' ? 'dark' : 'light'; document.documentElement.setAttribute('data-theme', theme); }
export function getTheme(){ return theme; }

const NAV_SA = [
  { group:'nav.overview', items:[ { key:'nav.dashboard', href:'#/dashboard', path:'/dashboard', icon:'▦' } ] },
  { group:'nav.operations', items:[
    { key:'nav.expatriate', href:'#/expatriate', path:'/expatriate', icon:'✈' },
    { key:'nav.blood', href:'#/blood/requests', path:'/blood/requests', icon:'♥' } ] },
  { group:'nav.community', items:[
    { key:'nav.members', href:'#/members', path:'/members', icon:'👥' },
    { key:'nav.approvals', href:'#/members?status=pending', path:'/members', query:{status:'pending'}, icon:'✓' },
    { key:'nav.households', href:'#/households', path:'/households', icon:'⌂' },
    { key:'nav.directory', href:'#/directory', path:'/directory', icon:'☰' },
    { key:'nav.professionals', href:'#/directory?kind=professionals', path:'/directory', query:{kind:'professionals'}, icon:'⚕' },
    { key:'nav.institutions', href:'#/directory?kind=institutions', path:'/directory', query:{kind:'institutions'}, icon:'🏛' },
    { key:'nav.infrastructure', href:'#/infrastructure', path:'/infrastructure', icon:'⛰' },
    { key:'nav.freedom', href:'#/freedom-fighters', path:'/freedom-fighters', icon:'★' } ] },
  { group:'nav.organisation', items:[
    { key:'nav.history', href:'#/organisation/history', path:'/organisation/history', icon:'◷' },
    { key:'nav.constitution', href:'#/organisation/constitution', path:'/organisation/constitution', icon:'📜' },
    { key:'nav.committee', href:'#/organisation/committee', path:'/organisation/committee', icon:'👥' },
    { key:'nav.advisory', href:'#/organisation/committee?tab=advisory', path:'/organisation/committee', query:{tab:'advisory'}, icon:'💬' },
    { key:'nav.former', href:'#/organisation/committee?tab=former', path:'/organisation/committee', query:{tab:'former'}, icon:'◷' },
    { key:'nav.achievements', href:'#/organisation/achievements', path:'/organisation/achievements', icon:'🏆' } ] },
  { group:'nav.activities', items:[
    { key:'nav.annual', href:'#/activities', path:'/activities', icon:'📅' },
    { key:'nav.categories', href:'#/activities/categories', path:'/activities/categories', icon:'🏷' },
    { key:'nav.archives', href:'#/activities/archives', path:'/activities/archives', icon:'🗄' } ] },
  { group:'nav.content', items:[
    { key:'nav.notices', href:'#/content/notices', path:'/content/notices', icon:'📢' },
    { key:'nav.news', href:'#/content/news', path:'/content/news', icon:'📰' },
    { key:'nav.events', href:'#/content/events', path:'/content/events', icon:'🎉' },
    { key:'nav.jobs', href:'#/content/jobs', path:'/content/jobs', icon:'💼' },
    { key:'nav.student', href:'#/content/achievements', path:'/content/achievements', icon:'🎓' },
    { key:'nav.gallery', href:'#/gallery', path:'/gallery', icon:'🖼' },
    { key:'nav.faq', href:'#/faq', path:'/faq', icon:'?' },
    { key:'nav.media', href:'#/media', path:'/media', icon:'🎞' } ] },
  { group:'nav.finance', items:[
    { key:'nav.financeOverview', href:'#/finance', path:'/finance', icon:'💰' },
    { key:'nav.ledger', href:'#/finance/ledger', path:'/finance/ledger', icon:'📒' },
    { key:'nav.pendingFinance', href:'#/finance/pending', path:'/finance/pending', icon:'⏳' },
    { key:'nav.projects', href:'#/finance/projects', path:'/finance/projects', icon:'📊' },
    { key:'nav.financeCategories', href:'#/finance/categories', path:'/finance/categories', icon:'🏷' },
    { key:'nav.summaries', href:'#/finance/summaries', path:'/finance/summaries', icon:'📄' },
    { key:'nav.reports', href:'#/finance/reports', path:'/finance/reports', icon:'📑' } ] },
  { group:'nav.communication', items:[
    { key:'nav.notifications', href:'#/notifications', path:'/notifications', icon:'🔔' },
    { key:'nav.deliveryLog', href:'#/notifications/log', path:'/notifications/log', icon:'📨' } ] },
  { group:'nav.administration', items:[
    { key:'nav.users', href:'#/users', path:'/users', icon:'👤' },
    { key:'nav.roles', href:'#/roles', path:'/roles', icon:'🔑' },
    { key:'nav.audit', href:'#/audit', path:'/audit', icon:'📋' },
    { key:'nav.health', href:'#/health', path:'/health', icon:'♥' },
    { key:'nav.settings', href:'#/settings', path:'/settings', icon:'⚙' } ] }
];
const NAV_EH = [
  { group:'nav.overview', items:[ { key:'nav.dashboard', href:'#/dashboard', path:'/dashboard', icon:'▦' } ] },
  { group:'nav.operations', items:[ { key:'nav.expatriate', href:'#/expatriate', path:'/expatriate', icon:'✈' } ] },
  { group:'nav.communication', items:[ { key:'nav.notifications', href:'#/notifications', path:'/notifications', icon:'🔔' } ] },
  { group:'nav.administration', items:[ { key:'nav.profile', href:'#/profile', path:'/profile', icon:'👤' } ] }
];

let currentView = null;
let currentTitle = '';
let currentCrumbs = [];

export const shell = {
  setTitle(title){ currentTitle = title; const el = document.getElementById('page-title'); if(el) el.textContent = title; },
  setBreadcrumb(keys){ currentCrumbs = keys; renderCrumbs(); },
  setCounts(c){ const el = document.getElementById('bell-count'); if(el){ const n = c.unreadNotifications ?? 0; el.textContent = n; el.style.display = n ? 'flex' : 'none'; } },
  modal: openModal, toast, drawer: openDrawer
};
window.shell = shell;

function renderCrumbs(){
  const el = document.getElementById('crumbs');
  if(!el) return;
  el.innerHTML = currentCrumbs.map((k, i) => i === currentCrumbs.length - 1 ? `<b>${t(k)}</b>` : `<a href="#/dashboard">${t(k)}</a><span class="sep">›</span>`).join('');
}
function isActive(item, path, query){
  if(item.query){ if(path !== item.path) return false; return Object.entries(item.query).every(([k,v]) => query[k] === v); }
  return path === item.path || path.startsWith(item.path + '/');
}
function navHtml(role, path, query){
  const groups = role === 'expatriate-helper' ? NAV_EH : NAV_SA;
  return groups.map(g => `<div class="nav-group"><div class="nav-group-label">${t(g.group)}</div>
    ${g.items.map(it => `<a class="nav-item${isActive(it, path, query) ? ' active' : ''}" href="${it.href}" ${isActive(it, path, query) ? 'aria-current="page"' : ''}><span class="nav-ico" aria-hidden="true">${it.icon}</span><span>${t(it.key)}</span></a>`).join('')}</div>`).join('');
}
function shellHtml(user, path, query){
  const c = counts();
  const oneAdmin = user.role === 'super-admin' && activeSuperAdmins() === 1;
  const unread = unreadCount(user.id);
  return `<a class="skip-link" href="#view">Skip to content</a>
  <div class="shell">
    <aside class="sidebar" aria-label="Main navigation">
      <div class="sidebar-head"><div class="crest">সা</div><div><div class="brand">${t('app.name')}</div><div class="tagline">${t('app.tagline')}</div></div></div>
      <nav class="nav" id="side-nav">${navHtml(user.role, path, query)}</nav>
    </aside>
    <div class="main">
      <header class="topbar">
        <button type="button" class="icon-btn nav-toggle" id="nav-toggle" aria-label="${t('common.menu')}">☰</button>
        <div><h1 id="page-title">${currentTitle || t('dashboard.title')}</h1><div class="crumbs" id="crumbs"></div></div>
        <div class="topbar-spacer"></div>
        <div class="seg" role="group" aria-label="${t('common.language')}">
          <button type="button" data-lang="bn" aria-pressed="${getLang() === 'bn'}">বাংলা</button>
          <button type="button" data-lang="en" aria-pressed="${getLang() === 'en'}">EN</button>
        </div>
        <button type="button" class="icon-btn" id="theme-toggle" aria-label="${t('common.theme')}">${theme === 'dark' ? '☀' : '🌙'}</button>
        <a class="icon-btn" href="#/notifications" aria-label="${t('common.notifications')}">🔔<span class="count" id="bell-count" style="display:${unread ? 'flex' : 'none'}">${unread}</span></a>
        <span class="role-badge">${user.role === 'super-admin' ? 'Super Admin' : 'Helper'}</span>
        <div class="user-menu"><button type="button" class="icon-btn" id="user-menu-btn" aria-label="User menu" aria-haspopup="true">👤</button>
          <div class="user-menu-panel" id="user-menu-panel" hidden>
            <div style="padding:8px 12px"><strong>${user.name_bn}</strong><br><span class="small muted">${user.phone}</span></div><hr>
            <p class="small muted" style="padding:4px 12px">${t('common.demoSwitch')}</p>
            ${['u-sa1', 'u-sa2', 'u-h1'].map(id => { const a = store.users.find(u => u.id === id); return a ? `<button type="button" data-switch-user="${a.id}">${esc(a.name_bn)} — <span class="num">${a.phone}</span>${a.id === user.id ? ' ✓' : ''}</button>` : ''; }).join('')}
            <hr><button type="button" data-go="#/profile">${t('nav.profile')}</button>
            <button type="button" data-logout>${t('common.logout')}</button>
          </div></div>
      </header>
      ${oneAdmin ? `<div class="banner" role="alert"><span aria-hidden="true">⚠</span><span><strong>${t('banner.oneAdmin')}</strong></span></div>` : ''}
      <main class="view" id="view" tabindex="-1"></main>
    </div>
  </div>
  <div id="modal-root"></div><div id="drawer-root"></div><div id="toasts" aria-live="polite"></div>`;
}
function bindShell(user){
  document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => { setLang(b.dataset.lang); render(); }));
  const th = document.getElementById('theme-toggle');
  if(th) th.addEventListener('click', () => { setTheme(theme === 'dark' ? 'light' : 'dark'); render(); });
  const umb = document.getElementById('user-menu-btn');
  const panel = document.getElementById('user-menu-panel');
  if(umb && panel){
    umb.addEventListener('click', () => { panel.hidden = !panel.hidden; });
    document.addEventListener('click', e => { if(!e.target.closest('.user-menu')) panel.hidden = true; });
    panel.querySelectorAll('[data-switch-user]').forEach(b => b.addEventListener('click', () => {
      const u = switchUser(b.dataset.switchUser);
      if(u){ panel.hidden = true; toast(t('common.demoSwitch')); location.hash = '#/dashboard'; render(); }
    }));
    panel.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { location.hash = b.dataset.go; }));
    const lo = panel.querySelector('[data-logout]');
    if(lo) lo.addEventListener('click', () => { logout(); location.hash = '#/login'; render(); });
  }
  const nt = document.getElementById('nav-toggle');
  if(nt) nt.addEventListener('click', () => {
    const user2 = getUser();
    const { path, query } = parseHash(location.hash);
    const sheet = document.createElement('div');
    sheet.innerHTML = `<div class="sheet-backdrop" data-close></div><div class="mobile-sheet" role="dialog" aria-modal="true"><div class="row"><strong class="grow">${t('app.name')}</strong><button type="button" class="icon-btn" data-close aria-label="${t('common.close')}">✕</button></div><div class="row" style="padding:12px"><div class="seg" role="group" aria-label="${t('common.language')}"><button type="button" data-sheet-lang="bn">বাংলা</button><button type="button" data-sheet-lang="en">EN</button></div><button type="button" class="btn btn-secondary btn-sm" data-sheet-theme>${t('common.theme')}</button></div><nav class="nav">${navHtml(user2.role, path, query)}</nav></div>`;
    document.body.appendChild(sheet);
    const close = () => { sheet.remove(); document.removeEventListener('keydown', onKey, true); };
    // Esc closes the mobile sheet and returns focus to the menu button,
    // mirroring js/components/modal.js.
    const onKey = e => { if(e.key === 'Escape'){ e.stopPropagation(); close(); const nt2 = document.getElementById('nav-toggle'); if(nt2) nt2.focus(); } };
    document.addEventListener('keydown', onKey, true);
    sheet.querySelectorAll('[data-sheet-lang]').forEach(b => b.addEventListener('click', () => { setLang(b.dataset.sheetLang); close(); render(); }));
    const st = sheet.querySelector('[data-sheet-theme]');
    if(st) st.addEventListener('click', () => { setTheme(theme === 'dark' ? 'light' : 'dark'); close(); render(); });
    sheet.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
    sheet.querySelectorAll('.nav-item').forEach(a => a.addEventListener('click', close));
  });
}
function makeCtx(route, user, path, query){
  return {
    params: route.params || {}, query, path, role: user ? user.role : null, user,
    store, t, format: { fmtBDT }, modal: openModal, toast, drawer: openDrawer, shell,
    rerender: () => render()
  };
}
async function render(){
  const { path, query } = parseHash(location.hash);
  const user = getUser();
  const app = document.getElementById('app');
  const isLogin = path.startsWith('/login');
  if(!user && !isLogin){ location.hash = '#/login'; return; }
  if(user && isLogin && path === '/login'){ /* logged-in user visiting /login sees onboarding/login view; allow */ }
  const route = matchRoute(path);
  if(!route){ app.innerHTML = shellHtml(user, path, query); bindShell(user); document.getElementById('view').innerHTML = notFoundHtml(); shell.setTitle(t('notfound.title')); shell.setBreadcrumb(['nav.dashboard']); renderCrumbs(); return; }
  if(route.pattern === '/denied'){ if(!user){ location.hash = '#/login'; return; } app.innerHTML = shellHtml(user, path, query); bindShell(user); document.getElementById('view').innerHTML = deniedHtml(''); shell.setTitle(t('denied.title')); shell.setBreadcrumb(['nav.dashboard']); return; }
  if(route.pattern === '/404'){ if(!user){ location.hash = '#/login'; return; } app.innerHTML = shellHtml(user, path, query); bindShell(user); document.getElementById('view').innerHTML = notFoundHtml(); shell.setTitle(t('notfound.title')); shell.setBreadcrumb(['nav.dashboard']); return; }
  // Role guard: Helper deep-linking to a Super-Admin route -> #/denied.
  if(route.roles && user && !route.roles.includes(user.role)){
    app.innerHTML = shellHtml(user, path, query); bindShell(user);
    document.getElementById('view').innerHTML = deniedHtml(route.permissions[0] || '');
    shell.setTitle(t('denied.title')); shell.setBreadcrumb(['nav.dashboard']); return;
  }
  if(route.roles && !user){ location.hash = '#/login'; return; }
  let view;
  try { view = await loadView(route); }
  catch (err){
    // Not-yet-built view: clear "module in build" state, never a blank page or crash.
    if(isLogin){ app.innerHTML = `<div id="view"></div><div id="modal-root"></div><div id="drawer-root"></div><div id="toasts" aria-live="polite"></div>`; }
    else { app.innerHTML = shellHtml(user, path, query); bindShell(user); }
    document.getElementById('view').innerHTML = (path.startsWith('/expatriate') ? `<div class="disclaimer-999" role="note">${t('disclaimer.999')}</div>` : '') + buildingHtml(path);
    shell.setTitle(t('building.title')); return;
  }
  const ctx = makeCtx(route, user, path, query);
  if(isLogin){
    app.innerHTML = `<div id="view"></div><div id="modal-root"></div><div id="drawer-root"></div><div id="toasts" aria-live="polite"></div>`;
    document.getElementById('view').innerHTML = view.render(ctx);
    if(view.onMount) view.onMount(ctx);
    return;
  }
  app.innerHTML = shellHtml(user, path, query);
  bindShell(user);
  const mount = document.getElementById('view');
  const isExpat = path.startsWith('/expatriate');
  mount.innerHTML = (isExpat ? `<div class="disclaimer-999" role="note">${t('disclaimer.999')}</div>` : '') + view.render(ctx);
  shell.setTitle(view.title ? (getLang() === 'bn' ? view.title.bn : view.title.en) : t('dashboard.title'));
  shell.setBreadcrumb(view.breadcrumb || ['dashboard']);
  shell.setCounts({ unreadNotifications: unreadCount(user.id), ...counts() });
  if(view.onMount) view.onMount(ctx);
}
function boot(){
  setTheme('light'); // unconditional — light opens by default, never prefers-color-scheme.
  setLang('bn');
  document.documentElement.lang = 'bn';
  window.addEventListener('hashchange', render);
  render();
}
boot();
