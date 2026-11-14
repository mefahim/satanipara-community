// activities.js — Annual activities: year-grouped list, categories, annual archives.
// Create/edit with BN+EN fields, image upload preview (simulated), beneficiary count,
// linked annual report, archive workflow. All data DEMO-labelled.
// Design System v2: shared statGrid, sortable tables (?sort=&dir=), field()
// textarea/select variants, errorSummary on failed submit, no inline styles.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { setHash } from '../js/lib/router.js';
import { store, filterList, writeAudit } from '../js/lib/store.js';
import { fmtDate, fmtNum, esc } from '../js/lib/format.js';
import { badge, plainBadge } from '../js/components/badges.js';
import { renderTable, bindTableRows, bindTableSort } from '../js/components/table.js';
import { renderFilters, bindFilters } from '../js/components/filters.js';
import { field, errorSummary } from '../js/components/forms.js';
import { emptyState } from '../js/components/states.js';
import { statGrid } from '../js/components/stat.js';
const STRINGS = {
bn: {
'list.title':'বার্ষিক কার্যক্রম', 'list.new':'নতুন কার্যক্রম', 'list.colTitle':'কার্যক্রম', 'list.colYear':'বছর', 'list.colCategory':'বিভাগ', 'list.colDate':'তারিখ', 'list.colBeneficiaries':'উপকারভোগী', 'list.colStatus':'অবস্থা',
'list.yearAll':'সব বছর', 'list.catAll':'সব বিভাগ', 'list.groupedBy':'বছর অনুযায়ী সাজানো',
'list.statTotal':'মোট কার্যক্রম', 'list.statPublished':'প্রকাশিত', 'list.statArchived':'আর্কাইভ করা', 'list.statBeneficiaries':'মোট উপকারভোগী',
'status.draft':'খসড়া', 'status.published':'প্রকাশিত', 'status.archived':'আর্কাইভ',
'cat.scholarship':'বৃত্তি', 'cat.blood':'রক্তদান', 'cat.winter':'শীতবস্ত্র', 'cat.medical':'চিকিৎসা শিবির', 'cat.tree':'বৃক্ষরোপণ', 'cat.national':'জাতীয় দিবস', 'cat.relief':'ত্রাণ', 'cat.other':'অন্যান্য',
'act.publish':'প্রকাশ করুন', 'act.unpublish':'প্রত্যাহার করুন', 'act.archive':'আর্কাইভ করুন', 'act.edit':'সম্পাদনা', 'act.view':'দেখুন',
'msg.published':'প্রকাশিত হয়েছে।', 'msg.unpublished':'খসড়ায় ফেরত নেওয়া হয়েছে।', 'msg.archived':'আর্কাইভ করা হয়েছে।', 'msg.saved':'সংরক্ষণ করা হয়েছে।',
'confirm.archiveBody':'এই কার্যক্রমটি বার্ষিক আর্কাইভে যাবে; তালিকায় আর সক্রিয় হিসেবে দেখাবে না।',
'detail.beneficiaries':'উপকারভোগী', 'detail.date':'তারিখ', 'detail.category':'বিভাগ', 'detail.year':'বছর', 'detail.report':'বার্ষিক প্রতিবেদন', 'detail.reportLink':'প্রতিবেদনের সঙ্গে যুক্ত', 'detail.reportMissing':'এই কার্যক্রমের সঙ্গে এখনো কোনো বার্ষিক প্রতিবেদন যুক্ত হয়নি।', 'detail.image':'ছবি', 'detail.imageMissing':'ডেমো তথ্যে ছবি নেই — স্থানধারক হিসেবে দেখানো হচ্ছে।', 'detail.bodyMissing':'বিবরণের পূর্ণ পাঠ ডেমো তথ্যে নেই — তথ্য হালনাগাদ হচ্ছে।', 'detail.status':'অবস্থা',
'cats.title':'কার্যক্রমের বিভাগ', 'cats.note':'প্রতিটি কার্যক্রমে একটি বিভাগ আবশ্যক। বিভাগের নাম পরিবর্তন করা যায় না — নতুন বিভাগ যোগ করা ডেমোতে বন্ধ আছে।', 'cats.colName':'বিভাগ', 'cats.colCount':'কার্যক্রম',
'arch.title':'বার্ষিক আর্কাইভ', 'arch.note':'বছরভিত্তিক আর্কাইভ — আর্কাইভ করা কার্যক্রম এখানে থাকে।', 'arch.colYear':'বছর', 'arch.colTotal':'মোট কার্যক্রম', 'arch.colArchived':'আর্কাইভ', 'arch.colBeneficiaries':'মোট উপকারভোগী',
'edit.titleBn':'শিরোনাম (বাংলা)', 'edit.titleEn':'শিরোনাম (ইংরেজি)', 'edit.bodyBn':'বিবরণ (বাংলা)', 'edit.bodyEn':'বিবরণ (ইংরেজি)', 'edit.date':'তারিখ', 'edit.year':'বছর', 'edit.category':'বিভাগ', 'edit.beneficiaries':'উপকারভোগী সংখ্যা', 'edit.report':'বার্ষিক প্রতিবেদনের সঙ্গে যুক্ত করুন', 'edit.reportNone':'যুক্ত নয়', 'edit.image':'ছবি আপলোড (শুধু প্রাকদর্শন — অনুকরণ)', 'edit.imageHint':'ফাইল নির্বাচন করলে শুধু প্রাকদর্শন দেখাবে; কোথাও আপলোড হবে না।', 'edit.save':'সংরক্ষণ করুন', 'edit.required':'শিরোনাম (বাংলা) ও বিভাগ আবশ্যক।', 'edit.newTitle':'নতুন কার্যক্রম', 'edit.editTitle':'কার্যক্রম সম্পাদনা'
},
en: {
'list.title':'Annual activities', 'list.new':'New activity', 'list.colTitle':'Activity', 'list.colYear':'Year', 'list.colCategory':'Category', 'list.colDate':'Date', 'list.colBeneficiaries':'Beneficiaries', 'list.colStatus':'Status',
'list.yearAll':'All years', 'list.catAll':'All categories', 'list.groupedBy':'Grouped by year',
'list.statTotal':'Total activities', 'list.statPublished':'Published', 'list.statArchived':'Archived', 'list.statBeneficiaries':'Total beneficiaries',
'status.draft':'Draft', 'status.published':'Published', 'status.archived':'Archived',
'cat.scholarship':'Scholarship', 'cat.blood':'Blood donation', 'cat.winter':'Winter clothing', 'cat.medical':'Medical camp', 'cat.tree':'Tree plantation', 'cat.national':'National day', 'cat.relief':'Relief', 'cat.other':'Other',
'act.publish':'Publish', 'act.unpublish':'Unpublish', 'act.archive':'Archive', 'act.edit':'Edit', 'act.view':'View',
'msg.published':'Published.', 'msg.unpublished':'Returned to draft.', 'msg.archived':'Archived.', 'msg.saved':'Saved.',
'confirm.archiveBody':'This activity will move to the annual archive; it will no longer show as active in the list.',
'detail.beneficiaries':'Beneficiaries', 'detail.date':'Date', 'detail.category':'Category', 'detail.year':'Year', 'detail.report':'Annual report', 'detail.reportLink':'Linked to a report', 'detail.reportMissing':'No annual report is linked to this activity yet.', 'detail.image':'Photo', 'detail.imageMissing':'No photo in the demo data — shown as a placeholder.', 'detail.bodyMissing':'Full body text is not in the demo data — updating.', 'detail.status':'Status',
'cats.title':'Activity categories', 'cats.note':'Every activity requires one category. Category names cannot be renamed — adding a new category is disabled in the demo.', 'cats.colName':'Category', 'cats.colCount':'Activities',
'arch.title':'Annual archives', 'arch.note':'Year-by-year archive — archived activities live here.', 'arch.colYear':'Year', 'arch.colTotal':'Total activities', 'arch.colArchived':'Archived', 'arch.colBeneficiaries':'Total beneficiaries',
'edit.titleBn':'Title (Bengali)', 'edit.titleEn':'Title (English)', 'edit.bodyBn':'Body (Bengali)', 'edit.bodyEn':'Body (English)', 'edit.date':'Date', 'edit.year':'Year', 'edit.category':'Category', 'edit.beneficiaries':'Beneficiary count', 'edit.report':'Link to annual report', 'edit.reportNone':'Not linked', 'edit.image':'Upload photo (preview only — simulated)', 'edit.imageHint':'Choosing a file shows a preview only; nothing is uploaded anywhere.', 'edit.save':'Save', 'edit.required':'Title (Bengali) and category are required.', 'edit.newTitle':'New activity', 'edit.editTitle':'Edit activity'
}};
registerStrings('activities', STRINGS);
const CATS = [['scholarship','activities.cat.scholarship'], ['blood donation','activities.cat.blood'], ['winter clothing','activities.cat.winter'], ['medical camp','activities.cat.medical'], ['tree plantation','activities.cat.tree'], ['national day','activities.cat.national'], ['relief','activities.cat.relief'], ['other','activities.cat.other']];
function catLabel(c){ const f = CATS.find(x => x[0] === c); return f ? t(f[1]) : c; }
function titleOf(a, lang){ return lang === 'bn' ? (a.title_bn || a.title_en || '') : (a.title_en || a.title_bn || ''); }
function years(){ return [...new Set(store.activities.map(a => a.year))].sort((a, b) => b - a); }
// in iteration2/MODULE-g3.md as a follow-up for the integrator.
function sortOf(ctx){ return { key: ctx.query.sort || null, dir: ctx.query.dir === 'desc' ? 'desc' : 'asc' }; }
function statusBadgeOf(a){
  return a.status === 'published' ? badge('published', t('activities.status.published'))
    : a.status === 'archived' ? plainBadge(t('activities.status.archived'))
    : badge('draft', t('activities.status.draft'));
}
function activityColumns(ctx, lang){
  return [
    { key:'title_bn', label:t('activities.list.colTitle'), sortable:true, render: r => `<strong>${esc(titleOf(r, lang))}</strong>` },
    { key:'category', label:t('activities.list.colCategory'), render: r => catLabel(r.category) },
    { key:'date', label:t('activities.list.colDate'), sortable:true, render: r => fmtDate(r.date, lang) },
    { key:'beneficiary_count', label:t('activities.list.colBeneficiaries'), sortable:true, render: r => fmtNum(r.beneficiary_count ?? 0, lang) },
    { key:'status', label:t('activities.list.colStatus'), render: r => statusBadgeOf(r) }
  ];
}
export const Activities = {
  route: '#/activities',
  title: { bn: 'বার্ষিক কার্যক্রম', en: 'Annual activities' },
  breadcrumb: ['nav.dashboard', 'nav.annual'],
  roles: ['super-admin'],
  permissions: ['activities.manage'],
  render(ctx){
    const lang = getLang();
    const { params, path } = ctx;
    ctx.shell.setTitle(t('activities.list.title'));
    if(path === '/activities/categories') return catsHtml(ctx, lang);
    if(path === '/activities/archives') return archivesHtml(ctx, lang);
    if(path === '/activities/new') return editorHtml(ctx, lang, null);
    if(params.id && path.endsWith('/edit')){ const a = store.activities.find(x => x.id === params.id); return a ? editorHtml(ctx, lang, a) : emptyState(t('common.empty')); }
    if(params.id){ const a = store.activities.find(x => x.id === params.id); return a ? detailHtml(ctx, lang, a) : emptyState(t('common.empty')); }
    return listHtml(ctx, lang);
  },
  onMount(ctx){
    const root = document.getElementById('view');
    bindTableRows(root);
    bindTableSort(root, (key, dir) => { const q = { ...ctx.query, sort: key, dir, page: '1' }; setHash(ctx.path, q); });
    bindFilters(root, {
      onSearch: v => { const q = { ...ctx.query, q: v, page: '1' }; if(!v) delete q.q; setHash(ctx.path, q); },
      onChip: v => { const q = { ...ctx.query, category: v, page: '1' }; if(v === 'all') delete q.category; setHash(ctx.path, q); },
      onClear: () => setHash(ctx.path, {})
    });
    const yr = root.querySelector('[data-year]');
    if(yr) yr.addEventListener('change', () => { const q = { ...ctx.query, year: yr.value, page: '1' }; if(!yr.value) delete q.year; setHash(ctx.path, q); });
    root.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => doAction(ctx, b.dataset.act, b.dataset.id)));
    const form = root.querySelector('#activity-form');
    if(form) form.addEventListener('submit', e => { e.preventDefault(); saveForm(ctx, form); });
    const file = root.querySelector('#f-image');
    if(file) file.addEventListener('change', () => {
      const prev = root.querySelector('#img-preview');
      if(prev && file.files && file.files[0]){ prev.src = URL.createObjectURL(file.files[0]); prev.hidden = false; }
    });
  },
  onUnmount(){}
};
function listHtml(ctx, lang){
  const q = ctx.query.q || '';
  const yearF = ctx.query.year || '';
  const catF = ctx.query.category || 'all';
  let rows = filterList(store.activities, { q, fields: ['title_bn', 'title_en'] });
  if(yearF) rows = rows.filter(a => String(a.year) === String(yearF));
  if(catF !== 'all') rows = rows.filter(a => a.category === catF);
  const sort = sortOf(ctx);
  if(!sort.key) rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const chips = [{ value:'all', label:t('activities.list.catAll') }, ...CATS.map(([v, k]) => ({ value: v, label: t(k) }))];
  const yearOpts = [`<option value="">${t('activities.list.yearAll')}</option>`, ...years().map(y => `<option value="${y}"${String(y) === yearF ? ' selected' : ''}>${fmtNum(y, lang)}</option>`)].join('');
  const grouped = {};
  rows.forEach(a => { (grouped[a.year] = grouped[a.year] || []).push(a); });
  const sections = Object.keys(grouped).sort((a, b) => b - a).map(y => `<h3 class="mt-6">${t('activities.list.groupedBy')} — ${fmtNum(y, lang)} (${fmtNum(grouped[y].length, lang)})</h3>` +
    renderTable({ columns: activityColumns(ctx, lang), rows: grouped[y], page: 1, perPage: 50, onRowClick: r => '#/activities/' + r.id, stacked: true, sort })).join('');
  const totalBen = store.activities.reduce((s, a) => s + (a.beneficiary_count || 0), 0);
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t('activities.list.title')}</h1><p class="sub">${t('activities.list.groupedBy')}</p></div><div><a class="btn btn-primary" href="#/activities/new">${t('activities.list.new')}</a></div></div>
  ${statGrid([
    { href: '#/activities', num: fmtNum(store.activities.length, lang), label: t('activities.list.statTotal') },
    { href: '#/activities', num: fmtNum(store.activities.filter(a => a.status === 'published').length, lang), label: t('activities.list.statPublished') },
    { href: '#/activities/archives', num: fmtNum(store.activities.filter(a => a.status === 'archived').length, lang), label: t('activities.list.statArchived') },
    { href: '#/activities', num: fmtNum(totalBen, lang), label: t('activities.list.statBeneficiaries') }
  ])}
  ${renderFilters({ q, chips, activeChip: catF })}
  <div class="filters"><label class="small muted" for="year-sel">${t('activities.list.colYear')}</label><select id="year-sel" class="input" data-year>${yearOpts}</select></div>
  ${rows.length ? sections : emptyState(t('common.empty'), t('activities.list.new'), '#/activities/new')}`;
}
function catsHtml(ctx, lang){
  const rows = CATS.map(([v, k]) => ({ key: v, label: t(k), count: store.activities.filter(a => a.category === v).length }));
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t('activities.cats.title')}</h1><p class="sub">${t('activities.cats.note')}</p></div></div>
  ${renderTable({ columns: [
    { key:'label', label:t('activities.cats.colName'), sortable:true, render: r => `<strong>${esc(r.label)}</strong><br><span class="small muted num">${esc(r.key)}</span>` },
    { key:'count', label:t('activities.cats.colCount'), sortable:true, render: r => fmtNum(r.count, lang) }
  ], rows, page: 1, perPage: 20, stacked: true, sort: sortOf(ctx) })}`;
}
function archivesHtml(ctx, lang){
  const rows = years().map(y => {
    const items = store.activities.filter(a => a.year === y);
    return { year: y, total: items.length, archived: items.filter(a => a.status === 'archived').length, ben: items.reduce((s, a) => s + (a.beneficiary_count || 0), 0) };
  });
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t('activities.arch.title')}</h1><p class="sub">${t('activities.arch.note')}</p></div></div>
  ${renderTable({ columns: [
    { key:'year', label:t('activities.arch.colYear'), sortable:true, render: r => `<strong class="num">${fmtNum(r.year, lang)}</strong>` },
    { key:'total', label:t('activities.arch.colTotal'), sortable:true, render: r => fmtNum(r.total, lang) },
    { key:'archived', label:t('activities.arch.colArchived'), sortable:true, render: r => fmtNum(r.archived, lang) },
    { key:'ben', label:t('activities.arch.colBeneficiaries'), sortable:true, render: r => fmtNum(r.ben, lang) }
  ], rows, page: 1, perPage: 20, onRowClick: r => '#/activities?year=' + r.year, stacked: true, sort: sortOf(ctx) })}`;
}
function detailHtml(ctx, lang, a){
  const reports = store.annual_reports || [];
  const linked = a.report_id ? reports.find(r => r.id === a.report_id) : null;
  const actions = [];
  if(a.status === 'draft') actions.push(`<button type="button" class="btn btn-primary" data-act="publish" data-id="${a.id}">${t('activities.act.publish')}</button>`);
  if(a.status === 'published') actions.push(`<button type="button" class="btn btn-secondary" data-act="unpublish" data-id="${a.id}">${t('activities.act.unpublish')}</button>`);
  if(a.status !== 'archived') actions.push(`<button type="button" class="btn btn-ghost" data-act="archive" data-id="${a.id}">${t('activities.act.archive')}</button>`);
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${esc(titleOf(a, lang))}</h1><p class="sub">${catLabel(a.category)} · ${fmtNum(a.year, lang)}</p></div>
  <div><a class="btn btn-secondary" href="#/activities/${a.id}/edit">${t('activities.act.edit')}</a> <a class="btn btn-ghost" href="#/activities">${t('common.back')}</a></div></div>
  <section class="card"><dl class="kv">
  <dt>${t('activities.detail.date')}</dt><dd>${fmtDate(a.date, lang)}</dd>
  <dt>${t('activities.detail.category')}</dt><dd>${catLabel(a.category)}</dd>
  <dt>${t('activities.detail.year')}</dt><dd>${fmtNum(a.year, lang)}</dd>
  <dt>${t('activities.detail.beneficiaries')}</dt><dd>${fmtNum(a.beneficiary_count ?? 0, lang)}</dd>
  <dt>${t('activities.detail.report')}</dt><dd>${linked ? `${t('activities.detail.reportLink')} — <span class="num">${esc(linked.id || linked.title || '')}</span>` : t('activities.detail.reportMissing')}</dd>
  <dt>${t('activities.detail.image')}</dt><dd>${t('activities.detail.imageMissing')}</dd>
  <dt>${t('activities.detail.status')}</dt><dd>${statusBadgeOf(a)}</dd>
  </dl>
  <h3 class="mt-6">${t('activities.list.colTitle')}</h3><p>${esc(a.body_bn || a.body_en || '') || t('activities.detail.bodyMissing')}</p>
  <div class="row mt-6">${actions.join(' ')}</div></section>`;
}
function editorHtml(ctx, lang, a){
  const v = a || {};
  const reports = store.annual_reports || [];
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${a ? t('activities.edit.editTitle') : t('activities.edit.newTitle')}</h1></div>
  <div><a class="btn btn-ghost" href="#/activities">${t('common.back')}</a></div></div>
  <form id="activity-form" class="card" data-id="${v.id || ''}" novalidate>
  <div id="form-err"></div>
  ${field({ id:'f-title-bn', label:t('activities.edit.titleBn'), value: v.title_bn || '', required: true })}
  ${field({ id:'f-title-en', label:t('activities.edit.titleEn'), value: v.title_en || '' })}
  ${field({ id:'f-body-bn', label:t('activities.edit.bodyBn'), type:'textarea', value: v.body_bn || '', rows: 4 })}
  ${field({ id:'f-body-en', label:t('activities.edit.bodyEn'), type:'textarea', value: v.body_en || '', rows: 4 })}
  ${field({ id:'f-category', label:t('activities.edit.category'), value: v.category || '', required: true, options: [{ value:'', label:'—' }, ...CATS.map(([cv, k]) => ({ value: cv, label: t(k) }))] })}
  ${field({ id:'f-date', label:t('activities.edit.date'), type:'date', value: v.date || '' })}
  ${field({ id:'f-year', label:t('activities.edit.year'), type:'number', value: v.year || new Date().getFullYear() })}
  ${field({ id:'f-ben', label:t('activities.edit.beneficiaries'), type:'number', value: v.beneficiary_count ?? 0 })}
  ${field({ id:'f-report', label:t('activities.edit.report'), value: v.report_id || '', options: [{ value:'', label: t('activities.edit.reportNone') }, ...reports.map(r => ({ value: r.id, label: r.id + (r.year ? ' · ' + fmtNum(r.year, lang) : '') }))] })}
  <div class="field"><label for="f-image">${t('activities.edit.image')}</label><input id="f-image" type="file" class="input" accept="image/*"><div class="hint">${t('activities.edit.imageHint')}</div><img id="img-preview" class="mt-4" alt="" hidden></div>
  <div class="row mt-4"><button type="submit" class="btn btn-primary">${t('activities.edit.save')}</button></div>
  </form>`;
}
function doAction(ctx, act, id){
  const a = store.activities.find(x => x.id === id);
  if(!a) return;
  const old = a.status;
  const done = (msg) => { writeAudit(ctx.user.id, ctx.role, 'activities.' + act, 'activity', id, old, a.status); ctx.toast(t(msg)); ctx.rerender && ctx.rerender(); };
  if(act === 'publish'){ a.status = 'published'; return done('activities.msg.published'); }
  if(act === 'unpublish'){ a.status = 'draft'; return done('activities.msg.unpublished'); }
  if(act === 'archive'){
    ctx.modal({ title: t('activities.act.archive'), body: `<p>${t('activities.confirm.archiveBody')}</p><p class="small muted">${esc(a.title_bn)}</p>`, confirmLabel: t('activities.act.archive'), onConfirm: () => { a.status = 'archived'; done('activities.msg.archived'); } });
  }
}
function saveForm(ctx, form){
  const id = form.dataset.id;
  const titleBn = form.querySelector('#f-title-bn').value.trim();
  const cat = form.querySelector('#f-category').value;
  const errBox = document.getElementById('form-err');
  if(!titleBn || !cat){
    const errs = [];
    if(!titleBn) errs.push({ id: 'f-title-bn', message: t('activities.edit.required') });
    if(!cat) errs.push({ id: 'f-category', message: t('activities.edit.required') });
    errBox.innerHTML = errorSummary(errs);
    const s = errBox.querySelector('.error-summary');
    if(s) s.focus();
    form.querySelector('#f-title-bn').focus();
    return;
  }
  const val = s => { const el = form.querySelector(s); return el ? el.value.trim() : ''; };
  const data = { title_bn: titleBn, title_en: val('#f-title-en'), body_bn: val('#f-body-bn'), body_en: val('#f-body-en'), category: cat, date: val('#f-date') || null, year: parseInt(val('#f-year'), 10) || new Date().getFullYear(), beneficiary_count: parseInt(val('#f-ben'), 10) || 0, report_id: val('#f-report') || null };
  if(id){ const a = store.activities.find(x => x.id === id); if(a){ const old = a.status; Object.assign(a, data); writeAudit(ctx.user.id, ctx.role, 'activities.update', 'activity', id, old, a.status); } }
  else { store.activities.unshift({ id:'act-' + Date.now(), status:'draft', ...data }); writeAudit(ctx.user.id, ctx.role, 'activities.create', 'activity', data.title_bn, null, 'draft'); }
  ctx.toast(t('activities.msg.saved'));
  location.hash = '#/activities';
}
