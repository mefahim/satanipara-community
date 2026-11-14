// Households view — #/households, #/households/new, #/households/:id.
// DEMO data only. Household-member links exist in demo data for hh-1/hh-2
// (persons + members carry household_id); hh-3 has none, so its detail keeps
// the honest empty state instead of inventing family relationships.
// v2: shared statCard/statGrid, real table sorting (?sort=&dir=), field()
// select variants, .link-more, no 350 ms toast delay.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { go, hashWithQuery } from '../js/lib/router.js';
import { store, filterList, writeAudit } from '../js/lib/store.js';
import { fmtNum, esc } from '../js/lib/format.js';
import { renderTable, bindTableRows, bindTableSort } from '../js/components/table.js';
import { renderFilters, bindFilters } from '../js/components/filters.js';
import { statGrid } from '../js/components/stat.js';
import { badge, plainBadge } from '../js/components/badges.js';
import { field, errorSummary, validateRequired } from '../js/components/forms.js';
import { emptyState } from '../js/components/states.js';

const STRINGS = {
  bn: {
    'list.title': 'পরিবারসমূহ', 'list.sub': 'সম্প্রদায়ের পরিবারভিত্তিক তথ্য — নমুনা তথ্য।', 'list.new': 'নতুন পরিবার যোগ করুন', 'list.colName': 'পরিবারের নাম',
    'list.colArea': 'এলাকা', 'list.colMembers': 'সদস্য সংখ্যা', 'list.colVisibility': 'দৃশ্যমানতা', 'list.colConsent': 'সম্মতি', 'chip.all': 'সবগুলো',
    'chip.active': 'সক্রিয়', 'chip.archived': 'আর্কাইভ করা', 'vis.public': 'সর্বজনীন', 'vis.members': 'শুধু সদস্যদের জন্য', 'vis.private': 'ব্যক্তিগত',
    'consent.granted': 'সম্মতি দেওয়া হয়েছে', 'consent.withdrawn': 'সম্মতি প্রত্যাহার করা হয়েছে', 'consent.pending': 'সম্মতি রেকর্ড করা হয়নি',
    'detail.title': 'পরিবারের বিবরণ', 'detail.membersTitle': 'পরিবারের সদস্য', 'detail.membersEmpty': 'এই পরিবারের সঙ্গে যুক্ত সদস্যের রেকর্ড নমুনা তথ্যে নেই।',
    'detail.membersNote': 'তথ্য হালনাগাদ হচ্ছে — সদস্য-পরিবার সংযোগ এখনো নমুনা তথ্যে যোগ করা হয়নি।', 'detail.linksTitle': 'সদস্যপদ সংযোগ',
    'detail.linksEmpty': 'এই পরিবারের সঙ্গে যুক্ত কোনো সদস্যপদের রেকর্ড নমুনা তথ্যে নেই।', 'detail.address': 'ঠিকানা / এলাকা', 'detail.area': 'এলাকা',
    'detail.count': 'সদস্য সংখ্যা', 'detail.visibility': 'দৃশ্যমানতা', 'detail.consent': 'সম্মতি', 'detail.edit': 'সম্পাদনা করুন', 'detail.archive': 'আর্কাইভ করুন',
    'detail.unarchive': 'আর্কাইভ থেকে ফেরান', 'detail.archivedNote': 'এই পরিবারটি আর্কাইভ করা হয়েছে।', 'detail.viewMembers': 'সদস্য তালিকা দেখুন',
    'form.titleNew': 'নতুন পরিবার', 'form.titleEdit': 'পরিবার সম্পাদনা', 'form.nameBn': 'পরিবারের নাম (বাংলা)', 'form.nameEn': 'পরিবারের নাম (ইংরেজি)',
    'form.area': 'এলাকা', 'form.members': 'সদস্য সংখ্যা', 'form.visibility': 'দৃশ্যমানতা', 'form.consent': 'সম্মতির অবস্থা', 'form.save': 'সংরক্ষণ করুন',
    'form.cancel': 'বাতিল', 'form.required': 'এই ঘরটি পূরণ করা আবশ্যক।', 'form.consentHint': 'সর্বজনীন করতে হলে সম্মতি রেকর্ড করা থাকতে হবে।',
    'toast.saved': 'পরিবার সংরক্ষণ করা হয়েছে।', 'toast.archived': 'পরিবার আর্কাইভ করা হয়েছে।', 'toast.unarchived': 'পরিবার আর্কাইভ থেকে ফেরানো হয়েছে।',
    'toast.consentBlocked': 'সম্মতি ছাড়া সর্বজনীন করা যাবে না।', 'modal.archiveTitle': 'পরিবার আর্কাইভ করবেন?',
    'modal.archiveBody': 'এই পরিবারটি আর্কাইভ করা হবে; তালিকায় আর সক্রিয় হিসেবে দেখাবে না। তথ্য মুছে যাবে না।', 'modal.unarchiveTitle': 'আর্কাইভ থেকে ফেরাবেন?',
    'modal.unarchiveBody': 'এই পরিবারটি আবার সক্রিয় তালিকায় ফিরবে।', 'notFound': 'এই পরিবারটি পাওয়া যায়নি।'
  },
  en: {
    'list.title': 'Households', 'list.sub': 'Household records for the community — demo data.', 'list.new': 'Add household', 'list.colName': 'Household name',
    'list.colArea': 'Area', 'list.colMembers': 'Members', 'list.colVisibility': 'Visibility', 'list.colConsent': 'Consent', 'chip.all': 'All', 'chip.active': 'Active',
    'chip.archived': 'Archived', 'vis.public': 'Public', 'vis.members': 'Members only', 'vis.private': 'Private', 'consent.granted': 'Consent granted',
    'consent.withdrawn': 'Consent withdrawn', 'consent.pending': 'Consent not recorded', 'detail.title': 'Household detail', 'detail.membersTitle': 'Household members',
    'detail.membersEmpty': 'No member records are linked to this household in the demo data.',
    'detail.membersNote': 'Information is being updated — household–member links are not yet in the demo data.', 'detail.linksTitle': 'Membership links',
    'detail.linksEmpty': 'No membership records are linked to this household in the demo data.', 'detail.address': 'Address / area', 'detail.area': 'Area',
    'detail.count': 'Member count', 'detail.visibility': 'Visibility', 'detail.consent': 'Consent', 'detail.edit': 'Edit', 'detail.archive': 'Archive',
    'detail.unarchive': 'Restore from archive', 'detail.archivedNote': 'This household is archived.', 'detail.viewMembers': 'View member list',
    'form.titleNew': 'New household', 'form.titleEdit': 'Edit household', 'form.nameBn': 'Household name (Bengali)', 'form.nameEn': 'Household name (English)',
    'form.area': 'Area', 'form.members': 'Member count', 'form.visibility': 'Visibility', 'form.consent': 'Consent status', 'form.save': 'Save', 'form.cancel': 'Cancel',
    'form.required': 'This field is required.', 'form.consentHint': 'Public visibility requires recorded consent.', 'toast.saved': 'Household saved.',
    'toast.archived': 'Household archived.', 'toast.unarchived': 'Household restored from archive.', 'toast.consentBlocked': 'Cannot make public without consent.',
    'modal.archiveTitle': 'Archive this household?',
    'modal.archiveBody': 'This household will be archived and will no longer appear as active. No data will be deleted.',
    'modal.unarchiveTitle': 'Restore from archive?', 'modal.unarchiveBody': 'This household will return to the active list.', 'notFound': 'This household was not found.'
  }
};
registerStrings('households', STRINGS);

const K = 'households.';
const visLabel = v => t(K + (v === 'public' ? 'vis.public' : v === 'members-only' ? 'vis.members' : 'vis.private'));
const consentLabel = c => t(K + (c === 'granted' ? 'consent.granted' : c === 'withdrawn' ? 'consent.withdrawn' : 'consent.pending'));
const visBadge = v => plainBadge(visLabel(v));
const consentBadge = c => badge(c === 'granted' ? 'published' : 'draft', consentLabel(c));
const nm = (it, lang) => lang === 'bn' ? (it.name_bn || it.name_en) : (it.name_en || it.name_bn);
// Query state for the list: q / archived / sort / dir. Patches merge over the
// current query so a sort click never drops the active search or chip.
function tableSort(ctx){
  const k = ctx.query.sort, d = ctx.query.dir;
  return k && ['name_bn', 'area', 'members_count', 'visibility'].includes(k) && (d === 'asc' || d === 'desc') ? { key: k, dir: d } : null;
}

export const Households = {
  route: '#/households',
  title: { bn: 'পরিবারসমূহ', en: 'Households' },
  breadcrumb: ['nav.community', 'nav.households'],
  roles: ['super-admin'],
  permissions: ['directory.view'],
  render(ctx){
    const lang = getLang();
    if(ctx.path === '/households/new') return formHtml(ctx, null);
    if(ctx.params.id){
      const hh = store.households.find(h => h.id === ctx.params.id);
      if(!hh) return `<span class="demo-badge">${t('app.demo')}</span>` + emptyState(t(K + 'notFound'), t('common.back'), '#/households');
      return ctx.query.edit ? formHtml(ctx, hh) : detailHtml(ctx, hh, lang);
    }
    return listHtml(ctx, lang);
  },
  onMount(ctx){
    const lang = getLang();
    bindTableRows(document.getElementById('view'));
    bindTableSort(document.getElementById('view'), (key, dir) => go(hashWithQuery('#/households', ctx.query, { sort: key, dir })));
    ctx.shell.setTitle(t(K + (ctx.path === '/households/new' ? 'form.titleNew' : ctx.params.id ? 'detail.title' : 'list.title')));
    ctx.shell.setBreadcrumb(['nav.community', 'nav.households']);
    bindFilters(document.getElementById('view'), {
      onSearch: q => go(hashWithQuery('#/households', ctx.query, { q })),
      onChip: v => go(hashWithQuery('#/households', ctx.query, { archived: v === 'all' ? '' : v })),
      onClear: () => go('#/households')
    });
    const form = document.getElementById('hh-form');
    if(form) form.addEventListener('submit', e => { e.preventDefault(); saveHousehold(ctx, form); });
    document.querySelectorAll('[data-hh-archive]').forEach(b => b.addEventListener('click', () => {
      const hh = store.households.find(h => h.id === b.dataset.hhArchive);
      if(!hh) return;
      const arch = !hh.archived;
      ctx.modal({
        title: t(K + (arch ? 'modal.archiveTitle' : 'modal.unarchiveTitle')),
        body: `<p>${t(K + (arch ? 'modal.archiveBody' : 'modal.unarchiveBody'))}</p><p class="mt-4"><strong>${esc(nm(hh, lang))}</strong></p>`,
        confirmLabel: t('common.confirm'), danger: arch,
        onConfirm: () => {
          const old = hh.archived ? 'archived' : 'active';
          hh.archived = arch;
          writeAudit(ctx.user.id, ctx.role, arch ? 'household.archive' : 'household.unarchive', 'household', hh.id, old, arch ? 'archived' : 'active');
          ctx.toast(t(K + (arch ? 'toast.archived' : 'toast.unarchived')));
          ctx.rerender();
        }
      });
    }));
  },
  onUnmount(){}
};

function listHtml(ctx, lang){
  const q = ctx.query.q || '';
  const arch = ctx.query.archived || '';
  let rows = filterList(store.households, { q, fields: ['name_bn', 'name_en', 'area'] });
  if(arch === 'active') rows = rows.filter(h => !h.archived);
  if(arch === 'archived') rows = rows.filter(h => h.archived);
  const chips = [
    { value: 'all', label: t(K + 'chip.all') },
    { value: 'active', label: t(K + 'chip.active') },
    { value: 'archived', label: t(K + 'chip.archived') }
  ];
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t(K + 'list.title')}</h1><p class="sub">${t(K + 'list.sub')}</p></div>
  <div class="row"><a class="btn btn-primary" href="#/households/new">${t(K + 'list.new')}</a></div></div>
  ${statGrid([
    { href: '#/households', num: fmtNum(store.households.length, lang), label: t(K + 'list.title') },
    { href: '#/households?archived=active', num: fmtNum(store.households.filter(h => !h.archived).length, lang), label: t(K + 'chip.active') },
    { href: '#/households?archived=archived', num: fmtNum(store.households.filter(h => h.archived).length, lang), label: t(K + 'chip.archived') },
    { href: '#/households', num: fmtNum(store.households.filter(h => h.visibility === 'public').length, lang), label: t(K + 'vis.public') }
  ])}
  <div class="mt-6">${renderFilters({ q, chips, activeChip: arch || 'all' })}</div>
  ${rows.length ? renderTable({ columns: [
    { key: 'name_bn', label: t(K + 'list.colName'), sortable: true, render: r => `<strong>${esc(nm(r, lang))}</strong>${r.archived ? ' ' + badge('draft', t(K + 'chip.archived')) : ''}` },
    { key: 'area', label: t(K + 'list.colArea'), sortable: true, render: r => esc(r.area || '') },
    { key: 'members_count', label: t(K + 'list.colMembers'), sortable: true, render: r => fmtNum(r.members_count ?? 0, lang) },
    { key: 'visibility', label: t(K + 'list.colVisibility'), render: r => visBadge(r.visibility) },
    { key: 'consent_status', label: t(K + 'list.colConsent'), render: r => consentBadge(r.consent_status) }
  ], rows, page: 1, perPage: 20, onRowClick: r => '#/households/' + r.id, stacked: true, sort: tableSort(ctx) }) : emptyState(t('common.empty'), t(K + 'list.new'), '#/households/new')}`;
}

function detailHtml(ctx, hh, lang){
  const linkedPersons = store.persons.filter(p => p.household_id === hh.id);
  const linkedMembers = store.members.filter(m => m.household_id === hh.id);
  const personRow = p => `<a class="list-row" href="#/directory/${p.id}"><div class="grow"><strong>${esc(nm(p, lang))}</strong><br><span class="small muted">${esc(p.profession_bn || '')}${p.age_band ? ' · ' + esc(p.age_band) : ''}</span></div></a>`;
  const memberRow = m => `<a class="list-row" href="#/members/${m.id}"><div class="grow"><strong>${esc(nm(m, lang))}</strong><br><span class="small muted num">${esc(m.member_id || '')}</span></div></a>`;
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${esc(nm(hh, lang))}</h1><p class="sub">${t(K + 'detail.title')}</p></div>
  <div class="row"><a class="btn btn-secondary" href="#/households/${hh.id}?edit=1">${t(K + 'detail.edit')}</a>
  <button type="button" class="btn btn-secondary" data-hh-archive="${hh.id}">${t(K + (hh.archived ? 'detail.unarchive' : 'detail.archive'))}</button></div></div>
  ${hh.archived ? `<div class="error-box" role="note"><strong>${t(K + 'detail.archivedNote')}</strong></div>` : ''}
  <div class="detail-grid"><div>
  <section class="card"><h3>${t(K + 'detail.address')}</h3>
    <dl class="kv"><dt>${t(K + 'detail.area')}</dt><dd>${esc(hh.area || '')}</dd>
    <dt>${t(K + 'detail.count')}</dt><dd class="num">${fmtNum(hh.members_count ?? 0, lang)}</dd>
    <dt>${t(K + 'detail.visibility')}</dt><dd>${visBadge(hh.visibility)}</dd>
    <dt>${t(K + 'detail.consent')}</dt><dd>${consentBadge(hh.consent_status)}</dd></dl></section>
  <section class="card"><h3>${t(K + 'detail.membersTitle')}</h3>
    ${linkedPersons.length || linkedMembers.length ? [...linkedPersons.map(personRow), ...linkedMembers.map(memberRow)].join('') : emptyState(t(K + 'detail.membersEmpty')) + `<p class="small muted">${t(K + 'detail.membersNote')}</p>`}
    <p class="mt-4"><a class="btn btn-secondary" href="#/members">${t(K + 'detail.viewMembers')}</a></p></section>
  </div><div>
  <section class="card"><h3>${t(K + 'detail.linksTitle')}</h3>
    ${linkedMembers.length ? linkedMembers.map(memberRow).join('') : emptyState(t(K + 'detail.linksEmpty'))}</section>
  </div></div>
  <p class="mt-4"><a class="link-more" href="#/households">${t('common.back')}</a></p>`;
}

function formHtml(ctx, hh){
  const isNew = !hh;
  const v = hh || { name_bn: '', name_en: '', area: 'সাতানীপাড়া', members_count: '', visibility: 'members-only', consent_status: 'granted' };
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t(K + (isNew ? 'form.titleNew' : 'form.titleEdit'))}</h1></div></div>
  <form id="hh-form" class="card" novalidate>
    <div id="hh-errors"></div>
    ${field({ id: 'f-name-bn', label: t(K + 'form.nameBn'), value: v.name_bn, required: true })}
    ${field({ id: 'f-name-en', label: t(K + 'form.nameEn'), value: v.name_en })}
    ${field({ id: 'f-area', label: t(K + 'form.area'), value: v.area })}
    ${field({ id: 'f-members', label: t(K + 'form.members'), type: 'number', value: String(v.members_count ?? ''), attrs: 'min="0" step="1"' })}
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
    <a class="btn btn-secondary" href="${isNew ? '#/households' : '#/households/' + hh.id}">${t(K + 'form.cancel')}</a></div>
  </form>`;
}

function saveHousehold(ctx, form){
  const fd = new FormData(form);
  const nameBn = String(fd.get('f-name-bn') || '').trim();
  const vis = String(fd.get('f-visibility') || 'members-only');
  const consent = String(fd.get('f-consent') || 'granted');
  const errs = [];
  if(!validateRequired(nameBn)) errs.push({ id: 'f-name-bn', message: t(K + 'form.required') });
  if(vis === 'public' && consent !== 'granted') errs.push({ id: 'f-visibility', message: t(K + 'toast.consentBlocked') });
  const box = document.getElementById('hh-errors');
  if(errs.length){
    box.innerHTML = errorSummary(errs);
    const s = box.querySelector('.error-summary');
    if(s) s.focus();
    return;
  }
  const id = ctx.params.id;
  const existing = id ? store.households.find(h => h.id === id) : null;
  const rec = {
    id: existing ? existing.id : 'hh-' + Date.now(),
    name_bn: nameBn,
    name_en: String(fd.get('f-name-en') || '').trim(),
    area: String(fd.get('f-area') || '').trim(),
    members_count: Math.max(0, parseInt(String(fd.get('f-members') || '0'), 10) || 0),
    visibility: vis,
    consent_status: consent,
    archived: existing ? !!existing.archived : false
  };
  if(existing) Object.assign(existing, rec);
  else store.households.push(rec);
  writeAudit(ctx.user.id, ctx.role, existing ? 'household.update' : 'household.create', 'household', rec.id, existing ? 'updated' : null, rec.visibility);
  go('#/households/' + rec.id);
  ctx.toast(t(K + 'toast.saved'));
}
