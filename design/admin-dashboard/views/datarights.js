// datarights.js — Data-rights queue (Super Admin only). No sidebar item: reached
// via links from #/users and #/settings. Deletion has a 30-day grace period;
// records are ANONYMISED, not deleted, where finance/request records exist.
// AO-11 (which name fields are anonymised) is still undecided — noted, not guessed.
// v2: shared statGrid + renderTable (stacked on mobile, sortable), grace days
// measured against the live clock instead of the frozen 2026-11-14 date.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store, writeAudit, now } from '../js/lib/store.js';
import { fmtDate, fmtNum, esc } from '../js/lib/format.js';
import { plainBadge } from '../js/components/badges.js';
import { renderTable, bindTableSort } from '../js/components/table.js';
import { statGrid } from '../js/components/stat.js';
const STRINGS = {
bn: {
'title':'তথ্য-অধিকার অনুরোধ', 'note':'সদস্যদের তথ্য পাওয়া / সংশোধন / মোছার অনুরোধ। এই পাতা সাইডবারে নেই — #/users ও #/settings থেকে আসা যায়।',
'type.access':'তথ্য পাওয়া', 'type.correction':'সংশোধন', 'type.deletion':'মুছে ফেলা',
'status.pending':'অপেক্ষমাণ', 'status.in_progress':'চলমান', 'status.in_grace':'গ্রেস সময়ে', 'status.completed':'সম্পন্ন', 'status.cancelled':'বাতিল',
'col.type':'ধরন', 'col.member':'সদস্য', 'col.status':'অবস্থা', 'col.requested':'অনুরোধের তারিখ', 'col.grace':'গ্রেস শেষ', 'col.actions':'কাজ',
'grace.daysLeft':'দিন বাকি', 'grace.note':'মুছে ফেলার অনুরোধে ৩০ দিনের গ্রেস সময় থাকে। গ্রেস শেষে রেকর্ড মুছে ফেলা নয় — বেনামী করা হয়।',
'anon.note':'অর্থ বা প্রবাসী অনুরোধের রেকর্ড থাকলে সদস্যের তথ্য বেনামী করা হয়, মুছে ফেলা হয় না। কোন নামের ক্ষেত্র বেনামী হবে, তা এখনো চূড়ান্ত হয়নি (AO-11)।',
'act.start':'শুরু করুন', 'act.complete':'সম্পন্ন করুন', 'act.anonymise':'বেনামী করা সম্পন্ন করুন', 'act.cancelReq':'অনুরোধ বাতিল করুন',
'msg.started':'অনুরোধের কাজ শুরু হয়েছে।', 'msg.completed':'অনুরোধ সম্পন্ন হয়েছে।',
'msg.anonymised':'বেনামী করা সম্পন্ন হয়েছে — অর্থ/অনুরোধের রেকর্ড বেনামী অবস্থায় রাখা হয়েছে।',
'msg.cancelled':'অনুরোধ বাতিল করা হয়েছে।',
'confirm.anonTitle':'বেনামী করা সম্পন্ন করবেন?', 'confirm.anonBody':'সদস্যের ব্যক্তিগত তথ্য বেনামী করা হবে; অর্থ বা প্রবাসী অনুরোধের রেকর্ড বেনামী অবস্থায় থাকবে। এই কাজ ফেরানো যায় না।',
'confirm.cancelTitle':'অনুরোধ বাতিল করবেন?', 'confirm.cancelBody':'সদস্যের অনুরোধ বাতিল হবে; তার তথ্য আগের মতোই থাকবে।',
'confirm.completeTitle':'অনুরোধ সম্পন্ন করবেন?', 'confirm.completeBody':'অনুরোধটি সম্পন্ন বলে চিহ্নিত হবে।'
},
en: {
'title':'Data-rights requests', 'note':'Member requests for access / correction / deletion. No sidebar item — reached from #/users and #/settings.',
'type.access':'Access', 'type.correction':'Correction', 'type.deletion':'Deletion',
'status.pending':'Pending', 'status.in_progress':'In progress', 'status.in_grace':'In grace', 'status.completed':'Completed', 'status.cancelled':'Cancelled',
'col.type':'Type', 'col.member':'Member', 'col.status':'Status', 'col.requested':'Requested', 'col.grace':'Grace ends', 'col.actions':'Actions',
'grace.daysLeft':'days left', 'grace.note':'A deletion request has a 30-day grace period. At the end of grace the record is anonymised, not deleted.',
'anon.note':'Where finance or expatriate-request records exist, the member\u2019s data is anonymised, not deleted. Which name fields are anonymised is still undecided (AO-11).',
'act.start':'Start', 'act.complete':'Complete', 'act.anonymise':'Complete anonymisation', 'act.cancelReq':'Cancel request',
'msg.started':'Work on the request started.', 'msg.completed':'Request completed.',
'msg.anonymised':'Anonymisation completed — finance / request records are kept anonymised.',
'msg.cancelled':'Request cancelled.',
'confirm.anonTitle':'Complete anonymisation?', 'confirm.anonBody':'The member\u2019s personal data will be anonymised; finance or expatriate-request records stay anonymised. This cannot be undone.',
'confirm.cancelTitle':'Cancel this request?', 'confirm.cancelBody':'The member\u2019s request will be cancelled; their data stays as it is.',
'confirm.completeTitle':'Mark this request complete?', 'confirm.completeBody':'The request will be marked complete.'
}};
registerStrings('datarights', STRINGS);
function memberName(id, lang){
  const m = store.members.find(x => x.id === id);
  if(!m) return id;
  return (lang === 'bn' ? m.name_bn : m.name_en) + (m.member_id ? ' · ' + m.member_id : '');
}
function daysLeft(iso){
  if(!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso) - now()) / 86400000));
}
export const DataRights = {
  route: '#/data-rights',
  title: { bn: 'তথ্য-অধিকার অনুরোধ', en: 'Data-rights requests' },
  breadcrumb: ['nav.dashboard', 'nav.users'],
  roles: ['super-admin'],
  permissions: ['data_rights.manage'],
  render(ctx){
    const lang = getLang();
    const rows = [...store.data_requests].sort((a, b) => b.requested_at.localeCompare(a.requested_at));
    const sort = ctx.query.sort ? { key: ctx.query.sort, dir: ctx.query.dir === 'desc' ? 'desc' : 'asc' } : null;
    const countBy = s => store.data_requests.filter(r => r.status === s).length;
    return `<span class="demo-badge">${t('app.demo')}</span><div class="view-head"><div><h1>${t('datarights.title')}</h1><p class="sub muted">${t('datarights.note')}</p></div></div>
    ${statGrid([
      { num: fmtNum(countBy('pending'), lang), label: t('datarights.status.pending') },
      { num: fmtNum(countBy('in_progress'), lang), label: t('datarights.status.in_progress') },
      { num: fmtNum(countBy('in_grace'), lang), label: t('datarights.status.in_grace') },
      { num: fmtNum(countBy('completed'), lang), label: t('datarights.status.completed') }
    ])}
    <section class="card"><p>${t('datarights.grace.note')}</p><p class="small muted mt-4">${t('datarights.anon.note')}</p></section>
    <section class="card">${renderTable({ columns: [
      { key: 'type', label: t('datarights.col.type'), sortable: true, render: r => plainBadge(t('datarights.type.' + r.type)) },
      { key: 'member_id', label: t('datarights.col.member'), render: r => esc(memberName(r.member_id, lang)) },
      { key: 'status', label: t('datarights.col.status'), sortable: true, render: r => plainBadge(t('datarights.status.' + r.status)) },
      { key: 'requested_at', label: t('datarights.col.requested'), sortable: true, render: r => fmtDate(r.requested_at, lang) },
      { key: 'grace_ends_at', label: t('datarights.col.grace'), render: r => {
        const left = daysLeft(r.grace_ends_at);
        return r.grace_ends_at ? fmtDate(r.grace_ends_at, lang) + (left !== null ? ` · ${fmtNum(left, lang)} ${t('datarights.grace.daysLeft')}` : '') : '—';
      } },
      { key: 'actions', label: t('datarights.col.actions'), render: r => `<div class="row">
        ${r.status === 'pending' ? `<button type="button" class="btn btn-secondary btn-sm" data-start="${r.id}">${t('datarights.act.start')}</button>` : ''}
        ${r.status === 'in_progress' ? `<button type="button" class="btn btn-primary btn-sm" data-complete="${r.id}">${t('datarights.act.complete')}</button>` : ''}
        ${r.status === 'in_grace' ? `<button type="button" class="btn btn-primary btn-sm" data-anon="${r.id}">${t('datarights.act.anonymise')}</button>` : ''}
        ${(r.status === 'pending' || r.status === 'in_progress' || r.status === 'in_grace') ? `<button type="button" class="btn btn-ghost btn-sm" data-cancel="${r.id}">${t('datarights.act.cancelReq')}</button>` : ''}
      </div>` }
    ], rows, page: parseInt(ctx.query.page || '1', 10), perPage: 20, stacked: true, sort })}</section>`;
  },
  onMount(ctx){ bindDataRights(ctx); },
  onUnmount(){}
};
function bindDataRights(ctx){
  const root = document.getElementById('view');
  if(!root) return;
  bindTableSort(root, (key, dir) => {
    const qs = new URLSearchParams({ ...ctx.query, sort: key, dir, page: 1 });
    location.hash = '#/data-rights?' + qs.toString();
  });
  const find = id => store.data_requests.find(x => x.id === id);
  root.querySelectorAll('[data-start]').forEach(b => b.addEventListener('click', () => {
    const r = find(b.dataset.start); if(!r) return;
    const old = r.status; r.status = 'in_progress';
    writeAudit(ctx.user.id, ctx.role, 'data_request.start', 'data_request', r.id, old, 'in_progress');
    ctx.rerender();
    ctx.toast(t('datarights.msg.started'));
  }));
  root.querySelectorAll('[data-complete]').forEach(b => b.addEventListener('click', () => {
    const r = find(b.dataset.complete); if(!r) return;
    ctx.modal({ title: t('datarights.confirm.completeTitle'), body: `<p>${esc(t('datarights.confirm.completeBody'))}</p>`,
      confirmLabel: t('datarights.act.complete'),
      onConfirm: () => {
        const old = r.status; r.status = 'completed';
        writeAudit(ctx.user.id, ctx.role, 'data_request.complete', 'data_request', r.id, old, 'completed');
        ctx.rerender();
        ctx.toast(t('datarights.msg.completed'));
      } });
  }));
  root.querySelectorAll('[data-anon]').forEach(b => b.addEventListener('click', () => {
    const r = find(b.dataset.anon); if(!r) return;
    ctx.modal({ title: t('datarights.confirm.anonTitle'), body: `<p>${esc(t('datarights.confirm.anonBody'))}</p>`,
      confirmLabel: t('datarights.act.anonymise'), danger: true,
      onConfirm: () => {
        const old = r.status; r.status = 'completed';
        writeAudit(ctx.user.id, ctx.role, 'data_request.anonymise', 'data_request', r.id, old, 'completed');
        ctx.rerender();
        ctx.toast(t('datarights.msg.anonymised'));
      } });
  }));
  root.querySelectorAll('[data-cancel]').forEach(b => b.addEventListener('click', () => {
    const r = find(b.dataset.cancel); if(!r) return;
    ctx.modal({ title: t('datarights.confirm.cancelTitle'), body: `<p>${esc(t('datarights.confirm.cancelBody'))}</p>`,
      confirmLabel: t('datarights.act.cancelReq'), danger: true,
      onConfirm: () => {
        const old = r.status; r.status = 'cancelled';
        writeAudit(ctx.user.id, ctx.role, 'data_request.cancel', 'data_request', r.id, old, 'cancelled');
        ctx.rerender();
        ctx.toast(t('datarights.msg.cancelled'));
      } });
  }));
}
