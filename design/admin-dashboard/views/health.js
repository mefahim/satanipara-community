// health.js — System Health (Super Admin only, reachable from the Administration
// sidebar group). All values are DEMO values, labelled as such: queue status is
// computed from the demo store, the last backup comes from the demo backup
// notification, and app/DB versions come from the Phase 1 foundation report.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store, counts } from '../js/lib/store.js';
import { fmtDateTime, fmtNum, esc } from '../js/lib/format.js';
const STRINGS = {
bn: {
'title':'সিস্টেম স্বাস্থ্য', 'note':'সব মান নমুনা (ডেমো) — আসল সার্ভারের সরাসরি পাঠ নয়।',
'app.title':'অ্যাপ', 'app.value':'Laravel ১৩.৪২.০ · PHP ৮.৪.২৭', 'app.state':'চলছে (ডেমো)',
'db.title':'ডাটাবেস', 'db.value':'MariaDB ১১.৮.৯', 'db.name':'u263467780_satina6para86', 'db.state':'সংযুক্ত (ডেমো)',
'queue.title':'সারি', 'queue.open':'খোলা প্রবাসী অনুরোধ', 'queue.stale':'৭২ ঘণ্টার বেশি পুরনো চলমান অনুরোধ',
'queue.state':'সারি চলছে (ডেমো)', 'queue.none':'কোনো পুরনো অনুরোধ নেই।',
'backup.title':'সর্বশেষ সফল ব্যাকআপ', 'backup.none':'ব্যাকআপের রেকর্ড নেই।',
'backup.schedule':'সময়সূচি: প্রতিদিন ০২:০০ / ০৩:০০ · ধরে রাখা: ৩০ দিন / ১২ সপ্তাহ / ১২ মাস (ডেমো)',
'backup.method':'পদ্ধতি: mariadb-dump (লজিক্যাল ব্যাকআপ; এই হোস্টে PITR নেই)',
'backup.drill':'পুনরুদ্ধার মহড়া: এখনো রেকর্ড করা হয়নি।',
'links.audit':'অডিট লগ দেখুন', 'links.settings':'সেটিংস দেখুন'
},
en: {
'title':'System health', 'note':'All values are demo values — not live readings from the real server.',
'app.title':'App', 'app.value':'Laravel 13.42.0 · PHP 8.4.27', 'app.state':'Running (demo)',
'db.title':'Database', 'db.value':'MariaDB 11.8.9', 'db.name':'u263467780_satina6para86', 'db.state':'Connected (demo)',
'queue.title':'Queue', 'queue.open':'Open expatriate requests', 'queue.stale':'In-progress requests stale over 72 h',
'queue.state':'Queue running (demo)', 'queue.none':'No stale requests.',
'backup.title':'Last successful backup', 'backup.none':'No backup record.',
'backup.schedule':'Schedule: daily 02:00 / 03:00 · Retention: 30 days / 12 weeks / 12 months (demo)',
'backup.method':'Method: mariadb-dump (logical backup; no PITR on this host)',
'backup.drill':'Restore drill: not yet recorded.',
'links.audit':'View audit log', 'links.settings':'View settings'
}};
registerStrings('health', STRINGS);
export const Health = {
  route: '#/health',
  title: { bn: 'সিস্টেম স্বাস্থ্য', en: 'System health' },
  breadcrumb: ['nav.dashboard', 'nav.health'],
  roles: ['super-admin'],
  permissions: ['health.view'],
  render(ctx){
    const lang = getLang();
    const c = counts();
    const backupNote = store.notifications.find(n => n.type === 'system' && n.id === 'n-7');
    const stale = store.service_requests.filter(r => r.status === 'in_progress' && r.last_update_at && (new Date('2026-11-14T00:00:00+06:00') - new Date(r.last_update_at)) > 72 * 3600 * 1000);
    const stat = (label, num, sub) => `<div class="stat"><div class="num" style="font-size:2rem">${num}</div><div class="lbl">${label}${sub ? `<br><span class="small muted">${sub}</span>` : ''}</div></div>`;
    return `<span class="demo-badge">${t('app.demo')}</span><div class="view-head"><div><h1>${t('health.title')}</h1><p class="sub muted">${t('health.note')}</p></div></div>
    <div class="stat-grid">
      ${stat(t('health.app.title'), esc(t('health.app.value')), t('health.app.state'))}
      ${stat(t('health.db.title'), esc(t('health.db.value')), t('health.db.state') + ' · ' + esc(t('health.db.name')))}
      ${stat(t('health.queue.title'), fmtNum(c.openRequests, lang), t('health.queue.state'))}
      ${stat(t('health.backup.title'), backupNote ? fmtDateTime(backupNote.created_at, lang) : t('health.backup.none'), '')}
    </div>
    <section class="card mt-6"><h3>${t('health.queue.title')}</h3>
      <dl class="kv">
        <dt>${t('health.queue.open')}</dt><dd>${fmtNum(c.openRequests, lang)}</dd>
        <dt>${t('health.queue.stale')}</dt><dd>${fmtNum(c.staleRequests, lang)}</dd>
      </dl>
      <p class="small muted mt-4">${stale.length ? stale.map(r => `<a href="#/expatriate/${esc(r.request_no)}"><span class="num">${esc(r.request_no)}</span></a>`).join(', ') : t('health.queue.none')}</p></section>
    <section class="card"><h3>${t('health.backup.title')}</h3>
      <p>${backupNote ? fmtDateTime(backupNote.created_at, lang) : t('health.backup.none')}</p>
      <p class="small muted mt-4">${t('health.backup.schedule')}</p>
      <p class="small muted">${t('health.backup.method')}</p>
      <p class="small muted">${t('health.backup.drill')}</p></section>
    <p><a class="btn btn-secondary" href="#/audit">${t('health.links.audit')}</a>
    <a class="btn btn-ghost" href="#/settings">${t('health.links.settings')}</a></p>`;
  },
  onMount(){},
  onUnmount(){}
};
