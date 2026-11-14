// content.js — Content publishing: news / notices / events / jobs / student achievements.
// Draft → Review → Published (+ scheduled via publish_at); expired notices; unverified jobs.
// All data DEMO-labelled. No OTP, no backend calls.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { setHash } from '../js/lib/router.js';
import { store, filterList, writeAudit, storeAdd, storeUpdate, now } from '../js/lib/store.js';
import { fmtDate, fmtDateTime, fmtNum, esc } from '../js/lib/format.js';
import { badge, plainBadge } from '../js/components/badges.js';
import { renderTable, bindTableRows, bindTableSort } from '../js/components/table.js';
import { statGrid } from '../js/components/stat.js';
import { renderFilters, bindFilters } from '../js/components/filters.js';
import { field } from '../js/components/forms.js';
import { emptyState } from '../js/components/states.js';
import { notFoundHtml } from '../js/lib/guards.js';
const STRINGS = {
bn: {
'list.title':'কনটেন্ট', 'list.news':'সংবাদ', 'list.notices':'নোটিশ', 'list.events':'অনুষ্ঠান', 'list.jobs':'চাকরির বিজ্ঞপ্তি', 'list.achievements':'শিক্ষার্থী অর্জন',
'list.new':'নতুন যোগ করুন', 'list.searchHint':'শিরোনাম খুঁজুন', 'list.all':'সব', 'list.colTitle':'শিরোনাম', 'list.colStatus':'অবস্থা', 'list.colDate':'তারিখ', 'list.colAuthor':'লেখক',
'status.draft':'খসড়া', 'status.review':'পর্যালোচনায়', 'status.published':'প্রকাশিত', 'status.scheduled':'নির্ধারিত', 'status.archived':'আর্কাইভ', 'status.expired':'মেয়াদোত্তীর্ণ', 'status.unverified':'যাচাই হয়নি', 'status.verified':'যাচাইকৃত',
'filter.draft':'খসড়া', 'filter.review':'পর্যালোচনায়', 'filter.published':'প্রকাশিত', 'filter.scheduled':'নির্ধারিত', 'filter.archived':'আর্কাইভ',
'act.toReview':'পর্যালোচনায় পাঠান', 'act.publish':'প্রকাশ করুন', 'act.unpublish':'প্রকাশনা প্রত্যাহার', 'act.archive':'আর্কাইভ করুন', 'act.verify':'যাচাই করুন', 'act.edit':'সম্পাদনা', 'act.delete':'মুছুন', 'act.view':'দেখুন',
'msg.toReview':'পর্যালোচনায় পাঠানো হয়েছে।', 'msg.published':'প্রকাশিত হয়েছে।', 'msg.unpublished':'খসড়ায় ফেরত নেওয়া হয়েছে।', 'msg.archived':'আর্কাইভ করা হয়েছে।', 'msg.verified':'চাকরির বিজ্ঞপ্তি যাচাই করা হয়েছে।', 'msg.saved':'সংরক্ষণ করা হয়েছে।', 'msg.deleted':'মুছে ফেলা হয়েছে (আর্কাইভ)।',
'confirm.publishTitle':'প্রকাশ করবেন?', 'confirm.publishBody':'এই আইটেমটি জনসমক্ষে প্রকাশিত হবে।', 'confirm.archiveBody':'এই আইটেমটি আর্কাইভ করা হবে; প্রয়োজনে পরে ফেরত আনা যাবে।',
'block.unverifiedTitle':'যাচাই ছাড়া প্রকাশ করা যাবে না', 'block.unverifiedBody':'এই চাকরির বিজ্ঞপ্তিটি এখনো যাচাই হয়নি। যাচাই না হওয়া বিজ্ঞপ্তি কখনো প্রকাশিত হয় না। প্রথমে যাচাই করুন।',
'detail.publishAt':'প্রকাশের সময়', 'detail.expires':'মেয়াদ শেষ', 'detail.expiredNote':'এই নোটিশের মেয়াদ শেষ হয়ে গেছে — এটি আর জনসমক্ষে সক্রিয় নয়।', 'detail.scheduledNote':'এই আইটেমটি নির্ধারিত সময়ে প্রকাশিত হবে।', 'detail.priority':'অগ্রাধিকার', 'detail.venue':'স্থান', 'detail.starts':'শুরু', 'detail.ends':'শেষ', 'detail.tag':'ট্যাগ', 'detail.author':'লেখক', 'detail.body':'বিবরণ', 'detail.student':'শিক্ষার্থী', 'detail.school':'বিদ্যালয়', 'detail.category':'বিভাগ', 'detail.bodyMissing':'বিবরণের পূর্ণ পাঠ ডেমো তথ্যে নেই — তথ্য হালনাগাদ হচ্ছে।',
'priority.urgent':'জরুরি', 'priority.normal':'সাধারণ', 'edit.titleBn':'শিরোনাম (বাংলা)', 'edit.titleEn':'শিরোনাম (ইংরেজি)', 'edit.bodyBn':'বিবরণ (বাংলা)', 'edit.bodyEn':'বিবরণ (ইংরেজি)', 'edit.tag':'ট্যাগ', 'edit.priority':'অগ্রাধিকার', 'edit.venueBn':'স্থান (বাংলা)', 'edit.start':'শুরুর সময়', 'edit.end':'শেষের সময়', 'edit.publishAt':'প্রকাশের সময় (নির্ধারিত প্রকাশনা)', 'edit.scheduleHint':'ভবিষ্যতের সময় দিলে আইটেমটি নির্ধারিত অবস্থায় থাকবে।', 'edit.author':'লেখক', 'edit.saveDraft':'খসড়া সংরক্ষণ করুন', 'edit.saveReview':'পর্যালোচনায় পাঠান', 'edit.required':'শিরোনাম (বাংলা) আবশ্যক।', 'edit.newTitle':'নতুন', 'edit.editTitle':'সম্পাদনা',
'overview.note':'চার ধরনের কনটেন্ট ও শিক্ষার্থী অর্জন এখানে পরিচালিত হয়। প্রকাশনা ধাপ: খসড়া → পর্যালোচনা → প্রকাশিত।', 'overview.totalItems':'মোট আইটেম'
},
en: {
'list.title':'Content', 'list.news':'News', 'list.notices':'Notices', 'list.events':'Events', 'list.jobs':'Job circulars', 'list.achievements':'Student achievements',
'list.new':'Add new', 'list.searchHint':'Search title', 'list.all':'All', 'list.colTitle':'Title', 'list.colStatus':'Status', 'list.colDate':'Date', 'list.colAuthor':'Author',
'status.draft':'Draft', 'status.review':'In review', 'status.published':'Published', 'status.scheduled':'Scheduled', 'status.archived':'Archived', 'status.expired':'Expired', 'status.unverified':'Unverified', 'status.verified':'Verified',
'filter.draft':'Draft', 'filter.review':'In review', 'filter.published':'Published', 'filter.scheduled':'Scheduled', 'filter.archived':'Archived',
'act.toReview':'Send to review', 'act.publish':'Publish', 'act.unpublish':'Unpublish', 'act.archive':'Archive', 'act.verify':'Verify', 'act.edit':'Edit', 'act.delete':'Delete', 'act.view':'View',
'msg.toReview':'Sent to review.', 'msg.published':'Published.', 'msg.unpublished':'Returned to draft.', 'msg.archived':'Archived.', 'msg.verified':'Job circular verified.', 'msg.saved':'Saved.', 'msg.deleted':'Deleted (archived).',
'confirm.publishTitle':'Publish this item?', 'confirm.publishBody':'This item will become public.', 'confirm.archiveBody':'This item will be archived; it can be restored later if needed.',
'block.unverifiedTitle':'Cannot publish without verification', 'block.unverifiedBody':'This job circular is not verified yet. An unverified circular is never published. Verify it first.',
'detail.publishAt':'Publish at', 'detail.expires':'Expires', 'detail.expiredNote':'This notice has expired — it is no longer active in public.', 'detail.scheduledNote':'This item will be published at the scheduled time.', 'detail.priority':'Priority', 'detail.venue':'Venue', 'detail.starts':'Starts', 'detail.ends':'Ends', 'detail.tag':'Tag', 'detail.author':'Author', 'detail.body':'Details', 'detail.student':'Student', 'detail.school':'School', 'detail.category':'Category', 'detail.bodyMissing':'Full body text is not in the demo data — updating.',
'priority.urgent':'Urgent', 'priority.normal':'Normal', 'edit.titleBn':'Title (Bengali)', 'edit.titleEn':'Title (English)', 'edit.bodyBn':'Body (Bengali)', 'edit.bodyEn':'Body (English)', 'edit.tag':'Tag', 'edit.priority':'Priority', 'edit.venueBn':'Venue (Bengali)', 'edit.start':'Start time', 'edit.end':'End time', 'edit.publishAt':'Publish at (scheduled publishing)', 'edit.scheduleHint':'A future time keeps the item scheduled.', 'edit.author':'Author', 'edit.saveDraft':'Save draft', 'edit.saveReview':'Send to review', 'edit.required':'Title (Bengali) is required.', 'edit.newTitle':'New', 'edit.editTitle':'Edit',
'overview.note':'Four content types and student achievements are managed here. Publishing steps: Draft → Review → Published.', 'overview.totalItems':'Total items'
}};
registerStrings('content', STRINGS);
const TYPES = ['news', 'notices', 'events', 'jobs', 'achievements'];
// Single live clock from the store (DS v2, audit D-03) — never a frozen date.
function titleOf(it, lang){ return lang === 'bn' ? (it.title_bn || it.title_en || '') : (it.title_en || it.title_bn || ''); }
function isExpired(p){ return p.type === 'notice' && p.expires_at && new Date(p.expires_at) < now(); }
function isScheduled(p){ return p.publish_at && new Date(p.publish_at) > now() && (p.status === 'published' || p.status === 'scheduled' || p.status === 'review'); }
function statusBadges(p, lang){
  const out = [];
  if(isExpired(p)) out.push(plainBadge(t('content.status.expired')));
  else if(isScheduled(p)) out.push(plainBadge(t('content.status.scheduled')));
  else if(p.status === 'review') out.push(plainBadge(t('content.status.review')));
  else if(p.status === 'archived') out.push(plainBadge(t('content.status.archived')));
  else out.push(badge(p.status === 'published' ? 'published' : 'draft', p.status === 'published' ? t('content.status.published') : t('content.status.draft')));
  if(p.type === 'notice' && p.priority === 'urgent') out.push(plainBadge(t('content.priority.urgent')));
  if(p.type === 'job') out.push(plainBadge(p.verified ? t('content.status.verified') : t('content.status.unverified')));
  return out.join(' ');
}
function typeLabel(type){ return t('content.list.' + (type === 'notices' ? 'notices' : type === 'news' ? 'news' : type === 'events' ? 'events' : type === 'jobs' ? 'jobs' : 'achievements')); }
function itemsFor(type){ const map = { news:'news', notices:'notice', events:'event', jobs:'job' }; return type === 'achievements' ? store.student_achievements.map(a => ({ ...a, type:'achievement', status:'published', author:'u-sa1', title_bn:a.achievement_bn, title_en:a.achievement_en, body_bn:a.achievement_bn, body_en:a.achievement_en, tag:a.category_bn })) : store.posts.filter(p => p.type === map[type]); }
function findItem(type, id){
  if(type === 'achievements') return store.student_achievements.find(a => a.id === id);
  const map = { news:'news', notices:'notice', events:'event', jobs:'job' };
  return store.posts.find(p => p.id === id && p.type === map[type]);
}
export const Content = {
  route: '#/content',
  title: { bn: 'কনটেন্ট', en: 'Content' },
  breadcrumb: ['nav.dashboard', 'nav.content'],
  roles: ['super-admin'],
  permissions: ['content.manage'],
  render(ctx){
    const lang = getLang();
    const { params, query, path } = ctx;
    const pathType = path.split('/')[2] || null;
    const type = params.type || pathType;
    ctx.shell.setTitle(t('content.list.title'));
    if(path === '/content') return overviewHtml(ctx, lang);
    if(path.endsWith('/new') && type) return editorHtml(ctx, lang, type, null);
    if(params.id && path.endsWith('/edit')){ const it = findItem(type, params.id); return it ? editorHtml(ctx, lang, type, it) : notFoundHtml(); }
    if(params.id){ const it = findItem(type, params.id); return it ? detailHtml(ctx, lang, type, it) : notFoundHtml(); }
    if(type && TYPES.includes(type)) return listHtml(ctx, lang, type);
    return listHtml(ctx, lang, 'news');
  },
  onMount(ctx){
    const root = document.getElementById('view');
    bindTableRows(root);
    const f = root.querySelector('[data-filter-q]');
    bindFilters(root, {
      onSearch: v => { const q = { ...ctx.query, q: v, page: '1' }; if(!v) delete q.q; setHash(ctx.path, q); },
      onChip: v => { const q = { ...ctx.query, status: v, page: '1' }; if(v === 'all') delete q.status; setHash(ctx.path, q); },
      onClear: () => setHash(ctx.path, {})
    });
    root.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => doAction(ctx, b.dataset.act, b.dataset.id, b.dataset.type)));
    // Real table sorting (DS v2, audit D-06): sort state lives in the query string.
    bindTableSort(root, (key, dir) => { const q = { ...ctx.query, sort: key, dir, page: '1' }; setHash(ctx.path, q); });
    const form = root.querySelector('#content-form');
    if(form) form.addEventListener('submit', e => { e.preventDefault(); saveForm(ctx, form, e.submitter && e.submitter.dataset.save); });
    if(f) f.value = ctx.query.q || '';
  },
  onUnmount(){}
};
function overviewHtml(ctx, lang){
  const all = TYPES.flatMap(itemsFor);
  const counts = { draft: 0, review: 0, published: 0 };
  all.forEach(i => { if(counts[i.status] !== undefined) counts[i.status]++; });
  const totals = statGrid([
    { num: fmtNum(all.length, lang), label: t('content.overview.totalItems') },
    { num: fmtNum(counts.draft, lang), label: t('content.status.draft') },
    { num: fmtNum(counts.review, lang), label: t('content.status.review') },
    { num: fmtNum(counts.published, lang), label: t('content.status.published') }
  ]);
  const cards = TYPES.map(ty => {
    const items = itemsFor(ty);
    const c = { draft: 0, review: 0, published: 0 };
    items.forEach(i => { if(c[i.status] !== undefined) c[i.status]++; });
    return `<section class="card"><h3>${typeLabel(ty)}</h3><p class="small muted">${t('content.list.title')} · ${fmtNum(items.length, lang)}</p>
    <p class="small">${t('content.status.draft')}: ${fmtNum(c.draft, lang)} · ${t('content.status.review')}: ${fmtNum(c.review, lang)} · ${t('content.status.published')}: ${fmtNum(c.published, lang)}</p>
    <p class="mt-4"><a class="btn btn-secondary btn-sm" href="#/content/${ty}">${t('content.act.view')}</a> <a class="btn btn-primary btn-sm" href="#/content/${ty}/new">${t('content.list.new')}</a></p></section>`;
  }).join('');
  return `<span class="demo-badge">${t('app.demo')}</span><div class="view-head"><div><h1>${t('content.list.title')}</h1><p class="sub">${t('content.overview.note')}</p></div></div>${totals}<div class="two-col mt-6">${cards}</div>`;
}
function listHtml(ctx, lang, type){
  const q = ctx.query.q || '';
  const statusF = ctx.query.status || 'all';
  let rows = filterList(itemsFor(type), { q, fields: ['title_bn', 'title_en'] });
  if(statusF === 'scheduled') rows = rows.filter(isScheduled);
  else if(statusF === 'expired') rows = rows.filter(isExpired);
  else if(statusF !== 'all') rows = rows.filter(r => r.status === statusF);
  // Default order is newest first; a ?sort=&dir= query (from the sortable table
  // headers) overrides it — renderTable sorts before paginating.
  if(!ctx.query.sort) rows.sort((a, b) => (b.publish_at || b.date || '').localeCompare(a.publish_at || a.date || ''));
  const sort = ctx.query.sort ? { key: ctx.query.sort, dir: ctx.query.dir || 'asc' } : null;
  const chips = [{ value:'all', label:t('content.list.all') }, { value:'draft', label:t('content.filter.draft') }, { value:'review', label:t('content.filter.review') }, { value:'published', label:t('content.filter.published') }, { value:'scheduled', label:t('content.filter.scheduled') }, { value:'archived', label:t('content.filter.archived') }];
  if(type === 'notices') chips.push({ value:'expired', label:t('content.status.expired') });
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${typeLabel(type)}</h1><p class="sub">${t('content.overview.note')}</p></div><div><a class="btn btn-primary" href="#/content/${type}/new">${t('content.list.new')}</a></div></div>
  ${renderFilters({ q, chips, activeChip: statusF })}
  ${renderTable({ columns: [
    { key:'title_bn', label:t('content.list.colTitle'), sortable:true, render: r => `<strong>${esc(titleOf(r, lang))}</strong><br><span class="small muted">${esc(r.tag || '')}${r.student_name_bn ? ' · ' + esc(lang === 'bn' ? r.student_name_bn : (r.student_name_en || r.student_name_bn)) : ''}</span>` },
    { key:'status', label:t('content.list.colStatus'), render: r => statusBadges(r, lang) },
    { key:'publish_at', label:t('content.list.colDate'), sortable:true, render: r => fmtDate(r.publish_at || r.date || r.start, lang) },
    { key:'author', label:t('content.list.colAuthor'), render: r => `<span class="num">${esc(r.author || '')}</span>` }
  ], rows, page: parseInt(ctx.query.page || '1', 10), perPage: 20, onRowClick: r => `#/content/${type}/${r.id}`, stacked: true, sort })}
  <p class="small muted mt-4">${t('content.list.title')} · ${fmtNum(rows.length, lang)}</p>`;
}
function detailHtml(ctx, lang, type, it){
  const isAch = type === 'achievements';
  const actions = [];
  if(!isAch){
    if(it.status === 'draft') actions.push(`<button type="button" class="btn btn-secondary" data-act="to-review" data-id="${it.id}" data-type="${type}">${t('content.act.toReview')}</button>`);
    if(it.status === 'review') actions.push(`<button type="button" class="btn btn-primary" data-act="publish" data-id="${it.id}" data-type="${type}">${t('content.act.publish')}</button>`);
    if(it.status === 'published') actions.push(`<button type="button" class="btn btn-secondary" data-act="unpublish" data-id="${it.id}" data-type="${type}">${t('content.act.unpublish')}</button>`);
    if(it.type === 'job' && !it.verified) actions.push(`<button type="button" class="btn btn-secondary" data-act="verify" data-id="${it.id}" data-type="${type}">${t('content.act.verify')}</button>`);
    if(it.status !== 'archived') actions.push(`<button type="button" class="btn btn-ghost" data-act="archive" data-id="${it.id}" data-type="${type}">${t('content.act.archive')}</button>`);
  }
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${esc(titleOf(it, lang))}</h1><p class="sub">${typeLabel(type)} · ${statusBadges(it, lang)}</p></div>
  <div><a class="btn btn-secondary" href="#/content/${type}/${it.id}/edit">${t('content.act.edit')}</a> <a class="btn btn-ghost" href="#/content/${type}">${t('common.back')}</a></div></div>
  <section class="card"><dl class="kv">
  <dt>${t('content.detail.author')}</dt><dd><span class="num">${esc(it.author || '')}</span></dd>
  ${it.publish_at ? `<dt>${t('content.detail.publishAt')}</dt><dd>${fmtDateTime(it.publish_at, lang)}</dd>` : ''}
  ${it.expires_at ? `<dt>${t('content.detail.expires')}</dt><dd>${fmtDate(it.expires_at, lang)}</dd>` : ''}
  ${it.priority ? `<dt>${t('content.detail.priority')}</dt><dd>${it.priority === 'urgent' ? t('content.priority.urgent') : t('content.priority.normal')}</dd>` : ''}
  ${it.venue_bn ? `<dt>${t('content.detail.venue')}</dt><dd>${esc(lang === 'bn' ? it.venue_bn : (it.venue_en || it.venue_bn))}</dd>` : ''}
  ${it.start ? `<dt>${t('content.detail.starts')}</dt><dd>${fmtDateTime(it.start, lang)}</dd>` : ''}
  ${it.end ? `<dt>${t('content.detail.ends')}</dt><dd>${fmtDateTime(it.end, lang)}</dd>` : ''}
  ${it.year ? `<dt>${t('content.list.colDate')}</dt><dd>${fmtNum(it.year, lang)}</dd>` : ''}
  ${isAch && it.student_name_bn ? `<dt>${t('content.detail.student')}</dt><dd>${esc(lang === 'bn' ? it.student_name_bn : (it.student_name_en || it.student_name_bn))}</dd>` : ''}
  ${isAch && it.school_bn ? `<dt>${t('content.detail.school')}</dt><dd>${esc(lang === 'bn' ? it.school_bn : (it.school_en || it.school_bn))}</dd>` : ''}
  ${isAch && it.category_bn ? `<dt>${t('content.detail.category')}</dt><dd>${esc(lang === 'bn' ? it.category_bn : (it.category_en || it.category_bn))}</dd>` : ''}
  </dl>
  <h3 class="mt-6">${t('content.detail.body')}</h3><p>${esc(lang === 'bn' ? (it.body_bn || it.body_en || '') : (it.body_en || it.body_bn || '')) || t('content.detail.bodyMissing')}</p>
  ${isExpired(it) ? `<p class="small mt-4" role="note">${t('content.detail.expiredNote')}</p>` : ''}
  ${!isExpired(it) && isScheduled(it) ? `<p class="small mt-4" role="note">${t('content.detail.scheduledNote')}</p>` : ''}
  ${it.type === 'job' && !it.verified ? `<div class="error-box mt-4" role="alert"><strong>${t('content.block.unverifiedTitle')}</strong><p class="mt-4">${t('content.block.unverifiedBody')}</p></div>` : ''}
  <div class="row mt-6">${actions.join(' ')}</div></section>`;
}
function editorHtml(ctx, lang, type, it){
  const isNew = !it;
  const v = it || {};
  const isEvent = type === 'events', isNotice = type === 'notices';
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${isNew ? t('content.edit.newTitle') : t('content.edit.editTitle')} — ${typeLabel(type)}</h1></div>
  <div><a class="btn btn-ghost" href="#/content/${type}">${t('common.back')}</a></div></div>
  <form id="content-form" class="card" data-type="${type}" data-id="${v.id || ''}" novalidate>
  ${field({ id:'f-title-bn', label:t('content.edit.titleBn'), value: v.title_bn || '', required: true })}
  ${field({ id:'f-title-en', label:t('content.edit.titleEn'), value: v.title_en || '' })}
  ${field({ id:'f-body-bn', label:t('content.edit.bodyBn'), type:'textarea', rows:4, value: v.body_bn || '' })}
  ${field({ id:'f-body-en', label:t('content.edit.bodyEn'), type:'textarea', rows:4, value: v.body_en || '' })}
  ${field({ id:'f-tag', label:t('content.edit.tag'), value: v.tag || '' })}
  ${isNotice ? `${field({ id:'f-priority', label:t('content.edit.priority'), value: v.priority || 'normal', options:[{ value:'normal', label:t('content.priority.normal') }, { value:'urgent', label:t('content.priority.urgent') }] })}
  ${field({ id:'f-expires', label:t('content.detail.expires'), type:'date', value: v.expires_at || '' })}` : ''}
  ${isEvent ? `${field({ id:'f-venue', label:t('content.edit.venueBn'), value: v.venue_bn || '' })}${field({ id:'f-start', label:t('content.edit.start'), type:'datetime-local', value: v.start ? v.start.slice(0, 16) : '' })}${field({ id:'f-end', label:t('content.edit.end'), type:'datetime-local', value: v.end ? v.end.slice(0, 16) : '' })}` : ''}
  ${field({ id:'f-publish-at', label:t('content.edit.publishAt'), type:'datetime-local', value: v.publish_at ? v.publish_at.slice(0, 16) : '', hint: t('content.edit.scheduleHint') })}
  ${field({ id:'f-author', label:t('content.edit.author'), value: v.author || ctx.user.id })}
  <div class="error" id="form-err" hidden>${t('content.edit.required')}</div>
  <div class="row mt-4"><button type="submit" class="btn btn-secondary" data-save="draft">${t('content.edit.saveDraft')}</button>
  <button type="submit" class="btn btn-primary" data-save="review">${t('content.edit.saveReview')}</button></div>
  </form>`;
}
function doAction(ctx, act, id, type){
  const post = store.posts.find(p => p.id === id);
  if(!post) return;
  const old = post.status;
  // All mutations go through the store API (DS v2, audit D-11) — never by
  // writing to an imported js/data array.
  const apply = patch => { storeUpdate('posts', p => p.id === id, patch); Object.assign(post, patch); };
  const done = (msg) => { writeAudit(ctx.user.id, ctx.role, 'content.' + act, 'post', id, old, post.status); ctx.toast(t(msg)); ctx.rerender && ctx.rerender(); };
  if(act === 'to-review'){ apply({ status:'review' }); return done('content.msg.toReview'); }
  if(act === 'unpublish'){ apply({ status:'draft', publish_at:null }); return done('content.msg.unpublished'); }
  if(act === 'archive'){
    ctx.modal({ title: t('content.act.archive'), body: `<p>${t('content.confirm.archiveBody')}</p><p class="small muted num">${esc(post.title_bn)}</p>`, confirmLabel: t('content.act.archive'), onConfirm: () => { apply({ status:'archived' }); done('content.msg.archived'); } });
    return;
  }
  if(act === 'verify'){ apply({ verified:true }); writeAudit(ctx.user.id, ctx.role, 'content.verify', 'post', id, 'unverified', 'verified'); ctx.toast(t('content.msg.verified')); ctx.rerender && ctx.rerender(); return; }
  if(act === 'publish'){
    if(post.type === 'job' && !post.verified){
      ctx.modal({ title: t('content.block.unverifiedTitle'), body: `<p>${t('content.block.unverifiedBody')}</p>`, confirmLabel: t('content.act.verify'), onConfirm: () => { apply({ verified:true }); ctx.toast(t('content.msg.verified')); ctx.rerender && ctx.rerender(); } });
      return;
    }
    ctx.modal({ title: t('content.confirm.publishTitle'), body: `<p>${t('content.confirm.publishBody')}</p><p class="small muted">${esc(post.title_bn)}</p>`, confirmLabel: t('content.act.publish'), onConfirm: () => { apply({ status:'published', publish_at: post.publish_at || new Date().toISOString() }); done('content.msg.published'); } });
  }
}
function saveForm(ctx, form, saveAs){
  const type = form.dataset.type, id = form.dataset.id;
  const titleBn = form.querySelector('#f-title-bn').value.trim();
  const err = document.getElementById('form-err');
  if(!titleBn){ err.hidden = false; form.querySelector('#f-title-bn').focus(); return; }
  const val = s => { const el = form.querySelector(s); return el ? el.value.trim() : ''; };
  const publishAt = val('#f-publish-at');
  const status = saveAs === 'review' ? 'review' : (publishAt && new Date(publishAt) > now() ? 'scheduled' : 'draft');
  const data = { title_bn: titleBn, title_en: val('#f-title-en'), body_bn: val('#f-body-bn'), body_en: val('#f-body-en'), tag: val('#f-tag'), publish_at: publishAt ? new Date(publishAt).toISOString() : null, author: val('#f-author') || ctx.user.id };
  if(type === 'notices'){ data.priority = val('#f-priority') || 'normal'; data.expires_at = val('#f-expires') || null; }
  if(type === 'events'){ data.venue_bn = val('#f-venue'); data.start = val('#f-start') ? new Date(val('#f-start')).toISOString() : null; data.end = val('#f-end') ? new Date(val('#f-end')).toISOString() : null; }
  if(id){
    const sa = type === 'achievements' ? store.student_achievements.find(a => a.id === id) : null;
    if(sa){ storeUpdate('student_achievements', a => a.id === id, { achievement_bn: titleBn, achievement_en: val('#f-title-en'), category_bn: val('#f-tag') }); writeAudit(ctx.user.id, ctx.role, 'content.update', 'post', id, null, 'updated'); }
    else {
    const post = store.posts.find(p => p.id === id);
    if(post){ const old = post.status; const patch = { ...data }; if(!(post.status === 'published' && status !== 'published')) patch.status = status; storeUpdate('posts', p => p.id === id, patch); writeAudit(ctx.user.id, ctx.role, 'content.update', 'post', id, old, patch.status || post.status); }
    }
  } else {
    const map = { news:'news', notices:'notice', events:'event', jobs:'job' };
    if(type === 'achievements'){ storeAdd('student_achievements', { id:'sa-' + Date.now(), student_name_bn:'', student_name_en:'', school_bn:'', school_en:'', achievement_bn: titleBn, achievement_en: val('#f-title-en'), category_bn: val('#f-tag'), category_en:'', year: new Date().getFullYear() }); }
    else storeAdd('posts', { id:'post-' + Date.now(), type: map[type] || type, status, verified: type === 'jobs' ? false : undefined, ...data });
    writeAudit(ctx.user.id, ctx.role, 'content.create', 'post', type, null, status);
  }
  ctx.toast(t('content.msg.saved'));
  location.hash = '#/content/' + type;
}
