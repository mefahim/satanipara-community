// messages.js — Contact-message inbox (Super Admin only): new / read / replied /
// resolved. Reply is stored as the record and conveyed out of band in Phase 1
// (no email provider); reply must be at least 10 characters.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store, filterList, writeAudit } from '../js/lib/store.js';
import { fmtDate, fmtDateTime, fmtPhoneMasked, esc } from '../js/lib/format.js';
import { badge, plainBadge } from '../js/components/badges.js';
import { renderTable, bindTableRows } from '../js/components/table.js';
import { renderFilters, bindFilters } from '../js/components/filters.js';
import { emptyState } from '../js/components/states.js';
import { errorSummary, validateRequired } from '../js/components/forms.js';
const STRINGS = {
bn: {
'title':'যোগাযোগ বার্তা', 'crumbDetail':'বার্তার বিবরণ', 'list.title':'যোগাযোগ বার্তা', 'list.note':'ওয়েবসাইটের যোগাযোগ ফরম থেকে আসা বার্তা।',
'filter.all':'সব', 'status.new':'নতুন', 'status.read':'পঠিত', 'status.replied':'উত্তর দেওয়া হয়েছে', 'status.resolved':'সমাধান হয়েছে',
'col.sender':'প্রেরক', 'col.phone':'ফোন', 'col.message':'বার্তা', 'col.status':'অবস্থা', 'col.date':'তারিখ',
'detail.sender':'প্রেরক', 'detail.phone':'ফোন', 'detail.received':'পাওয়া গেছে', 'detail.message':'বার্তা', 'detail.reply':'উত্তর',
'detail.noReply':'এখনো উত্তর দেওয়া হয়নি।', 'detail.replyHint':'উত্তর রেকর্ড হিসেবে সংরক্ষিত হয়; প্রথম ধাপে এটি ফোন/সরাসরি যোগাযোগের মাধ্যমে জানানো হয় (কোনো ইমেইল সেবা নেই)।',
'detail.replyLabel':'উত্তর লিখুন', 'detail.replyMin':'উত্তর কমপক্ষে ১০ অক্ষরের হতে হবে।', 'detail.replyShort':'উত্তরটি খুব ছোট — কমপক্ষে ১০ অক্ষর লিখুন।',
'detail.send':'উত্তর পাঠান', 'detail.sent':'উত্তর সংরক্ষণ করা হয়েছে।', 'detail.resolve':'সমাধান হয়েছে বলে চিহ্নিত করুন',
'detail.resolvedMsg':'বার্তাটি সমাধান হয়েছে বলে চিহ্নিত করা হয়েছে।', 'detail.resolvedNote':'এই বার্তাটি সমাধান হয়েছে।',
'confirm.resolveTitle':'সমাধান হয়েছে বলে চিহ্নিত করবেন?', 'confirm.resolveBody':'বার্তাটি সমাধান হয়েছে বলে চিহ্নিত হবে।', 'back.list':'তালিকায় ফিরুন'
},
en: {
'title':'Contact messages', 'crumbDetail':'Message detail', 'list.title':'Contact messages', 'list.note':'Messages from the website contact form.',
'filter.all':'All', 'status.new':'New', 'status.read':'Read', 'status.replied':'Replied', 'status.resolved':'Resolved',
'col.sender':'Sender', 'col.phone':'Phone', 'col.message':'Message', 'col.status':'Status', 'col.date':'Date',
'detail.sender':'Sender', 'detail.phone':'Phone', 'detail.received':'Received', 'detail.message':'Message', 'detail.reply':'Reply',
'detail.noReply':'No reply yet.', 'detail.replyHint':'The reply is stored as the record; in Phase 1 it is conveyed out of band (no email provider).',
'detail.replyLabel':'Write a reply', 'detail.replyMin':'The reply must be at least 10 characters.', 'detail.replyShort':'The reply is too short — write at least 10 characters.',
'detail.send':'Send reply', 'detail.sent':'Reply saved.', 'detail.resolve':'Mark as resolved',
'detail.resolvedMsg':'Message marked resolved.', 'detail.resolvedNote':'This message is resolved.',
'confirm.resolveTitle':'Mark this message resolved?', 'confirm.resolveBody':'The message will be marked resolved.', 'back.list':'Back to list'
}};
registerStrings('messages', STRINGS);
const STATUSES = ['new', 'read', 'replied', 'resolved'];
function statusBadge(s){
  const cls = s === 'new' ? 'pending' : s === 'read' ? 'accepted' : s === 'replied' ? 'in_progress' : 'completed';
  return badge(cls, t('messages.status.' + s));
}
export const Messages = {
  route: '#/messages',
  title: { bn: 'যোগাযোগ বার্তা', en: 'Contact messages' },
  breadcrumb: ['nav.dashboard', 'nav.communication'],
  roles: ['super-admin'],
  permissions: ['messages.view'],
  render(ctx){
    const lang = getLang();
    if(ctx.params.id) return detailHtml(ctx, lang);
    return listHtml(ctx, lang);
  },
  onMount(ctx){ bindMessages(ctx); },
  onUnmount(){}
};
function head(title, note){
  return `<span class="demo-badge">${t('app.demo')}</span><div class="view-head"><div><h1>${esc(title)}</h1>${note ? `<p class="sub muted">${esc(note)}</p>` : ''}</div></div>`;
}
function listHtml(ctx, lang){
  const q = ctx.query.q || '', status = ctx.query.status || 'all';
  let rows = filterList(store.contact_messages, { q, fields: ['sender_name_bn', 'message_bn', 'phone'] });
  if(status !== 'all') rows = rows.filter(m => m.status === status);
  rows = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const chips = [{ value: 'all', label: t('messages.filter.all') }, ...STATUSES.map(s => ({ value: s, label: t('messages.status.' + s) }))];
  return `${head(t('messages.list.title'), t('messages.list.note'))}
  ${renderFilters({ q, chips, activeChip: status })}
  ${renderTable({ columns: [
    { key: 'sender_name_bn', label: t('messages.col.sender'), render: m => esc(m.sender_name_bn) },
    { key: 'phone', label: t('messages.col.phone'), render: m => `<span class="num">${fmtPhoneMasked(m.phone)}</span>` },
    { key: 'message_bn', label: t('messages.col.message'), render: m => esc(m.message_bn.length > 60 ? m.message_bn.slice(0, 60) + '…' : m.message_bn) },
    { key: 'status', label: t('messages.col.status'), render: m => statusBadge(m.status) },
    { key: 'created_at', label: t('messages.col.date'), render: m => fmtDate(m.created_at, lang) }
  ], rows, page: parseInt(ctx.query.page || '1', 10), perPage: 20, onRowClick: m => '#/messages/' + m.id, stacked: true })}`;
}
function detailHtml(ctx, lang){
  const m = store.contact_messages.find(x => x.id === ctx.params.id);
  if(!m) return `<div class="card"><h1>${t('notfound.title')}</h1><p class="mt-4">${t('notfound.body')}</p><p class="mt-4"><a class="btn btn-primary" href="#/messages">${t('messages.back.list')}</a></p></div>`;
  return `${head(esc(m.sender_name_bn))}
  <section class="card"><dl class="kv">
    <dt>${t('messages.detail.sender')}</dt><dd>${esc(m.sender_name_bn)}</dd>
    <dt>${t('messages.detail.phone')}</dt><dd><span class="num">${fmtPhoneMasked(m.phone)}</span></dd>
    <dt>${t('messages.detail.received')}</dt><dd>${fmtDateTime(m.created_at, lang)}</dd>
    <dt>${t('messages.col.status')}</dt><dd>${statusBadge(m.status)}</dd>
  </dl>
  <h3 class="mt-6">${t('messages.detail.message')}</h3><p class="mt-4">${esc(m.message_bn)}</p>
  <h3 class="mt-6">${t('messages.detail.reply')}</h3>
  ${m.reply_bn ? `<p class="mt-4">${esc(m.reply_bn)}</p>` : `<p class="muted mt-4">${t('messages.detail.noReply')}</p>`}
  ${m.status === 'resolved' ? `<p class="mt-4">${plainBadge(t('messages.status.resolved'))} ${t('messages.detail.resolvedNote')}</p>` : ''}
  <p class="mt-4"><a class="btn btn-ghost" href="#/messages">${t('messages.back.list')}</a></p></section>
  ${m.status !== 'resolved' ? `<section class="card"><h3>${t('messages.detail.replyLabel')}</h3>
  <p class="small muted">${t('messages.detail.replyHint')}</p>
  <div id="reply-summary"></div>
  <form id="reply-form" novalidate>
    <div class="field"><label for="reply-text">${t('messages.detail.replyLabel')} *</label>
    <textarea id="reply-text" name="reply-text" class="input" rows="4" required>${m.reply_bn ? esc(m.reply_bn) : ''}</textarea>
    <div class="hint">${t('messages.detail.replyMin')}</div><div class="error" id="reply-err"></div></div>
    <div class="row"><button type="submit" class="btn btn-primary">${t('messages.detail.send')}</button>
    ${m.status === 'replied' || m.status === 'read' ? `<button type="button" class="btn btn-secondary" data-resolve>${t('messages.detail.resolve')}</button>` : ''}</div>
  </form></section>` : ''}`;
}
function bindMessages(ctx){
  const root = document.getElementById('view');
  if(!root) return;
  bindTableRows(root);
  bindFilters(root, {
    onSearch: v => { const qs = { ...ctx.query, q: v, page: 1 }; location.hash = '#/messages' + hashQs(qs); },
    onChip: v => { const qs = { ...ctx.query, status: v === 'all' ? '' : v, page: 1 }; location.hash = '#/messages' + hashQs(qs); },
    onClear: () => { location.hash = '#/messages'; }
  });
  // Opening a new message marks it read (demo, in-memory).
  if(ctx.params.id){
    const m = store.contact_messages.find(x => x.id === ctx.params.id);
    if(m && m.status === 'new'){
      m.status = 'read';
      writeAudit(ctx.user.id, ctx.role, 'message.read', 'contact_message', m.id, 'new', 'read');
    }
  }
  const form = root.querySelector('#reply-form');
  if(form) form.addEventListener('submit', e => {
    e.preventDefault();
    const ta = root.querySelector('#reply-text');
    const errEl = root.querySelector('#reply-err');
    const summary = root.querySelector('#reply-summary');
    const val = ta.value;
    if(!validateRequired(val, 10)){
      errEl.textContent = t('messages.detail.replyShort');
      ta.setAttribute('aria-invalid', 'true');
      summary.innerHTML = errorSummary([{ id: 'reply-text', message: t('messages.detail.replyShort') }]);
      const s = summary.querySelector('.error-summary');
      if(s) s.focus();
      ta.focus();
      return;
    }
    const m = store.contact_messages.find(x => x.id === ctx.params.id);
    if(!m) return;
    const old = m.status;
    m.reply_bn = val.trim();
    m.status = 'replied';
    writeAudit(ctx.user.id, ctx.role, 'message.reply', 'contact_message', m.id, old, 'replied');
    Promise.resolve(ctx.rerender()).then(() => ctx.toast(t('messages.detail.sent')));
  });
  const res = root.querySelector('[data-resolve]');
  if(res) res.addEventListener('click', () => {
    ctx.modal({ title: t('messages.confirm.resolveTitle'), body: `<p>${esc(t('messages.confirm.resolveBody'))}</p>`,
      confirmLabel: t('messages.detail.resolve'),
      onConfirm: () => {
        const m = store.contact_messages.find(x => x.id === ctx.params.id);
        if(!m) return;
        const old = m.status; m.status = 'resolved';
        writeAudit(ctx.user.id, ctx.role, 'message.resolve', 'contact_message', m.id, old, 'resolved');
        Promise.resolve(ctx.rerender()).then(() => ctx.toast(t('messages.detail.resolvedMsg')));
      } });
  });
}
function hashQs(qs){
  const str = Object.entries(qs).filter(([, v]) => v !== '' && v != null).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
  return str ? '?' + str : '';
}
