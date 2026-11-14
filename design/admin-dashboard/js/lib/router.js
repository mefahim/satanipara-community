// router.js — hash-route table, params, guards, 404.
// ROUTE TABLE LIVES HERE (and is referenced by app.js). Module agents must NOT edit this
// file: they only create their view file at the path the table already imports.
// Dynamic import() per route: a not-yet-built view file fails to import and the shell
// renders a clear "module in build" state — never a blank page, never a crash.
export const ROUTES = [
  { pattern:'/login', file:'login', roles:null, permissions:[] },
  { pattern:'/login/pending', file:'login', roles:null, permissions:[] },
  { pattern:'/login/expired', file:'login', roles:null, permissions:[] },
  { pattern:'/login/forced', file:'login', roles:null, permissions:[] },
  { pattern:'/dashboard', file:'dashboard', roles:['super-admin','expatriate-helper'], permissions:[] },
  { pattern:'/users', file:'users', roles:['super-admin'], permissions:['users.view'] },
  { pattern:'/users/new', file:'users', roles:['super-admin'], permissions:['users.manage'] },
  { pattern:'/users/:id', file:'users', roles:['super-admin'], permissions:['users.view'] },
  { pattern:'/users/:id/edit', file:'users', roles:['super-admin'], permissions:['users.manage'] },
  { pattern:'/roles', file:'roles', roles:['super-admin'], permissions:['roles.view'] },
  { pattern:'/members', file:'members', roles:['super-admin'], permissions:['members.view'] },
  { pattern:'/members/:id', file:'members', roles:['super-admin'], permissions:['members.view'] },
  { pattern:'/members/:id/edit', file:'members', roles:['super-admin'], permissions:['members.manage'] },
  { pattern:'/organisation', file:'organisation', roles:['super-admin'], permissions:['organisation.manage'] },
  { pattern:'/organisation/history', file:'organisation', roles:['super-admin'], permissions:['organisation.manage'] },
  { pattern:'/organisation/constitution', file:'organisation', roles:['super-admin'], permissions:['organisation.manage'] },
  { pattern:'/organisation/committee', file:'organisation', roles:['super-admin'], permissions:['organisation.manage'] },
  { pattern:'/organisation/achievements', file:'organisation', roles:['super-admin'], permissions:['organisation.manage'] },
  { pattern:'/directory', file:'directory', roles:['super-admin'], permissions:['directory.view'] },
  { pattern:'/directory/new', file:'directory', roles:['super-admin'], permissions:['directory.manage'] },
  { pattern:'/directory/:id', file:'directory', roles:['super-admin'], permissions:['directory.view'] },
  { pattern:'/households', file:'households', roles:['super-admin'], permissions:['directory.view'] },
  { pattern:'/households/new', file:'households', roles:['super-admin'], permissions:['directory.manage'] },
  { pattern:'/households/:id', file:'households', roles:['super-admin'], permissions:['directory.view'] },
  { pattern:'/infrastructure', file:'directory', roles:['super-admin'], permissions:['directory.view'] },
  { pattern:'/freedom-fighters', file:'directory', roles:['super-admin'], permissions:['directory.view'] },
  { pattern:'/expatriate', file:'expatriate', roles:['super-admin','expatriate-helper'], permissions:['expatriate.requests.view'] },
  { pattern:'/expatriate/:requestNo', file:'expatriate', roles:['super-admin','expatriate-helper'], permissions:['expatriate.requests.view'] },
  { pattern:'/blood', file:'blood', roles:['super-admin'], permissions:['blood.view'] },
  { pattern:'/blood/donors', file:'blood', roles:['super-admin'], permissions:['blood.view'] },
  { pattern:'/blood/donors/:id', file:'blood', roles:['super-admin'], permissions:['blood.view'] },
  { pattern:'/blood/requests', file:'blood', roles:['super-admin'], permissions:['blood.view'] },
  { pattern:'/blood/requests/:id', file:'blood', roles:['super-admin'], permissions:['blood.view'] },
  { pattern:'/content', file:'content', roles:['super-admin'], permissions:['content.manage'] },
  { pattern:'/content/news', file:'content', roles:['super-admin'], permissions:['content.manage'] },
  { pattern:'/content/notices', file:'content', roles:['super-admin'], permissions:['content.manage'] },
  { pattern:'/content/events', file:'content', roles:['super-admin'], permissions:['content.manage'] },
  { pattern:'/content/jobs', file:'content', roles:['super-admin'], permissions:['content.manage'] },
  { pattern:'/content/achievements', file:'content', roles:['super-admin'], permissions:['content.manage'] },
  { pattern:'/content/:type/new', file:'content', roles:['super-admin'], permissions:['content.manage'] },
  { pattern:'/content/:type/:id', file:'content', roles:['super-admin'], permissions:['content.manage'] },
  { pattern:'/content/:type/:id/edit', file:'content', roles:['super-admin'], permissions:['content.manage'] },
  { pattern:'/activities', file:'activities', roles:['super-admin'], permissions:['activities.manage'] },
  { pattern:'/activities/new', file:'activities', roles:['super-admin'], permissions:['activities.manage'] },
  { pattern:'/activities/categories', file:'activities', roles:['super-admin'], permissions:['activities.manage'] },
  { pattern:'/activities/archives', file:'activities', roles:['super-admin'], permissions:['activities.manage'] },
  { pattern:'/activities/:id', file:'activities', roles:['super-admin'], permissions:['activities.manage'] },
  { pattern:'/activities/:id/edit', file:'activities', roles:['super-admin'], permissions:['activities.manage'] },
  { pattern:'/gallery', file:'gallery', roles:['super-admin'], permissions:['gallery.manage'] },
  { pattern:'/gallery/upload', file:'gallery', roles:['super-admin'], permissions:['gallery.manage'] },
  { pattern:'/gallery/video', file:'gallery', roles:['super-admin'], permissions:['gallery.manage'] },
  { pattern:'/faq', file:'faq', roles:['super-admin'], permissions:['faq.manage'] },
  { pattern:'/media', file:'gallery', roles:['super-admin'], permissions:['gallery.manage'] },
  { pattern:'/finance', file:'finance', roles:['super-admin'], permissions:['finance.view'] },
  { pattern:'/finance/ledger', file:'finance', roles:['super-admin'], permissions:['finance.view'] },
  { pattern:'/finance/new', file:'finance', roles:['super-admin'], permissions:['finance.manage'] },
  { pattern:'/finance/pending', file:'finance', roles:['super-admin'], permissions:['finance.view'] },
  { pattern:'/finance/projects', file:'finance-reports', roles:['super-admin'], permissions:['finance.view'] },
  { pattern:'/finance/categories', file:'finance-reports', roles:['super-admin'], permissions:['finance.view'] },
  { pattern:'/finance/summaries', file:'finance-reports', roles:['super-admin'], permissions:['finance.view'] },
  { pattern:'/finance/reports', file:'finance-reports', roles:['super-admin'], permissions:['finance.view'] },
  { pattern:'/finance/:entryNo', file:'finance', roles:['super-admin'], permissions:['finance.view'] },
  { pattern:'/finance/:entryNo/edit', file:'finance', roles:['super-admin'], permissions:['finance.manage'] },
  { pattern:'/finance/:entryNo/reverse', file:'finance', roles:['super-admin'], permissions:['finance.manage'] },
  { pattern:'/reports', file:'reports', roles:['super-admin'], permissions:['reports.view'] },
  { pattern:'/notifications', file:'notifications', roles:['super-admin','expatriate-helper'], permissions:['notifications.view'] },
  { pattern:'/notifications/log', file:'notifications', roles:['super-admin'], permissions:['notifications.manage'] },
  { pattern:'/messages', file:'messages', roles:['super-admin'], permissions:['messages.view'] },
  { pattern:'/messages/:id', file:'messages', roles:['super-admin'], permissions:['messages.view'] },
  { pattern:'/audit', file:'audit', roles:['super-admin'], permissions:['audit.view'] },
  { pattern:'/audit/:id', file:'audit', roles:['super-admin'], permissions:['audit.view'] },
  { pattern:'/settings', file:'settings', roles:['super-admin'], permissions:['settings.manage'] },
  { pattern:'/health', file:'health', roles:['super-admin'], permissions:['health.view'] },
  { pattern:'/data-rights', file:'datarights', roles:['super-admin'], permissions:['data_rights.manage'] },
  { pattern:'/emergency-team', file:'emergency', roles:['super-admin'], permissions:['expatriate.emergency.manage'] },
  { pattern:'/services', file:'services', roles:['super-admin'], permissions:['service_types.manage'] },
  { pattern:'/profile', file:'profile', roles:['super-admin','expatriate-helper'], permissions:['profile.view'] },
  { pattern:'/denied', file:null, roles:null, permissions:[] },
  { pattern:'/404', file:null, roles:null, permissions:[] }
];
// Shared navigation helpers (audit D-14 / R-G5-3): the one implementation of
// setHash/go/withQuery/buildQueryString/hashWithQuery. Views previously each
// carried their own copy; they now import these. setHash filters empty/null
// values and encodes with encodeURIComponent (spaces -> %20, which parseHash
// decodes; URLSearchParams '+' would NOT decode under parseHash).
export function setHash(path, query){
  const qs = Object.entries(query || {}).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    .map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
  location.hash = '#' + path + (qs ? '?' + qs : '');
}
export function go(hash){ location.hash = hash; }
export function withQuery(base, patch){
  const p = new URLSearchParams(location.hash.split('?')[1] || '');
  for(const [k, v] of Object.entries(patch)){ if(v) p.set(k, v); else p.delete(k); }
  const s = p.toString();
  return base + (s ? '?' + s : '');
}
export function buildQueryString(query, patch){
  const q = { ...(query || {}), ...(patch || {}) };
  const p = new URLSearchParams();
  for(const [k, v] of Object.entries(q)) if(v !== '' && v !== undefined && v !== null) p.set(k, v);
  const s = p.toString();
  return s ? '?' + s : '';
}
export function hashWithQuery(base, query, patch){ return base + buildQueryString(query, patch); }
export function parseHash(hash){
  const raw = (hash || '#/dashboard').replace(/^#/, '');
  const [pathPart, queryPart] = raw.split('?');
  const path = pathPart || '/dashboard';
  const query = {};
  if(queryPart) for(const pair of queryPart.split('&')){ const [k,v] = pair.split('='); if(k) query[decodeURIComponent(k)] = decodeURIComponent(v || ''); }
  return { path, query };
}
function matchPattern(pattern, path){
  const pp = pattern.split('/').filter(Boolean), ap = path.split('/').filter(Boolean);
  if(pp.length !== ap.length) return null;
  const params = {};
  for(let i=0;i<pp.length;i++){
    if(pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(ap[i]);
    else if(pp[i] !== ap[i]) return null;
  }
  return params;
}
export function matchRoute(path){
  // Longest (most specific) pattern first so /users/new beats /users/:id.
  const statics = r => r.pattern.split('/').filter(s => s && !s.startsWith(':')).length;
  const sorted = [...ROUTES].sort((a,b) => (b.pattern.split('/').length - a.pattern.split('/').length) || (statics(b) - statics(a)));
  for(const r of sorted){ const params = matchPattern(r.pattern, path); if(params) return { ...r, params }; }
  return null;
}
export async function loadView(route){
  // Dynamic import per route — a missing view file rejects here and the caller
  // renders the "module in build" state instead of crashing.
  const mod = await import(`../../views/${route.file}.js`);
  const exported = Object.values(mod).find(v => v && typeof v === 'object' && typeof v.render === 'function');
  if(!exported) throw new Error('view module has no render export: ' + route.file);
  return exported;
}
