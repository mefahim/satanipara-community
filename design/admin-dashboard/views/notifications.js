// notifications.js — Own notification inbox (both roles, own inbox only) +
// delivery log (Super Admin only). Browser-permission onboarding is SIMULATED.
// Delivery states are derived in-view: the demo data has no delivery-log
// collection, so the log is built from inbox rows + the routing rule, and rows
// with no inbox record are shown as failed (labelled as such).
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store, filterList, writeAudit } from '../js/lib/store.js';
import { fmtDateTime, fmtNum, esc } from '../js/lib/format.js';
import { emptyState } from '../js/components/states.js';
import { plainBadge } from '../js/components/badges.js';
const STRINGS = {
bn: {
'title':'বিজ্ঞপ্তি', 'crumbLog':'বিতরণ লগ', 'inbox.title':'আমার বিজ্ঞপ্তি', 'inbox.note':'প্রত্যেকে শুধু নিজের ইনবক্স দেখেন।',
'inbox.unread':'অপঠিত', 'inbox.read':'পঠিত', 'inbox.all':'সব', 'inbox.markAll':'সব পঠিত করুন', 'inbox.markedAll':'সব বিজ্ঞপ্তি পঠিত করা হয়েছে।',
'inbox.markRead':'পঠিত করুন', 'inbox.marked':'পঠিত করা হয়েছে।', 'inbox.empty':'কোনো বিজ্ঞপ্তি নেই।',
'col.title':'বিজ্ঞপ্তি', 'col.type':'ধরন', 'col.time':'সময়', 'col.state':'অবস্থা', 'col.recipient':'প্রাপক', 'col.channel':'চ্যানেল',
'type.expatriate':'প্রবাসী অনুরোধ', 'type.member':'সদস্য', 'type.finance':'অর্থ', 'type.blood':'রক্ত', 'type.message':'বার্তা', 'type.system':'সিস্টেম',
'onboard.title':'ব্রাউজার বিজ্ঞপ্তি চালু করবেন?', 'onboard.body':'নতুন অনুরোধ এলে ব্রাউজারে বিজ্ঞপ্তি পাবেন। এটি একটি অনুকরণ করা ধাপ — আসল ব্রাউজার বিজ্ঞপ্তি নয়।',
'onboard.allow':'বিজ্ঞপ্তি চালু করুন', 'onboard.skip':'পরে', 'onboard.allowed':'ব্রাউজার বিজ্ঞপ্তি চালু হয়েছে (অনুকরণ)।', 'onboard.skipped':'পরে চালু করা যাবে।',
'log.title':'বিজ্ঞপ্তি বিতরণ লগ', 'log.note':'বিতরণের অবস্থা অনুকরণ করা (ডেমো)। ডেমো তথ্যে কোনো বিতরণ-লগ সংগ্রহ নেই — এই লগ ইনবক্সের সারি ও রাউটিং নিয়ম থেকে তৈরি।',
'log.routingTitle':'রাউটিং নিয়ম', 'log.routingBody':'নতুন প্রবাসী অনুরোধ সুপার অ্যাডমিন ও সব সহায়ককে জানানো হয়; জরুরি অনুরোধে ব্যাকআপ সহায়ককেও জানানো হয়।',
'log.exampleNew':'নতুন অনুরোধ EXP-2026-0014: সুপার অ্যাডমিন ও সহায়ক ১ পেয়েছেন; অন্য সহায়কদের ডেমো ইনবক্সে সারি নেই।',
'log.exampleUrgent':'জরুরি অনুরোধ EXP-2026-0013: সুপার অ্যাডমিন, দায়িত্বপ্রাপ্ত সহায়ক ১ ও ব্যাকআপ সহায়ক ২-কে জানানো হয়; ব্যাকআপ সহায়কের ডেমো ইনবক্সে সারি নেই।',
'state.delivered':'পৌঁছেছে', 'state.failed':'পৌঁছায়নি', 'state.failReason':'ডেমো ইনবক্সে কোনো সারি নেই — সক্রিয় সাবস্ক্রিপশন নেই (অনুকরণ)।',
'channel.browser':'ব্রাউজার (অনুকরণ)', 'open':'খুলুন'
},
en: {
'title':'Notifications', 'crumbLog':'Delivery log', 'inbox.title':'My notifications', 'inbox.note':'Everyone sees only their own inbox.',
'inbox.unread':'Unread', 'inbox.read':'Read', 'inbox.all':'All', 'inbox.markAll':'Mark all read', 'inbox.markedAll':'All notifications marked read.',
'inbox.markRead':'Mark read', 'inbox.marked':'Marked read.', 'inbox.empty':'No notifications.',
'col.title':'Notification', 'col.type':'Type', 'col.time':'Time', 'col.state':'State', 'col.recipient':'Recipient', 'col.channel':'Channel',
'type.expatriate':'Expatriate request', 'type.member':'Member', 'type.finance':'Finance', 'type.blood':'Blood', 'type.message':'Message', 'type.system':'System',
'onboard.title':'Enable browser notifications?', 'onboard.body':'You will be notified in the browser when a new request arrives. This is a simulated step — not a real browser notification.',
'onboard.allow':'Enable notifications', 'onboard.skip':'Later', 'onboard.allowed':'Browser notifications enabled (simulated).', 'onboard.skipped':'You can enable them later.',
'log.title':'Notification delivery log', 'log.note':'Delivery states are simulated (demo). The demo data has no delivery-log collection — this log is derived from inbox rows and the routing rule.',
'log.routingTitle':'Routing rule', 'log.routingBody':'A new expatriate request notifies the Super Admin and all Helpers; an urgent request also notifies the backup helper.',
'log.exampleNew':'New request EXP-2026-0014: the Super Admin and Helper 1 received it; the other helpers have no row in the demo inbox.',
'log.exampleUrgent':'Urgent request EXP-2026-0013: the Super Admin, assigned Helper 1 and backup Helper 2 are notified; the backup helper has no row in the demo inbox.',
'state.delivered':'Delivered', 'state.failed':'Failed', 'state.failReason':'No row in the demo inbox — no active subscription (simulated).',
'channel.browser':'Browser (simulated)', 'open':'Open'
}};
registerStrings('notifications', STRINGS);
let browserNotif = null; // null | 'allowed' | 'skipped' — session-only demo flag
function userName(id, lang){
  const u = store.users.find(x => x.id === id);
  return u ? (lang === 'bn' ? u.name_bn : u.name_en) : id;
}
function typeLabel(type){ return t('notifications.type.' + type); }
// Delivery log derived from inbox rows + routing rule. Two demo events are
// checked explicitly: the new request (EXP-2026-0014) and the urgent request
// (EXP-2026-0013). Expected recipients without an inbox row = failed (demo).
function deliveryRows(){
  const rows = store.notifications.map(n => ({ n, recipient: n.user_id, state: 'delivered', reason: '' }));
  const events = [
    { no: 'EXP-2026-0014', expected: ['u-sa1', 'u-sa2', 'u-h1', 'u-h2', 'u-h3'] },
    { no: 'EXP-2026-0013', expected: ['u-sa1', 'u-sa2', 'u-h1', 'u-h2', 'u-h3'] }
  ];
  for(const ev of events){
    const delivered = new Set(store.notifications.filter(n => (n.related || '').includes(ev.no)).map(n => n.user_id));
    for(const uid of ev.expected){
      if(!delivered.has(uid)){
        const anchor = store.notifications.find(n => (n.related || '').includes(ev.no));
        rows.push({ n: anchor || { id: 'log-' + ev.no + '-' + uid, title_bn: ev.no, title_en: ev.no, body_bn: '', body_en: '', type: 'expatriate', created_at: anchor ? anchor.created_at : '2026-11-14T10:00:00+06:00', related: '#/expatriate/' + ev.no }, recipient: uid, state: 'failed', reason: t('notifications.state.failReason') });
      }
    }
  }
  return rows.sort((a, b) => b.n.created_at.localeCompare(a.n.created_at));
}
export const Notifications = {
  route: '#/notifications',
  title: { bn: 'বিজ্ঞপ্তি', en: 'Notifications' },
  breadcrumb: ['nav.dashboard', 'nav.notifications'],
  roles: ['super-admin', 'expatriate-helper'],
  permissions: ['notifications.view'],
  render(ctx){
    const lang = getLang();
    if(ctx.path === '/notifications/log') return logHtml(ctx, lang);
    return inboxHtml(ctx, lang);
  },
  onMount(ctx){ bindNotifications(ctx); },
  onUnmount(){}
};
function head(title, note){
  return `<span class="demo-badge">${t('app.demo')}</span><div class="view-head"><div><h1>${esc(title)}</h1>${note ? `<p class="sub muted">${esc(note)}</p>` : ''}</div></div>`;
}
function inboxHtml(ctx, lang){
  const q = ctx.query.q || '', filter = ctx.query.filter || 'all', type = ctx.query.type || 'all';
  let mine = store.notifications.filter(n => n.user_id === ctx.user.id);
  mine = [...mine].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const unread = mine.filter(n => !n.read).length;
  let rows = filterList(mine, { q, fields: ['title_bn', 'title_en', 'body_bn', 'body_en'] });
  if(filter === 'unread') rows = rows.filter(n => !n.read);
  if(filter === 'read') rows = rows.filter(n => n.read);
  if(type !== 'all') rows = rows.filter(n => n.type === type);
  const typeChips = [{ value: 'all', label: t('notifications.inbox.all') }, 'expatriate', 'member', 'finance', 'blood', 'message', 'system'].map(v => ({ value: v, label: v === 'all' ? t('notifications.inbox.all') : typeLabel(v) }));
  return `${head(t('notifications.inbox.title'), t('notifications.inbox.note'))}
  ${browserNotif === null ? `<section class="card"><h3>${t('notifications.onboard.title')}</h3><p class="mt-4">${t('notifications.onboard.body')}</p>
  <div class="row mt-4"><button type="button" class="btn btn-primary" data-onboard="allow">${t('notifications.onboard.allow')}</button>
  <button type="button" class="btn btn-secondary" data-onboard="skip">${t('notifications.onboard.skip')}</button></div></section>` : ''}
  <div class="filters" role="search">
    <input class="input search-box" type="search" data-filter-q value="${esc(q)}" placeholder="${t('common.search')}…" aria-label="${t('common.search')}">
    <button type="button" class="chip" data-chip="filter:all" aria-pressed="${filter === 'all'}">${t('notifications.inbox.all')}</button>
    <button type="button" class="chip" data-chip="filter:unread" aria-pressed="${filter === 'unread'}">${t('notifications.inbox.unread')} (${fmtNum(unread, lang)})</button>
    <button type="button" class="chip" data-chip="filter:read" aria-pressed="${filter === 'read'}">${t('notifications.inbox.read')}</button>
    ${typeChips.slice(1).map(c => `<button type="button" class="chip" data-chip="type:${c.value}" aria-pressed="${type === c.value}">${esc(c.label)}</button>`).join('')}
    <button type="button" class="btn btn-ghost btn-sm" data-clear-filters>${t('common.clearFilters')}</button>
  </div>
  <div class="row mb-4"><button type="button" class="btn btn-secondary" data-mark-all ${unread ? '' : 'disabled'}>${t('notifications.inbox.markAll')}</button>
  ${ctx.role === 'super-admin' ? `<a class="btn btn-ghost" href="#/notifications/log">${t('notifications.crumbLog')}</a>` : ''}</div>
  ${rows.length ? rows.map(n => `<div class="list-row"><div class="grow${n.read ? '' : ' notif-unread'}">
    <strong>${esc(lang === 'bn' ? n.title_bn : n.title_en)}</strong> ${n.read ? '' : plainBadge(t('notifications.inbox.unread'))}<br>
    <span class="small muted">${esc(lang === 'bn' ? n.body_bn : n.body_en)}</span><br>
    <span class="small muted">${fmtDateTime(n.created_at, lang)} · ${esc(typeLabel(n.type))}</span><br>
    ${n.related ? `<a href="${esc(n.related)}">${t('notifications.open')} · <span class="num">${esc(n.related.replace('#/', ''))}</span></a>` : ''}</div>
    ${n.read ? '' : `<button type="button" class="btn btn-secondary btn-sm" data-mark-read="${n.id}">${t('notifications.inbox.markRead')}</button>`}</div>`).join('')
    : emptyState(t('notifications.inbox.empty'), '', '')}`;
}
function logHtml(ctx, lang){
  const rows = deliveryRows();
  const delivered = rows.filter(r => r.state === 'delivered').length;
  const failed = rows.filter(r => r.state === 'failed').length;
  return `${head(t('notifications.log.title'), t('notifications.log.note'))}
  <section class="card"><h3>${t('notifications.log.routingTitle')}</h3><p class="mt-4">${t('notifications.log.routingBody')}</p>
  <p class="small muted mt-4">${t('notifications.log.exampleNew')}</p><p class="small muted">${t('notifications.log.exampleUrgent')}</p></section>
  <div class="stat-grid">
    <div class="stat"><div class="num">${fmtNum(delivered, lang)}</div><div class="lbl">${t('notifications.state.delivered')}</div></div>
    <div class="stat"><div class="num">${fmtNum(failed, lang)}</div><div class="lbl">${t('notifications.state.failed')}</div></div>
  </div>
  <section class="card mt-6"><div class="table-wrap"><table class="tbl"><thead><tr>
    <th>${t('notifications.col.time')}</th><th>${t('notifications.col.title')}</th><th>${t('notifications.col.recipient')}</th><th>${t('notifications.col.channel')}</th><th>${t('notifications.col.state')}</th>
  </tr></thead><tbody>
  ${rows.map(r => `<tr><td>${fmtDateTime(r.n.created_at, lang)}</td>
    <td>${esc(lang === 'bn' ? r.n.title_bn : r.n.title_en)}${r.reason ? `<br><span class="small muted">${esc(r.reason)}</span>` : ''}</td>
    <td>${esc(userName(r.recipient, lang))}</td><td>${t('notifications.channel.browser')}</td>
    <td>${plainBadge(t('notifications.state.' + r.state))}</td></tr>`).join('')}
  </tbody></table></div></section>`;
}
function bindNotifications(ctx){
  const root = document.getElementById('view');
  if(!root) return;
  root.querySelectorAll('[data-onboard]').forEach(b => b.addEventListener('click', () => {
    browserNotif = b.dataset.onboard;
    Promise.resolve(ctx.rerender()).then(() => ctx.toast(t(browserNotif === 'allow' ? 'notifications.onboard.allowed' : 'notifications.onboard.skipped')));
  }));
  root.querySelectorAll('[data-mark-read]').forEach(b => b.addEventListener('click', () => {
    const n = store.notifications.find(x => x.id === b.dataset.markRead);
    if(n) n.read = true;
    Promise.resolve(ctx.rerender()).then(() => ctx.toast(t('notifications.inbox.marked')));
  }));
  const all = root.querySelector('[data-mark-all]');
  if(all) all.addEventListener('click', () => {
    store.notifications.filter(n => n.user_id === ctx.user.id).forEach(n => { n.read = true; });
    writeAudit(ctx.user.id, ctx.role, 'notifications.mark_all_read', 'notifications', 'own', null, 'read');
    Promise.resolve(ctx.rerender()).then(() => ctx.toast(t('notifications.inbox.markedAll')));
  });
  const q = root.querySelector('[data-filter-q]');
  if(q) q.addEventListener('change', () => {
    const qs = { ...ctx.query, q: q.value, page: 1 };
    location.hash = '#/notifications' + (Object.keys(qs).filter(k => qs[k]).length ? '?' + Object.entries(qs).filter(([, v]) => v).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&') : '');
  });
  root.querySelectorAll('[data-chip]').forEach(b => b.addEventListener('click', () => {
    const [kind, val] = b.dataset.chip.split(':');
    const qs = { ...ctx.query };
    if(kind === 'filter') qs.filter = val === 'all' ? '' : val;
    if(kind === 'type') qs.type = val === 'all' ? '' : val;
    const str = Object.entries(qs).filter(([, v]) => v).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
    location.hash = '#/notifications' + (str ? '?' + str : '');
  }));
  const clear = root.querySelector('[data-clear-filters]');
  if(clear) clear.addEventListener('click', () => { location.hash = '#/notifications'; });
}
