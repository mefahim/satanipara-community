// Directory view — #/directory (+ ?kind=), #/directory/new, #/directory/:id,
// v2: shared statCard/statGrid, real table sorting (?sort=&dir=), field() select
// variants, quick-view drawer button per row (the drawer binding had no trigger).
// #/infrastructure, #/freedom-fighters.
// DEMO data only. Public visibility REQUIRES recorded consent: an entry whose
// consent is not granted can never be set public (blocked in the form and in
// the detail action). Date of birth is NEVER collected or shown — age band only.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { go, withQuery } from '../js/lib/router.js';
import { store, filterList, writeAudit } from '../js/lib/store.js';
import { fmtNum, esc } from '../js/lib/format.js';
import { renderTable, bindTableRows, bindTableSort } from '../js/components/table.js';
import { statGrid } from '../js/components/stat.js';
import { renderFilters, bindFilters } from '../js/components/filters.js';
import { badge, plainBadge } from '../js/components/badges.js';
import { field, errorSummary, validateRequired } from '../js/components/forms.js';
import { emptyState } from '../js/components/states.js';

const STRINGS = {
  bn: {
    'list.title': 'জন-নির্দেশিকা', 'list.sub': 'ব্যক্তি, পেশাজীবী ও প্রতিষ্ঠান — নমুনা তথ্য। জন্মতারিখ কখনো দেখানো হয় না, শুধু বয়সের ধাপ।',
    'list.new': 'নতুন এন্ট্রি যোগ করুন', 'list.colName': 'নাম', 'list.colKind': 'ধরন', 'list.colAction': 'কাজ', 'list.quickView': 'দ্রুত দেখুন', 'list.colArea': 'এলাকা', 'list.colRole': 'পেশা / ধরন',
    'list.colAge': 'বয়সের ধাপ', 'list.colVisibility': 'দৃশ্যমানতা', 'list.colConsent': 'সম্মতি', 'kind.all': 'সবগুলো', 'chip.archived': 'আর্কাইভ করা',
    'kind.person': 'ব্যক্তি', 'kind.professionals': 'পেশাজীবী', 'kind.institutions': 'প্রতিষ্ঠান', 'kind.landmarks': 'স্থাপনা', 'kind.freedom_fighters': 'মুক্তিযোদ্ধা',
    'vis.public': 'সর্বজনীন', 'vis.members': 'শুধু সদস্যদের জন্য', 'vis.private': 'ব্যক্তিগত', 'consent.granted': 'সম্মতি দেওয়া হয়েছে',
    'consent.withdrawn': 'সম্মতি প্রত্যাহার করা হয়েছে', 'consent.pending': 'সম্মতি রেকর্ড করা হয়নি',
    'consent.hiddenNote': 'সম্মতি প্রত্যাহার করায় সর্বজনীন তালিকা থেকে লুকানো হয়েছে।', 'detail.title': 'এন্ট্রির বিবরণ', 'detail.area': 'এলাকা',
    'detail.role': 'পেশা / ধরন', 'detail.age': 'বয়সের ধাপ', 'detail.visibility': 'দৃশ্যমানতা', 'detail.consent': 'সম্মতি', 'detail.kind': 'ধরন',
    'detail.noDob': 'জন্মতারিখ সংরক্ষণ বা প্রকাশ করা হয় না — শুধু বয়সের ধাপ দেখানো হয়।', 'detail.edit': 'সম্পাদনা করুন', 'detail.archive': 'আর্কাইভ করুন',
    'detail.unarchive': 'আর্কাইভ থেকে ফেরান', 'detail.archivedNote': 'এই এন্ট্রিটি আর্কাইভ করা হয়েছে।', 'detail.setPublic': 'সর্বজনীন করুন',
    'detail.setMembers': 'শুধু সদস্যদের জন্য করুন', 'detail.setPrivate': 'ব্যক্তিগত করুন', 'form.titleNew': 'নতুন এন্ট্রি', 'form.titleEdit': 'এন্ট্রি সম্পাদনা',
    'form.kind': 'ধরন', 'form.nameBn': 'নাম (বাংলা)', 'form.nameEn': 'নাম (ইংরেজি)', 'form.area': 'এলাকা', 'form.role': 'পেশা / ধরন',
    'form.age': 'বয়সের ধাপ (যেমন ৩০–৩৯)', 'form.visibility': 'দৃশ্যমানতা', 'form.consent': 'সম্মতির অবস্থা', 'form.save': 'সংরক্ষণ করুন', 'form.cancel': 'বাতিল',
    'form.required': 'এই ঘরটি পূরণ করা আবশ্যক।', 'form.consentHint': 'সর্বজনীন করতে হলে সম্মতি রেকর্ড করা থাকতে হবে। সম্মতি ছাড়া সর্বজনীন করা যাবে না।',
    'form.noDobHint': 'জন্মতারিখ চাওয়া হয় না — শুধু বয়সের ধাপ লিখুন।', 'toast.saved': 'এন্ট্রি সংরক্ষণ করা হয়েছে।', 'toast.archived': 'এন্ট্রি আর্কাইভ করা হয়েছে।',
    'toast.unarchived': 'এন্ট্রি আর্কাইভ থেকে ফেরানো হয়েছে।', 'toast.consentBlocked': 'সম্মতি রেকর্ড করা নেই — সর্বজনীন করা যাবে না। আগে সম্মতি রেকর্ড করুন।',
    'toast.visibilityChanged': 'দৃশ্যমানতা পরিবর্তন করা হয়েছে।', 'modal.archiveTitle': 'এন্ট্রি আর্কাইভ করবেন?',
    'modal.archiveBody': 'এই এন্ট্রিটি আর্কাইভ করা হবে; তালিকায় আর সক্রিয় হিসেবে দেখাবে না। তথ্য মুছে যাবে না।', 'modal.unarchiveTitle': 'আর্কাইভ থেকে ফেরাবেন?',
    'modal.unarchiveBody': 'এই এন্ট্রিটি আবার সক্রিয় তালিকায় ফিরবে।', 'modal.consentTitle': 'সম্মতি ছাড়া সর্বজনীন করা যাবে না',
    'modal.consentBody': 'এই এন্ট্রির সম্মতি রেকর্ড করা নেই বা প্রত্যাহার করা হয়েছে। সর্বজনীন করতে হলে প্রথমে সম্মতি রেকর্ড করতে হবে।',
    'infra.title': 'অবকাঠামো ও স্থাপনা', 'infra.sub': 'স্থাপনা ও গুরুত্বপূর্ণ স্থানের তালিকা — মানচিত্র নেই (পর্যালোচনাধীন)।', 'infra.new': 'নতুন স্থাপনা যোগ করুন',
    'infra.colName': 'নাম', 'infra.colType': 'ধরন', 'infra.colArea': 'এলাকা', 'infra.colVisibility': 'দৃশ্যমানতা', 'ff.title': 'বীর মুক্তিযোদ্ধা নিবন্ধন',
    'ff.sub': 'সম্মানিত মুক্তিযোদ্ধাদের নিবন্ধন — নমুনা তথ্য।', 'ff.new': 'নতুন মুক্তিযোদ্ধা যোগ করুন', 'ff.colName': 'নাম', 'ff.colAge': 'বয়সের ধাপ',
    'ff.colArea': 'এলাকা', 'ff.colVisibility': 'দৃশ্যমানতা', 'notFound': 'এই এন্ট্রিটি পাওয়া যায়নি।'
  },
  en: {
    'list.title': 'People Directory', 'list.sub': 'Persons, professionals and institutions — demo data. Date of birth is never shown, only the age band.',
    'list.new': 'Add entry', 'list.colName': 'Name', 'list.colKind': 'Kind', 'list.colAction': 'Action', 'list.quickView': 'Quick view', 'list.colArea': 'Area', 'list.colRole': 'Profession / type', 'list.colAge': 'Age band',
    'list.colVisibility': 'Visibility', 'list.colConsent': 'Consent', 'kind.all': 'All', 'chip.archived': 'Archived', 'kind.person': 'Person',
    'kind.professionals': 'Professional', 'kind.institutions': 'Institution', 'kind.landmarks': 'Landmark', 'kind.freedom_fighters': 'Freedom fighter',
    'vis.public': 'Public', 'vis.members': 'Members only', 'vis.private': 'Private', 'consent.granted': 'Consent granted', 'consent.withdrawn': 'Consent withdrawn',
    'consent.pending': 'Consent not recorded', 'consent.hiddenNote': 'Hidden from the public listing because consent was withdrawn.', 'detail.title': 'Entry detail',
    'detail.area': 'Area', 'detail.role': 'Profession / type', 'detail.age': 'Age band', 'detail.visibility': 'Visibility', 'detail.consent': 'Consent',
    'detail.kind': 'Kind', 'detail.noDob': 'Date of birth is never stored or shown — only the age band is displayed.', 'detail.edit': 'Edit',
    'detail.archive': 'Archive', 'detail.unarchive': 'Restore from archive', 'detail.archivedNote': 'This entry is archived.', 'detail.setPublic': 'Make public',
    'detail.setMembers': 'Make members only', 'detail.setPrivate': 'Make private', 'form.titleNew': 'New entry', 'form.titleEdit': 'Edit entry', 'form.kind': 'Kind',
    'form.nameBn': 'Name (Bengali)', 'form.nameEn': 'Name (English)', 'form.area': 'Area', 'form.role': 'Profession / type', 'form.age': 'Age band (e.g. 30–39)',
    'form.visibility': 'Visibility', 'form.consent': 'Consent status', 'form.save': 'Save', 'form.cancel': 'Cancel', 'form.required': 'This field is required.',
    'form.consentHint': 'Public visibility requires recorded consent. It cannot be made public without consent.',
    'form.noDobHint': 'Date of birth is not asked for — enter only the age band.', 'toast.saved': 'Entry saved.', 'toast.archived': 'Entry archived.',
    'toast.unarchived': 'Entry restored from archive.', 'toast.consentBlocked': 'Consent is not recorded — cannot make public. Record consent first.',
    'toast.visibilityChanged': 'Visibility changed.', 'modal.archiveTitle': 'Archive this entry?',
    'modal.archiveBody': 'This entry will be archived and will no longer appear as active. No data will be deleted.', 'modal.unarchiveTitle': 'Restore from archive?',
    'modal.unarchiveBody': 'This entry will return to the active list.', 'modal.consentTitle': 'Cannot make public without consent',
    'modal.consentBody': 'Consent for this entry is not recorded or has been withdrawn. Record consent first to make it public.',
    'infra.title': 'Infrastructure & Landmarks', 'infra.sub': 'Catalogue of landmarks and important places — no map (under review).', 'infra.new': 'Add landmark',
    'infra.colName': 'Name', 'infra.colType': 'Type', 'infra.colArea': 'Area', 'infra.colVisibility': 'Visibility', 'ff.title': 'Freedom Fighter Register',
    'ff.sub': 'Register of honoured freedom fighters — demo data.', 'ff.new': 'Add freedom fighter', 'ff.colName': 'Name', 'ff.colAge': 'Age band', 'ff.colArea': 'Area',
    'ff.colVisibility': 'Visibility', 'notFound': 'This entry was not found.'
  }
};
registerStrings('directory', STRINGS);
const K = 'directory.';
const nm = (it, lang) => lang === 'bn' ? (it.name_bn || it.name_en) : (it.name_en || it.name_bn);
const visLabel = v => t(K + (v === 'public' ? 'vis.public' : v === 'members-only' ? 'vis.members' : 'vis.private'));
const consentLabel = c => t(K + (c === 'granted' ? 'consent.granted' : c === 'withdrawn' ? 'consent.withdrawn' : 'consent.pending'));
const kindLabel = k => t(K + 'kind.' + (k === 'person' ? 'person' : k));
const roleOf = it => it.profession_bn || it.type_bn || '';
const allEntries = () => [...store.persons, ...store.professionals, ...store.institutions];
const findEntry = id => allEntries().find(e => e.id === id) || store.landmarks.find(e => e.id === id) || store.freedom_fighters.find(e => e.id === id);

function tableSort(ctx){
  const k = ctx.query.sort, d = ctx.query.dir;
  return k && ['name_bn', 'kind', 'area', 'type_bn', 'age_band'].includes(k) && (d === 'asc' || d === 'desc') ? { key: k, dir: d } : null;
}

export const Directory = {
  route: '#/directory',
  title: { bn: 'জন-নির্দেশিকা', en: 'People Directory' },
  breadcrumb: ['nav.community', 'nav.directory'],
  roles: ['super-admin'],
  permissions: ['directory.view'],
  render(ctx){
    const lang = getLang();
    if(ctx.path === '/infrastructure') return ctx.query.new ? infraFormHtml(ctx) : infraHtml(ctx, lang);
    if(ctx.path === '/freedom-fighters') return ctx.query.new ? ffFormHtml(ctx) : ffHtml(ctx, lang);
    if(ctx.path === '/directory/new') return formHtml(ctx, null);
    if(ctx.params.id){
      const e = findEntry(ctx.params.id);
      if(!e) return `<span class="demo-badge">${t('app.demo')}</span>` + emptyState(t(K + 'notFound'), t('common.back'), '#/directory');
      return ctx.query.edit ? formHtml(ctx, e) : detailHtml(ctx, e, lang);
    }
    return listHtml(ctx, lang);
  },
  onMount(ctx){
    const lang = getLang();
    bindTableRows(document.getElementById('view'));
    bindTableSort(document.getElementById('view'), (key, dir) => go(withQuery(ctx.path, { sort: key, dir })));
    const titles = { '/infrastructure': 'infra.title', '/freedom-fighters': 'ff.title', '/directory/new': 'form.titleNew' };
    ctx.shell.setTitle(t(K + (titles[ctx.path] || (ctx.params.id ? 'detail.title' : 'list.title'))));
    ctx.shell.setBreadcrumb(['nav.community', ctx.path === '/infrastructure' ? 'nav.infrastructure' : ctx.path === '/freedom-fighters' ? 'nav.freedom' : 'nav.directory']);
    bindFilters(document.getElementById('view'), {
      onSearch: q => go(withQuery(ctx.path, { q })),
      onChip: v => go(withQuery(ctx.path, { kind: v === 'all' ? '' : v })),
      onClear: () => go(ctx.path)
    });
    const form = document.getElementById('dir-form');
    if(form) form.addEventListener('submit', e => { e.preventDefault(); saveEntry(ctx, form); });
    const iform = document.getElementById('infra-form');
    if(iform) iform.addEventListener('submit', e => { e.preventDefault(); saveSimple(ctx, iform, store.landmarks, 'lm', '#/infrastructure'); });
    const fform = document.getElementById('ff-form');
    if(fform) fform.addEventListener('submit', e => { e.preventDefault(); saveSimple(ctx, fform, store.freedom_fighters, 'ff', '#/freedom-fighters'); });
    document.querySelectorAll('[data-dir-archive]').forEach(b => b.addEventListener('click', () => {
      const e = findEntry(b.dataset.dirArchive);
      if(!e) return;
      const arch = !e.archived;
      ctx.modal({ title: t(K + (arch ? 'modal.archiveTitle' : 'modal.unarchiveTitle')),
        body: `<p>${t(K + (arch ? 'modal.archiveBody' : 'modal.unarchiveBody'))}</p><p class="mt-4"><strong>${esc(nm(e, lang))}</strong></p>`,
        confirmLabel: t('common.confirm'), danger: arch,
        onConfirm: () => { e.archived = arch; writeAudit(ctx.user.id, ctx.role, arch ? 'directory.archive' : 'directory.unarchive', 'directory', e.id, arch ? 'active' : 'archived', arch ? 'archived' : 'active'); ctx.toast(t(K + (arch ? 'toast.archived' : 'toast.unarchived'))); ctx.rerender(); } });
    }));
    document.querySelectorAll('[data-dir-vis]').forEach(b => b.addEventListener('click', () => {
      const e = findEntry(b.dataset.dirVisId);
      const vis = b.dataset.dirVis;
      if(!e) return;
      if(vis === 'public' && e.consent_status !== 'granted'){
        ctx.modal({ title: t(K + 'modal.consentTitle'), body: `<p>${t(K + 'modal.consentBody')}</p>`, confirmLabel: t('common.confirm'),
          onConfirm: () => ctx.toast(t(K + 'toast.consentBlocked')) });
        return;
      }
      const old = e.visibility;
      e.visibility = vis;
      writeAudit(ctx.user.id, ctx.role, 'directory.visibility', 'directory', e.id, old, vis);
      ctx.toast(t(K + 'toast.visibilityChanged'));
      ctx.rerender();
    }));
    document.querySelectorAll('[data-drawer-entry]').forEach(b => b.addEventListener('click', ev => {
      ev.stopPropagation(); // the row itself navigates; the quick-view button must not
      const e = findEntry(b.dataset.drawerEntry);
      if(!e) return;
      ctx.drawer({ title: nm(e, lang), body: drawerBody(e, lang) });
    }));
  },
  onUnmount(){}
};

function drawerBody(e, lang){
  return `<dl class="kv"><dt>${t(K + 'detail.kind')}</dt><dd>${kindLabel(e.kind)}</dd>
  <dt>${t(K + 'detail.area')}</dt><dd>${esc(e.area || '')}</dd>
  <dt>${t(K + 'detail.role')}</dt><dd>${esc(roleOf(e))}</dd>
  ${e.age_band ? `<dt>${t(K + 'detail.age')}</dt><dd>${esc(e.age_band)}</dd>` : ''}
  <dt>${t(K + 'detail.visibility')}</dt><dd>${plainBadge(visLabel(e.visibility))}</dd>
  <dt>${t(K + 'detail.consent')}</dt><dd>${badge(e.consent_status === 'granted' ? 'published' : 'draft', consentLabel(e.consent_status))}</dd></dl>
  ${e.age_band ? `<p class="small muted mt-4">${t(K + 'detail.noDob')}</p>` : ''}`;
}

function listHtml(ctx, lang){
  const q = ctx.query.q || '';
  const kind = ctx.query.kind || '';
  let rows = filterList(allEntries(), { q, fields: ['name_bn', 'name_en', 'area', 'profession_bn', 'type_bn'] });
  if(kind) rows = rows.filter(e => e.kind === kind || (kind === 'person' && e.kind === 'person'));
  const chips = ['all', 'person', 'professionals', 'institutions'].map(v => ({ value: v, label: t(K + 'kind.' + v) }));
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t(K + 'list.title')}</h1><p class="sub">${t(K + 'list.sub')}</p></div>
  <div class="row"><a class="btn btn-primary" href="#/directory/new">${t(K + 'list.new')}</a></div></div>
  ${statGrid([
    { href: '#/directory', num: fmtNum(allEntries().length, lang), label: t(K + 'kind.all') },
    { href: '#/directory?kind=person', num: fmtNum(store.persons.length, lang), label: t(K + 'kind.person') },
    { href: '#/directory?kind=professionals', num: fmtNum(store.professionals.length, lang), label: t(K + 'kind.professionals') },
    { href: '#/directory?kind=institutions', num: fmtNum(store.institutions.length, lang), label: t(K + 'kind.institutions') }
  ])}
  <div class="mt-6">${renderFilters({ q, chips, activeChip: kind || 'all' })}</div>
  ${rows.length ? renderTable({ columns: [
    { key: 'name_bn', label: t(K + 'list.colName'), sortable: true, render: r => `<strong>${esc(nm(r, lang))}</strong>${r.archived ? ' ' + badge('draft', t(K + 'chip.archived')) : ''}` },
    { key: 'kind', label: t(K + 'list.colKind'), sortable: true, render: r => kindLabel(r.kind) },
    { key: 'area', label: t(K + 'list.colArea'), sortable: true, render: r => esc(r.area || '') },
    { key: 'profession_bn', label: t(K + 'list.colRole'), render: r => esc(roleOf(r)) },
    { key: 'age_band', label: t(K + 'list.colAge'), render: r => esc(r.age_band || '—') },
    { key: 'visibility', label: t(K + 'list.colVisibility'), render: r => r.visibility === 'public' && r.consent_status !== 'granted' ? badge('draft', t(K + 'consent.hiddenNote')) : plainBadge(visLabel(r.visibility)) },
    { key: 'consent_status', label: t(K + 'list.colConsent'), render: r => badge(r.consent_status === 'granted' ? 'published' : 'draft', consentLabel(r.consent_status)) },
    { key: 'actions', label: t(K + 'list.colAction'), render: r => `<button type="button" class="btn btn-ghost btn-sm" data-drawer-entry="${r.id}">${t(K + 'list.quickView')}</button>` }
  ], rows, page: 1, perPage: 20, onRowClick: r => '#/directory/' + r.id, stacked: true, sort: tableSort(ctx) }) : emptyState(t('common.empty'), t(K + 'list.new'), '#/directory/new')}`;
}

function detailHtml(ctx, e, lang){
  const back = e.kind === 'landmarks' ? '#/infrastructure' : e.kind === 'freedom_fighters' ? '#/freedom-fighters' : '#/directory';
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${esc(nm(e, lang))}</h1><p class="sub">${t(K + 'detail.title')} · ${kindLabel(e.kind)}</p></div>
  <div class="row"><a class="btn btn-secondary" href="#/directory/${e.id}?edit=1">${t(K + 'detail.edit')}</a>
  <button type="button" class="btn btn-secondary" data-dir-archive="${e.id}">${t(K + (e.archived ? 'detail.unarchive' : 'detail.archive'))}</button></div></div>
  ${e.archived ? `<div class="error-box" role="note"><strong>${t(K + 'detail.archivedNote')}</strong></div>` : ''}
  ${e.visibility === 'public' && e.consent_status !== 'granted' ? `<div class="error-box" role="note"><strong>${t(K + 'consent.hiddenNote')}</strong></div>` : ''}
  <div class="detail-grid"><div>
  <section class="card"><h3>${t(K + 'detail.title')}</h3>
    <dl class="kv"><dt>${t(K + 'detail.kind')}</dt><dd>${kindLabel(e.kind)}</dd>
    <dt>${t(K + 'detail.area')}</dt><dd>${esc(e.area || '')}</dd>
    <dt>${t(K + 'detail.role')}</dt><dd>${esc(roleOf(e))}</dd>
    ${e.age_band ? `<dt>${t(K + 'detail.age')}</dt><dd>${esc(e.age_band)}</dd>` : ''}
    <dt>${t(K + 'detail.visibility')}</dt><dd>${plainBadge(visLabel(e.visibility))}</dd>
    <dt>${t(K + 'detail.consent')}</dt><dd>${badge(e.consent_status === 'granted' ? 'published' : 'draft', consentLabel(e.consent_status))}</dd></dl>
    <p class="small muted mt-4">${t(K + 'detail.noDob')}</p></section>
  </div><div>
  <section class="card"><h3>${t(K + 'detail.visibility')}</h3>
    <p class="small muted">${t(K + 'form.consentHint')}</p>
    <div class="row mt-4"><button type="button" class="btn btn-secondary" data-dir-vis="public" data-dir-vis-id="${e.id}">${t(K + 'detail.setPublic')}</button>
    <button type="button" class="btn btn-secondary" data-dir-vis="members-only" data-dir-vis-id="${e.id}">${t(K + 'detail.setMembers')}</button>
    <button type="button" class="btn btn-secondary" data-dir-vis="private" data-dir-vis-id="${e.id}">${t(K + 'detail.setPrivate')}</button></div>
    <p class="small muted mt-4">${t('common.updating')}</p></section>
  </div></div>
  <p class="mt-4"><a class="link-more" href="${back}">${t('common.back')}</a></p>`;
}

function formHtml(ctx, e){
  const isNew = !e;
  const v = e || { kind: 'person', name_bn: '', name_en: '', area: 'সাতানীপাড়া', profession_bn: '', type_bn: '', age_band: '', visibility: 'members-only', consent_status: 'granted' };
  const isInst = v.kind === 'institutions';
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t(K + (isNew ? 'form.titleNew' : 'form.titleEdit'))}</h1></div></div>
  <form id="dir-form" class="card" novalidate>
    <div id="dir-errors"></div>
    ${field({ id: 'f-kind', label: t(K + 'form.kind'), value: v.kind, options: [
      { value: 'person', label: t(K + 'kind.person') },
      { value: 'professionals', label: t(K + 'kind.professionals') },
      { value: 'institutions', label: t(K + 'kind.institutions') }
    ] })}
    ${field({ id: 'f-name-bn', label: t(K + 'form.nameBn'), value: v.name_bn, required: true })}
    ${field({ id: 'f-name-en', label: t(K + 'form.nameEn'), value: v.name_en })}
    ${field({ id: 'f-area', label: t(K + 'form.area'), value: v.area })}
    ${field({ id: 'f-role', label: t(K + 'form.role'), value: v.profession_bn || v.type_bn || '' })}
    ${isInst ? '' : field({ id: 'f-age', label: t(K + 'form.age'), value: v.age_band || '', attrs: 'aria-describedby="f-age-hint"' })}
    ${isInst ? '' : `<div class="hint" id="f-age-hint">${t(K + 'form.noDobHint')}</div>`}
    ${field({ id: 'f-visibility', label: t(K + 'form.visibility'), value: v.visibility, hint: t(K + 'form.consentHint'), options: [
      { value: 'public', label: t(K + 'vis.public') },
      { value: 'members-only', label: t(K + 'vis.members') },
      { value: 'private', label: t(K + 'vis.private') }
    ] })}
    ${field({ id: 'f-consent', label: t(K + 'form.consent'), value: v.consent_status, options: [
      { value: 'granted', label: t(K + 'consent.granted') },
      { value: 'withdrawn', label: t(K + 'consent.withdrawn') },
      { value: 'pending', label: t(K + 'consent.pending') }
    ] })}
    <div class="row mt-4"><button type="submit" class="btn btn-primary">${t(K + 'form.save')}</button>
    <a class="btn btn-secondary" href="${isNew ? '#/directory' : '#/directory/' + e.id}">${t(K + 'form.cancel')}</a></div>
  </form>`;
}

function saveEntry(ctx, form){
  const fd = new FormData(form);
  const nameBn = String(fd.get('f-name-bn') || '').trim();
  const kind = String(fd.get('f-kind') || 'person');
  const vis = String(fd.get('f-visibility') || 'members-only');
  const consent = String(fd.get('f-consent') || 'granted');
  const errs = [];
  if(!validateRequired(nameBn)) errs.push({ id: 'f-name-bn', message: t(K + 'form.required') });
  if(vis === 'public' && consent !== 'granted') errs.push({ id: 'f-visibility', message: t(K + 'toast.consentBlocked') });
  const box = document.getElementById('dir-errors');
  if(errs.length){ box.innerHTML = errorSummary(errs); const s = box.querySelector('.error-summary'); if(s) s.focus(); return; }
  const id = ctx.params.id;
  const existing = id ? findEntry(id) : null;
  const prefix = kind === 'professionals' ? 'pr' : kind === 'institutions' ? 'in' : 'p';
  const rec = {
    id: existing ? existing.id : prefix + '-' + Date.now(),
    name_bn: nameBn, name_en: String(fd.get('f-name-en') || '').trim(),
    area: String(fd.get('f-area') || '').trim(),
    visibility: vis, consent_status: consent, kind,
    archived: existing ? !!existing.archived : false
  };
  if(kind === 'institutions') rec.type_bn = String(fd.get('f-role') || '').trim();
  else { rec.profession_bn = String(fd.get('f-role') || '').trim(); rec.age_band = String(fd.get('f-age') || '').trim(); }
  if(existing){
    const oldKind = existing.kind;
    Object.assign(existing, rec);
    if(oldKind === 'landmarks' || oldKind === 'freedom_fighters'){
      // Edited from a catalogue entry: remove it from its catalogue collection.
      const src = oldKind === 'landmarks' ? store.landmarks : store.freedom_fighters;
      const i = src.indexOf(existing);
      if(i >= 0) src.splice(i, 1);
      (kind === 'professionals' ? store.professionals : kind === 'institutions' ? store.institutions : store.persons).push(existing);
    } else if(oldKind !== kind){
      // Kind changed: move between demo collections so the kind filter stays true.
      for(const coll of [store.persons, store.professionals, store.institutions]){
        const i = coll.indexOf(existing);
        if(i >= 0) coll.splice(i, 1);
      }
      (kind === 'professionals' ? store.professionals : kind === 'institutions' ? store.institutions : store.persons).push(existing);
    }
  } else {
    (kind === 'professionals' ? store.professionals : kind === 'institutions' ? store.institutions : store.persons).push(rec);
  }
  writeAudit(ctx.user.id, ctx.role, existing ? 'directory.update' : 'directory.create', 'directory', rec.id, existing ? 'updated' : null, rec.visibility);
  ctx.toast(t(K + 'toast.saved'));
  go('#/directory/' + rec.id);
}

function infraHtml(ctx, lang){
  const q = ctx.query.q || '';
  const rows = filterList(store.landmarks, { q, fields: ['name_bn', 'name_en', 'area', 'type_bn'] });
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t(K + 'infra.title')}</h1><p class="sub">${t(K + 'infra.sub')}</p></div>
  <div class="row"><a class="btn btn-primary" href="#/infrastructure?new=1">${t(K + 'infra.new')}</a></div></div>
  <div class="mt-6">${renderFilters({ q, chips: [], activeChip: null })}</div>
  ${rows.length ? renderTable({ columns: [
    { key: 'name_bn', label: t(K + 'infra.colName'), sortable: true, render: r => `<strong>${esc(nm(r, lang))}</strong>` },
    { key: 'type_bn', label: t(K + 'infra.colType'), sortable: true, render: r => esc(r.type_bn || '') },
    { key: 'area', label: t(K + 'infra.colArea'), sortable: true, render: r => esc(r.area || '') },
    { key: 'visibility', label: t(K + 'infra.colVisibility'), render: r => plainBadge(visLabel(r.visibility)) }
  ], rows, page: 1, perPage: 20, onRowClick: r => '#/directory/' + r.id, stacked: true, sort: tableSort(ctx) }) : emptyState(t('common.empty'), t(K + 'infra.new'), '#/infrastructure?new=1')}
  <p class="small muted mt-4">${t(K + 'infra.sub')}</p>`;
}

function ffHtml(ctx, lang){
  const q = ctx.query.q || '';
  const rows = filterList(store.freedom_fighters, { q, fields: ['name_bn', 'name_en', 'area'] });
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t(K + 'ff.title')}</h1><p class="sub">${t(K + 'ff.sub')}</p></div>
  <div class="row"><a class="btn btn-primary" href="#/freedom-fighters?new=1">${t(K + 'ff.new')}</a></div></div>
  <div class="mt-6">${renderFilters({ q, chips: [], activeChip: null })}</div>
  ${rows.length ? renderTable({ columns: [
    { key: 'name_bn', label: t(K + 'ff.colName'), sortable: true, render: r => `<strong>${esc(nm(r, lang))}</strong>` },
    { key: 'age_band', label: t(K + 'ff.colAge'), render: r => esc(r.age_band || '—') },
    { key: 'area', label: t(K + 'ff.colArea'), sortable: true, render: r => esc(r.area || '') },
    { key: 'visibility', label: t(K + 'ff.colVisibility'), render: r => plainBadge(visLabel(r.visibility)) }
  ], rows, page: 1, perPage: 20, onRowClick: r => '#/directory/' + r.id, stacked: true, sort: tableSort(ctx) }) : emptyState(t('common.empty'), t(K + 'ff.new'), '#/freedom-fighters?new=1')}
  <p class="small muted mt-4">${t(K + 'detail.noDob')}</p>`;
}

function simpleForm(ctx, titleKey, formId, ageField){
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t(K + titleKey)}</h1></div></div>
  <form id="${formId}" class="card" novalidate>
    <div id="simple-errors"></div>
    ${field({ id: 's-name-bn', label: t(K + 'form.nameBn'), value: '', required: true })}
    ${field({ id: 's-name-en', label: t(K + 'form.nameEn'), value: '' })}
    ${field({ id: 's-area', label: t(K + 'form.area'), value: 'সাতানীপাড়া' })}
    ${field({ id: 's-role', label: t(K + 'form.role'), value: '' })}
    ${ageField ? field({ id: 's-age', label: t(K + 'form.age'), value: '' }) : ''}
    ${ageField ? `<div class="hint">${t(K + 'form.noDobHint')}</div>` : ''}
    ${field({ id: 's-visibility', label: t(K + 'form.visibility'), value: 'members-only', hint: t(K + 'form.consentHint'), options: [
      { value: 'public', label: t(K + 'vis.public') },
      { value: 'members-only', label: t(K + 'vis.members') },
      { value: 'private', label: t(K + 'vis.private') }
    ] })}
    ${field({ id: 's-consent', label: t(K + 'form.consent'), value: 'granted', options: [
      { value: 'granted', label: t(K + 'consent.granted') },
      { value: 'withdrawn', label: t(K + 'consent.withdrawn') },
      { value: 'pending', label: t(K + 'consent.pending') }
    ] })}
    <div class="row mt-4"><button type="submit" class="btn btn-primary">${t(K + 'form.save')}</button>
    <a class="btn btn-secondary" href="${ageField ? '#/freedom-fighters' : '#/infrastructure'}">${t(K + 'form.cancel')}</a></div>
  </form>`;
}
function infraFormHtml(ctx){ return simpleForm(ctx, 'infra.new', 'infra-form', false); }
function ffFormHtml(ctx){ return simpleForm(ctx, 'ff.new', 'ff-form', true); }

function saveSimple(ctx, form, coll, prefix, backHash){
  const fd = new FormData(form);
  const nameBn = String(fd.get('s-name-bn') || '').trim();
  const vis = String(fd.get('s-visibility') || 'members-only');
  const consent = String(fd.get('s-consent') || 'granted');
  const errs = [];
  if(!validateRequired(nameBn)) errs.push({ id: 's-name-bn', message: t(K + 'form.required') });
  if(vis === 'public' && consent !== 'granted') errs.push({ id: 's-visibility', message: t(K + 'toast.consentBlocked') });
  const box = document.getElementById('simple-errors');
  if(errs.length){ box.innerHTML = errorSummary(errs); const s = box.querySelector('.error-summary'); if(s) s.focus(); return; }
  const kind = prefix === 'lm' ? 'landmarks' : 'freedom_fighters';
  const rec = { id: prefix + '-' + Date.now(), name_bn: nameBn, name_en: String(fd.get('s-name-en') || '').trim(),
    area: String(fd.get('s-area') || '').trim(), visibility: vis, consent_status: consent, kind };
  if(prefix === 'lm') rec.type_bn = String(fd.get('s-role') || '').trim();
  else rec.age_band = String(fd.get('s-age') || '').trim();
  coll.push(rec);
  writeAudit(ctx.user.id, ctx.role, 'directory.create', 'directory', rec.id, null, rec.visibility);
  ctx.toast(t(K + 'toast.saved'));
  go(backHash);
}
