// Organisation view — #/organisation (home), #/organisation/history,
// #/organisation/constitution, #/organisation/committee (?tab=executive|advisory|former),
// #/organisation/achievements.
// DEMO data only. NEVER invent milestones: the ONLY verified milestone is the
// founding year 1999. The draft milestone stays visibly DRAFT/unverified and
// can never be published as verified — there is no verify action in this UI.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store, filterList, writeAudit } from '../js/lib/store.js';
import { fmtNum, esc } from '../js/lib/format.js';
import { renderTable, bindTableRows } from '../js/components/table.js';
import { renderFilters, bindFilters } from '../js/components/filters.js';
import { badge, plainBadge } from '../js/components/badges.js';
import { field, errorSummary, validateRequired } from '../js/components/forms.js';
import { emptyState } from '../js/components/states.js';

const STRINGS = {
  bn: {
    'home.title': 'সংগঠন', 'home.sub': 'সাতানীপাড়া সমাজ কল্যাণ সংঘ (প্রতিষ্ঠা ১৯৯৯) — নমুনা তথ্য।', 'home.milestones': 'ইতিহাসের মাইলফলক',
    'home.constitution': 'গঠনতন্ত্র', 'home.committee': 'কমিটি', 'home.achievements': 'অর্জন',
    'home.verifiedOnly': 'শুধু যাচাইকৃত মাইলফলকই প্রকাশ করা যায়। যাচাইকৃত মাইলফলক একটিই — ১৯৯৯ সালের প্রতিষ্ঠা।', 'home.viewHistory': 'ইতিহাস দেখুন',
    'home.viewConstitution': 'গঠনতন্ত্র দেখুন', 'home.viewCommittee': 'কমিটি দেখুন', 'home.viewAchievements': 'অর্জন দেখুন', 'hist.title': 'ইতিহাস ও সময়রেখা',
    'hist.sub': 'মাইলফলক — শুধু ১৯৯৯ সালের প্রতিষ্ঠা যাচাইকৃত। নতুন মাইলফলক অনুমান করে যোগ করা যাবে না।', 'hist.new': 'নতুন মাইলফলক (খসড়া)', 'hist.colYear': 'বছর',
    'hist.colTitle': 'শিরোনাম', 'hist.colStatus': 'অবস্থা', 'hist.verified': 'যাচাইকৃত', 'hist.draft': 'খসড়া — যাচাই হয়নি', 'hist.published': 'প্রকাশিত',
    'hist.archived': 'আর্কাইভ করা', 'hist.cannotPublish': 'প্রকাশ করা যাবে না — যাচাই হয়নি', 'hist.publish': 'প্রকাশ করুন', 'hist.edit': 'সম্পাদনা করুন',
    'hist.unpublish': 'প্রকাশ প্রত্যাহার করুন', 'hist.archive': 'আর্কাইভ করুন', 'hist.unarchive': 'আর্কাইভ থেকে ফেরান', 'const.title': 'গঠনতন্ত্র',
    'const.sub': 'গঠনতন্ত্রের সংস্করণসমূহ — পুরোনো সংস্করণ সংরক্ষিত থাকে।', 'const.new': 'নতুন সংস্করণ যোগ করুন', 'const.colVersion': 'সংস্করণ',
    'const.colDate': 'কার্যকর তারিখ', 'const.colStatus': 'অবস্থা', 'const.current': 'বর্তমান', 'const.superseded': 'প্রতিস্থাপিত', 'const.setCurrent': 'বর্তমান করুন',
    'const.preview': 'সারাংশ দেখুন', 'comm.title': 'কমিটি', 'comm.sub': 'কার্যনির্বাহী কমিটি, উপদেষ্টা পরিষদ ও সাবেক নেতৃবৃন্দ।',
    'comm.tabExecutive': 'কার্যনির্বাহী কমিটি', 'comm.tabAdvisory': 'উপদেষ্টা পরিষদ', 'comm.tabFormer': 'সাবেক নেতৃবৃন্দ', 'comm.new': 'নতুন সদস্য যোগ করুন',
    'comm.colName': 'নাম', 'comm.colRole': 'পদ', 'comm.colTerm': 'মেয়াদ', 'comm.remove': 'সরান', 'comm.noTerm': 'মেয়াদ নির্ধারিত হয়নি', 'ach.title': 'অর্জনসমূহ',
    'ach.sub': 'সংগঠনের অর্জন — নমুনা তথ্য।', 'ach.new': 'নতুন অর্জন যোগ করুন', 'ach.colYear': 'বছর', 'ach.colTitle': 'শিরোনাম', 'ach.colStatus': 'অবস্থা',
    'ach.archive': 'আর্কাইভ করুন', 'ach.unarchive': 'আর্কাইভ থেকে ফেরান', 'form.title': 'শিরোনাম (বাংলা)', 'form.titleEn': 'শিরোনাম (ইংরেজি)',
    'form.body': 'বিবরণ (বাংলা)', 'form.year': 'বছর', 'form.version': 'সংস্করণ (যেমন v3)', 'form.date': 'কার্যকর তারিখ', 'form.summary': 'সারাংশ (বাংলা)',
    'form.nameBn': 'নাম (বাংলা)', 'form.nameEn': 'নাম (ইংরেজি)', 'form.role': 'পদ', 'form.term': 'মেয়াদ (যেমন ২০২৪–২০২৬)', 'form.save': 'সংরক্ষণ করুন',
    'form.cancel': 'বাতিল', 'form.required': 'এই ঘরটি পূরণ করা আবশ্যক।', 'form.draftNote': 'নতুন মাইলফলক সবসময় খসড়া হিসেবে তৈরি হয় — যাচাই ছাড়া প্রকাশ করা যাবে না।',
    'toast.saved': 'সংরক্ষণ করা হয়েছে।', 'toast.archived': 'আর্কাইভ করা হয়েছে।', 'toast.unarchived': 'আর্কাইভ থেকে ফেরানো হয়েছে।',
    'toast.published': 'প্রকাশ করা হয়েছে।', 'toast.unpublished': 'প্রকাশ প্রত্যাহার করা হয়েছে।', 'toast.currentSet': 'বর্তমান সংস্করণ নির্ধারণ করা হয়েছে।',
    'toast.removed': 'সদস্য সরানো হয়েছে।', 'toast.cannotPublish': 'যাচাই হয়নি এমন মাইলফলক প্রকাশ করা যাবে না।', 'modal.archiveTitle': 'আর্কাইভ করবেন?',
    'modal.archiveBody': 'এই রেকর্ডটি আর্কাইভ করা হবে। তথ্য মুছে যাবে না।', 'modal.removeTitle': 'সদস্য সরাবেন?', 'modal.removeBody': 'এই সদস্যকে কমিটি থেকে সরানো হবে।',
    'modal.currentTitle': 'এই সংস্করণটি বর্তমান করবেন?', 'modal.currentBody': 'আগের বর্তমান সংস্করণটি প্রতিস্থাপিত হিসেবে চিহ্নিত হবে; পুরোনো সংস্করণ সংরক্ষিত থাকবে।',
    'notFound': 'এই রেকর্ডটি পাওয়া যায়নি।'
  },
  en: {
    'home.title': 'Organisation', 'home.sub': 'Satanipara Somaj Kallyan Sangha (founded 1999) — demo data.', 'home.milestones': 'History milestones',
    'home.constitution': 'Constitution', 'home.committee': 'Committee', 'home.achievements': 'Achievements',
    'home.verifiedOnly': 'Only verified milestones can be published. The only verified milestone is the 1999 founding.', 'home.viewHistory': 'View history',
    'home.viewConstitution': 'View constitution', 'home.viewCommittee': 'View committee', 'home.viewAchievements': 'View achievements',
    'hist.title': 'History & Timeline', 'hist.sub': 'Milestones — only the 1999 founding is verified. Never add a milestone by guessing.',
    'hist.new': 'New milestone (draft)', 'hist.colYear': 'Year', 'hist.colTitle': 'Title', 'hist.colStatus': 'Status', 'hist.verified': 'Verified',
    'hist.draft': 'Draft — unverified', 'hist.published': 'Published', 'hist.archived': 'Archived', 'hist.cannotPublish': 'Cannot publish — unverified',
    'hist.publish': 'Publish', 'hist.edit': 'Edit', 'hist.unpublish': 'Unpublish', 'hist.archive': 'Archive', 'hist.unarchive': 'Restore from archive',
    'const.title': 'Constitution', 'const.sub': 'Constitution versions — old versions are retained.', 'const.new': 'Add new version', 'const.colVersion': 'Version',
    'const.colDate': 'Effective date', 'const.colStatus': 'Status', 'const.current': 'Current', 'const.superseded': 'Superseded', 'const.setCurrent': 'Set as current',
    'const.preview': 'View summary', 'comm.title': 'Committee', 'comm.sub': 'Executive committee, advisory council and former leaders.',
    'comm.tabExecutive': 'Executive Committee', 'comm.tabAdvisory': 'Advisory Council', 'comm.tabFormer': 'Former Leaders', 'comm.new': 'Add member',
    'comm.colName': 'Name', 'comm.colRole': 'Role', 'comm.colTerm': 'Term', 'comm.remove': 'Remove', 'comm.noTerm': 'No term set', 'ach.title': 'Achievements',
    'ach.sub': 'Organisation achievements — demo data.', 'ach.new': 'Add achievement', 'ach.colYear': 'Year', 'ach.colTitle': 'Title', 'ach.colStatus': 'Status',
    'ach.archive': 'Archive', 'ach.unarchive': 'Restore from archive', 'form.title': 'Title (Bengali)', 'form.titleEn': 'Title (English)',
    'form.body': 'Description (Bengali)', 'form.year': 'Year', 'form.version': 'Version (e.g. v3)', 'form.date': 'Effective date', 'form.summary': 'Summary (Bengali)',
    'form.nameBn': 'Name (Bengali)', 'form.nameEn': 'Name (English)', 'form.role': 'Role', 'form.term': 'Term (e.g. 2024–2026)', 'form.save': 'Save',
    'form.cancel': 'Cancel', 'form.required': 'This field is required.',
    'form.draftNote': 'A new milestone is always created as a draft — it cannot be published without verification.', 'toast.saved': 'Saved.',
    'toast.archived': 'Archived.', 'toast.unarchived': 'Restored from archive.', 'toast.published': 'Published.', 'toast.unpublished': 'Unpublished.',
    'toast.currentSet': 'Current version set.', 'toast.removed': 'Member removed.', 'toast.cannotPublish': 'An unverified milestone cannot be published.',
    'modal.archiveTitle': 'Archive this record?', 'modal.archiveBody': 'This record will be archived. No data will be deleted.',
    'modal.removeTitle': 'Remove this member?', 'modal.removeBody': 'This member will be removed from the committee.',
    'modal.currentTitle': 'Set this version as current?', 'modal.currentBody': 'The previous current version will be marked superseded; old versions are retained.',
    'notFound': 'This record was not found.'
  }
};
registerStrings('organisation', STRINGS);
const K = 'organisation.';
const nm = (it, lang) => lang === 'bn' ? (it.title_bn || it.name_bn || it.title_en || it.name_en) : (it.title_en || it.name_en || it.title_bn || it.name_bn);
function go(hash){ location.hash = hash; }
function withQuery(base, patch){
  const p = new URLSearchParams(location.hash.split('?')[1] || '');
  for(const [k, v] of Object.entries(patch)){ if(v) p.set(k, v); else p.delete(k); }
  const s = p.toString();
  return base + (s ? '?' + s : '');
}
const statusBadge = s => badge(s === 'published' ? 'published' : s === 'draft' ? 'draft' : 'draft',
  s === 'published' ? t(K + 'hist.published') : s === 'archived' ? t(K + 'hist.archived') : t(K + 'hist.draft'));

export const Organisation = {
  route: '#/organisation',
  title: { bn: 'সংগঠন', en: 'Organisation' },
  breadcrumb: ['nav.organisation', 'nav.history'],
  roles: ['super-admin'],
  permissions: ['organisation.manage'],
  render(ctx){
    const lang = getLang();
    if(ctx.path === '/organisation/history') return ctx.query.new || ctx.query.edit ? milestoneFormHtml(ctx) : historyHtml(ctx, lang);
    if(ctx.path === '/organisation/constitution') return ctx.query.new ? constitutionFormHtml(ctx) : constitutionHtml(ctx, lang);
    if(ctx.path === '/organisation/committee') return ctx.query.new ? committeeFormHtml(ctx) : committeeHtml(ctx, lang);
    if(ctx.path === '/organisation/achievements') return ctx.query.new || ctx.query.edit ? achievementFormHtml(ctx) : achievementsHtml(ctx, lang);
    return homeHtml(ctx, lang);
  },
  onMount(ctx){
    const lang = getLang();
    bindTableRows(document.getElementById('view'));
    const titles = { '/organisation/history': 'hist.title', '/organisation/constitution': 'const.title', '/organisation/committee': 'comm.title', '/organisation/achievements': 'ach.title' };
    const crumbs = { '/organisation/history': 'nav.history', '/organisation/constitution': 'nav.constitution', '/organisation/committee': 'nav.committee', '/organisation/achievements': 'nav.achievements' };
    ctx.shell.setTitle(t(K + (titles[ctx.path] || 'home.title')));
    ctx.shell.setBreadcrumb(['nav.organisation', crumbs[ctx.path] || 'nav.history']);
    bindFilters(document.getElementById('view'), {
      onSearch: q => go(withQuery(ctx.path, { q })),
      onChip: () => {},
      onClear: () => go(ctx.path)
    });
    const form = document.getElementById('org-form');
    if(form) form.addEventListener('submit', e => { e.preventDefault(); saveOrg(ctx, form); });
    // Milestone publish / unpublish / archive.
    document.querySelectorAll('[data-ms-action]').forEach(b => b.addEventListener('click', () => {
      const ms = store.milestones.find(m => m.id === b.dataset.msAction);
      const act = b.dataset.msKind;
      if(!ms) return;
      if(act === 'publish'){
        if(!ms.verified){ ctx.toast(t(K + 'toast.cannotPublish')); return; }
        ms.status = 'published';
        writeAudit(ctx.user.id, ctx.role, 'milestone.publish', 'milestone', ms.id, 'draft', 'published');
        ctx.toast(t(K + 'toast.published'));
        ctx.rerender();
      } else if(act === 'unpublish'){
        ms.status = 'draft';
        writeAudit(ctx.user.id, ctx.role, 'milestone.unpublish', 'milestone', ms.id, 'published', 'draft');
        ctx.toast(t(K + 'toast.unpublished'));
        ctx.rerender();
      } else if(act === 'archive' || act === 'unarchive'){
        const arch = act === 'archive';
        ctx.modal({ title: t(K + 'modal.archiveTitle'), body: `<p>${t(K + 'modal.archiveBody')}</p><p class="mt-4"><strong>${esc(nm(ms, lang))}</strong></p>`,
          confirmLabel: t('common.confirm'), danger: arch,
          onConfirm: () => { ms.status = arch ? 'archived' : 'draft'; writeAudit(ctx.user.id, ctx.role, arch ? 'milestone.archive' : 'milestone.unarchive', 'milestone', ms.id, arch ? 'draft' : 'archived', arch ? 'archived' : 'draft'); ctx.toast(t(K + (arch ? 'toast.archived' : 'toast.unarchived'))); ctx.rerender(); } });
      }
    }));
    // Constitution: set current + preview.
    document.querySelectorAll('[data-cv-current]').forEach(b => b.addEventListener('click', () => {
      const cv = store.constitution_versions.find(v => v.id === b.dataset.cvCurrent);
      if(!cv) return;
      ctx.modal({ title: t(K + 'modal.currentTitle'), body: `<p>${t(K + 'modal.currentBody')}</p><p class="mt-4"><strong>${esc(cv.version)}</strong></p>`,
        confirmLabel: t('common.confirm'),
        onConfirm: () => { store.constitution_versions.forEach(v => { v.status = v.id === cv.id ? 'current' : 'superseded'; }); writeAudit(ctx.user.id, ctx.role, 'constitution.set_current', 'constitution', cv.id, null, 'current'); ctx.toast(t(K + 'toast.currentSet')); ctx.rerender(); } });
    }));
    document.querySelectorAll('[data-cv-preview]').forEach(b => b.addEventListener('click', () => {
      const cv = store.constitution_versions.find(v => v.id === b.dataset.cvPreview);
      if(!cv) return;
      ctx.drawer({ title: cv.version, body: `<p>${esc(cv.articles_bn || '')}</p><p class="small muted mt-4">${esc(cv.effective_date || '')}</p>` });
    }));
    // Committee: remove member.
    document.querySelectorAll('[data-cm-remove]').forEach(b => b.addEventListener('click', () => {
      const tab = b.dataset.cmTab;
      const coll = tab === 'advisory' ? store.advisors : tab === 'former' ? [...store.committee.former, ...store.past_leaders] : store.committee.current;
      const m = coll.find(x => x.id === b.dataset.cmRemove);
      if(!m) return;
      ctx.modal({ title: t(K + 'modal.removeTitle'), body: `<p>${t(K + 'modal.removeBody')}</p><p class="mt-4"><strong>${esc(nm(m, lang))}</strong></p>`,
        confirmLabel: t('common.confirm'), danger: true,
        onConfirm: () => {
          for(const c of [store.committee.current, store.committee.former, store.advisors, store.past_leaders]){
            const i = c.indexOf(m);
            if(i >= 0) c.splice(i, 1);
          }
          writeAudit(ctx.user.id, ctx.role, 'committee.remove', 'committee', m.id, 'member', 'removed');
          ctx.toast(t(K + 'toast.removed'));
          ctx.rerender();
        } });
    }));
    // Achievements: archive / unarchive.
    document.querySelectorAll('[data-ac-action]').forEach(b => b.addEventListener('click', () => {
      const ac = store.achievements.find(a => a.id === b.dataset.acAction);
      if(!ac) return;
      const arch = b.dataset.acKind === 'archive';
      ac.archived = arch;
      writeAudit(ctx.user.id, ctx.role, arch ? 'achievement.archive' : 'achievement.unarchive', 'achievement', ac.id, arch ? 'active' : 'archived', arch ? 'archived' : 'active');
      ctx.toast(t(K + (arch ? 'toast.archived' : 'toast.unarchived')));
      ctx.rerender();
    }));
  },
  onUnmount(){}
};

function homeHtml(ctx, lang){
  const verified = store.milestones.find(m => m.verified);
  const current = store.constitution_versions.find(v => v.status === 'current');
  const stat = (href, num, label) => `<a class="stat" href="${href}"><div class="num">${num}</div><div class="lbl">${label}</div></a>`;
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t(K + 'home.title')}</h1><p class="sub">${t(K + 'home.sub')}</p></div></div>
  <div class="stat-grid">
    ${stat('#/organisation/history', fmtNum(store.milestones.length, lang), t(K + 'home.milestones'))}
    ${stat('#/organisation/constitution', fmtNum(store.constitution_versions.length, lang), t(K + 'home.constitution'))}
    ${stat('#/organisation/committee', fmtNum(store.committee.current.length + store.advisors.length, lang), t(K + 'home.committee'))}
    ${stat('#/organisation/achievements', fmtNum(store.achievements.length, lang), t(K + 'home.achievements'))}</div>
  <div class="two-col mt-6">
    <section class="card"><h3>${t(K + 'home.milestones')}</h3>
      ${verified ? `<p><strong>${esc(nm(verified, lang))}</strong> — ${fmtNum(verified.year, lang)} ${badge('published', t(K + 'hist.verified'))}</p>` : ''}
      <p class="small muted mt-4">${t(K + 'home.verifiedOnly')}</p>
      <p class="mt-4"><a href="#/organisation/history">${t(K + 'home.viewHistory')}</a></p></section>
    <section class="card"><h3>${t(K + 'home.constitution')}</h3>
      ${current ? `<p><strong>${esc(current.version)}</strong> · ${esc(current.effective_date || '')} ${plainBadge(t(K + 'const.current'))}</p><p class="small muted mt-4">${esc(current.articles_bn || '')}</p>` : emptyState(t('common.empty'))}
      <p class="mt-4"><a href="#/organisation/constitution">${t(K + 'home.viewConstitution')}</a></p></section>
    <section class="card"><h3>${t(K + 'home.committee')}</h3>
      <p>${esc(store.committee.current.map(m => nm(m, lang)).join(' · '))}</p>
      <p class="mt-4"><a href="#/organisation/committee">${t(K + 'home.viewCommittee')}</a></p></section>
    <section class="card"><h3>${t(K + 'home.achievements')}</h3>
      ${store.achievements.map(a => `<div class="list-row"><div class="grow"><strong>${esc(nm(a, lang))}</strong><br><span class="small muted">${fmtNum(a.year, lang)}</span></div></div>`).join('')}
      <p class="mt-4"><a href="#/organisation/achievements">${t(K + 'home.viewAchievements')}</a></p></section>
  </div>`;
}

function historyHtml(ctx, lang){
  const q = ctx.query.q || '';
  const rows = filterList(store.milestones, { q, fields: ['title_bn', 'title_en', 'body_bn'] });
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t(K + 'hist.title')}</h1><p class="sub">${t(K + 'hist.sub')}</p></div>
  <div class="row"><a class="btn btn-primary" href="#/organisation/history?new=1">${t(K + 'hist.new')}</a></div></div>
  <div class="mt-6">${renderFilters({ q, chips: [], activeChip: null })}</div>
  ${rows.length ? renderTable({ columns: [
    { key: 'year', label: t(K + 'hist.colYear'), render: r => fmtNum(r.year, lang) },
    { key: 'title_bn', label: t(K + 'hist.colTitle'), render: r => `<strong>${esc(nm(r, lang))}</strong><br><span class="small muted">${esc(r.body_bn || '')}</span>` },
    { key: 'status', label: t(K + 'hist.colStatus'), render: r => `${r.verified ? badge('published', t(K + 'hist.verified')) + ' ' : ''}${statusBadge(r.status)}` },
    { key: 'actions', label: '', render: r => {
      const pub = r.status === 'published'
        ? `<button type="button" class="btn btn-secondary btn-sm" data-ms-action="${r.id}" data-ms-kind="unpublish">${t(K + 'hist.unpublish')}</button>`
        : `<button type="button" class="btn btn-secondary btn-sm" data-ms-action="${r.id}" data-ms-kind="publish" ${r.verified ? '' : 'disabled aria-disabled="true" title="' + esc(t(K + 'hist.cannotPublish')) + '"'}>${t(K + 'hist.publish')}</button>`;
      const arch = r.status === 'archived'
        ? `<button type="button" class="btn btn-secondary btn-sm" data-ms-action="${r.id}" data-ms-kind="unarchive">${t(K + 'hist.unarchive')}</button>`
        : `<button type="button" class="btn btn-secondary btn-sm" data-ms-action="${r.id}" data-ms-kind="archive">${t(K + 'hist.archive')}</button>`;
      return `<span class="row">${pub} ${arch} <a class="btn btn-secondary btn-sm" href="#/organisation/history?edit=${r.id}">${t(K + 'hist.edit')}</a></span>`;
    } }
  ], rows, page: 1, perPage: 20, onRowClick: null, stacked: true }) : emptyState(t('common.empty'), t(K + 'hist.new'), '#/organisation/history?new=1')}
  <p class="small muted mt-4">${t(K + 'home.verifiedOnly')}</p>`;
}

function constitutionHtml(ctx, lang){
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t(K + 'const.title')}</h1><p class="sub">${t(K + 'const.sub')}</p></div>
  <div class="row"><a class="btn btn-primary" href="#/organisation/constitution?new=1">${t(K + 'const.new')}</a></div></div>
  ${renderTable({ columns: [
    { key: 'version', label: t(K + 'const.colVersion'), render: r => `<strong>${esc(r.version)}</strong>` },
    { key: 'effective_date', label: t(K + 'const.colDate'), render: r => esc(r.effective_date || '') },
    { key: 'status', label: t(K + 'const.colStatus'), render: r => r.status === 'current' ? badge('published', t(K + 'const.current')) : badge('draft', t(K + 'const.superseded')) },
    { key: 'actions', label: '', render: r => `<span class="row"><button type="button" class="btn btn-secondary btn-sm" data-cv-preview="${r.id}">${t(K + 'const.preview')}</button>${r.status === 'current' ? '' : ` <button type="button" class="btn btn-secondary btn-sm" data-cv-current="${r.id}">${t(K + 'const.setCurrent')}</button>`}</span>` }
  ], rows: store.constitution_versions, page: 1, perPage: 20, onRowClick: null, stacked: true })}`;
}

function committeeHtml(ctx, lang){
  const tab = ctx.query.tab || 'executive';
  const tabs = [['executive', 'comm.tabExecutive'], ['advisory', 'comm.tabAdvisory'], ['former', 'comm.tabFormer']];
  const rows = tab === 'advisory' ? store.advisors : tab === 'former' ? [...store.committee.former, ...store.past_leaders] : store.committee.current;
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t(K + 'comm.title')}</h1><p class="sub">${t(K + 'comm.sub')}</p></div>
  <div class="row"><a class="btn btn-primary" href="#/organisation/committee?tab=${tab}&new=1">${t(K + 'comm.new')}</a></div></div>
  <div class="filters" role="tablist" aria-label="${t(K + 'comm.title')}">
    ${tabs.map(([v, key]) => `<a class="chip" role="tab" aria-selected="${tab === v}" href="#/organisation/committee?tab=${v}" ${tab === v ? 'aria-current="page"' : ''}>${t(K + key)}</a>`).join('')}
  </div>
  ${rows.length ? renderTable({ columns: [
    { key: 'name_bn', label: t(K + 'comm.colName'), render: r => `<strong>${esc(nm(r, lang))}</strong>` },
    { key: 'role_bn', label: t(K + 'comm.colRole'), render: r => esc(r.role_bn || '') },
    { key: 'term', label: t(K + 'comm.colTerm'), render: r => esc(r.term || t(K + 'comm.noTerm')) },
    { key: 'actions', label: '', render: r => `<button type="button" class="btn btn-secondary btn-sm" data-cm-remove="${r.id}" data-cm-tab="${tab}">${t(K + 'comm.remove')}</button>` }
  ], rows, page: 1, perPage: 20, onRowClick: null, stacked: true }) : emptyState(t('common.empty'), t(K + 'comm.new'), '#/organisation/committee?tab=' + tab + '&new=1')}`;
}

function achievementsHtml(ctx, lang){
  const q = ctx.query.q || '';
  const rows = filterList(store.achievements, { q, fields: ['title_bn', 'title_en', 'body_bn'] });
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t(K + 'ach.title')}</h1><p class="sub">${t(K + 'ach.sub')}</p></div>
  <div class="row"><a class="btn btn-primary" href="#/organisation/achievements?new=1">${t(K + 'ach.new')}</a></div></div>
  <div class="mt-6">${renderFilters({ q, chips: [], activeChip: null })}</div>
  ${rows.length ? renderTable({ columns: [
    { key: 'year', label: t(K + 'ach.colYear'), render: r => fmtNum(r.year, lang) },
    { key: 'title_bn', label: t(K + 'ach.colTitle'), render: r => `<strong>${esc(nm(r, lang))}</strong><br><span class="small muted">${esc(r.body_bn || '')}</span>` },
    { key: 'status', label: t(K + 'ach.colStatus'), render: r => r.archived ? badge('draft', t(K + 'hist.archived')) : badge('published', t(K + 'hist.published')) },
    { key: 'actions', label: '', render: r => `<span class="row"><button type="button" class="btn btn-secondary btn-sm" data-ac-action="${r.id}" data-ac-kind="${r.archived ? 'unarchive' : 'archive'}">${t(K + (r.archived ? 'ach.unarchive' : 'ach.archive'))}</button> <a class="btn btn-secondary btn-sm" href="#/organisation/achievements?edit=${r.id}">${t(K + 'hist.edit')}</a></span>` }
  ], rows, page: 1, perPage: 20, onRowClick: null, stacked: true }) : emptyState(t('common.empty'), t(K + 'ach.new'), '#/organisation/achievements?new=1')}`;
}

function milestoneFormHtml(ctx){
  const id = ctx.query.edit;
  const ms = id ? store.milestones.find(m => m.id === id) : null;
  const v = ms || { year: '', title_bn: '', title_en: '', body_bn: '' };
  return orgForm(ctx, '#/organisation/history', [
    field({ id: 'o-year', label: t(K + 'form.year'), type: 'number', value: String(v.year || ''), required: true }),
    field({ id: 'o-title-bn', label: t(K + 'form.title'), value: v.title_bn, required: true }),
    field({ id: 'o-title-en', label: t(K + 'form.titleEn'), value: v.title_en || '' }),
    `<div class="field"><label for="o-body">${t(K + 'form.body')}</label><textarea id="o-body" name="o-body" class="input" rows="3">${esc(v.body_bn || '')}</textarea></div>`,
    `<p class="small muted">${t(K + 'form.draftNote')}</p>`
  ], 'milestone');
}

function constitutionFormHtml(ctx){
  return orgForm(ctx, '#/organisation/constitution', [
    field({ id: 'o-version', label: t(K + 'form.version'), value: '', required: true }),
    field({ id: 'o-date', label: t(K + 'form.date'), type: 'date', value: '' }),
    `<div class="field"><label for="o-body">${t(K + 'form.summary')}</label><textarea id="o-body" name="o-body" class="input" rows="3"></textarea></div>`
  ], 'constitution');
}

function committeeFormHtml(ctx){
  const tab = ctx.query.tab || 'executive';
  return orgForm(ctx, '#/organisation/committee?tab=' + tab, [
    field({ id: 'o-name-bn', label: t(K + 'form.nameBn'), value: '', required: true }),
    field({ id: 'o-name-en', label: t(K + 'form.nameEn'), value: '' }),
    field({ id: 'o-role', label: t(K + 'form.role'), value: '' }),
    field({ id: 'o-term', label: t(K + 'form.term'), value: '' })
  ], 'committee');
}

function achievementFormHtml(ctx){
  const id = ctx.query.edit;
  const ac = id ? store.achievements.find(a => a.id === id) : null;
  const v = ac || { year: '', title_bn: '', title_en: '', body_bn: '' };
  return orgForm(ctx, '#/organisation/achievements', [
    field({ id: 'o-year', label: t(K + 'form.year'), type: 'number', value: String(v.year || ''), required: true }),
    field({ id: 'o-title-bn', label: t(K + 'form.title'), value: v.title_bn, required: true }),
    field({ id: 'o-title-en', label: t(K + 'form.titleEn'), value: v.title_en || '' }),
    `<div class="field"><label for="o-body">${t(K + 'form.body')}</label><textarea id="o-body" name="o-body" class="input" rows="3">${esc(v.body_bn || '')}</textarea></div>`
  ], 'achievement');
}

function orgForm(ctx, back, fieldsHtml, kind){
  return `<span class="demo-badge">${t('app.demo')}</span>
  <form id="org-form" class="card" data-kind="${kind}" novalidate>
    <div id="org-errors"></div>
    ${fieldsHtml.join('')}
    <div class="row mt-4"><button type="submit" class="btn btn-primary">${t(K + 'form.save')}</button>
    <a class="btn btn-secondary" href="${back}">${t(K + 'form.cancel')}</a></div>
  </form>`;
}

function saveOrg(ctx, form){
  const kind = form.dataset.kind;
  const fd = new FormData(form);
  const errs = [];
  const box = document.getElementById('org-errors');
  const fail = () => { box.innerHTML = errorSummary(errs); const s = box.querySelector('.error-summary'); if(s) s.focus(); };
  if(kind === 'milestone'){
    const title = String(fd.get('o-title-bn') || '').trim();
    if(!validateRequired(title)) errs.push({ id: 'o-title-bn', message: t(K + 'form.required') });
    if(!validateRequired(String(fd.get('o-year') || ''))) errs.push({ id: 'o-year', message: t(K + 'form.required') });
    if(errs.length) return fail();
    const id = ctx.query.edit;
    const existing = id ? store.milestones.find(m => m.id === id) : null;
    const rec = { id: existing ? existing.id : 'ms-' + Date.now(), year: parseInt(String(fd.get('o-year')), 10) || 0,
      title_bn: title, title_en: String(fd.get('o-title-en') || '').trim(), body_bn: String(fd.get('o-body') || '').trim(),
      verified: existing ? !!existing.verified : false, status: existing ? existing.status : 'draft' };
    if(existing) Object.assign(existing, rec); else store.milestones.push(rec);
    writeAudit(ctx.user.id, ctx.role, existing ? 'milestone.update' : 'milestone.create', 'milestone', rec.id, null, 'draft');
    ctx.toast(t(K + 'toast.saved'));
    go('#/organisation/history');
  } else if(kind === 'constitution'){
    const version = String(fd.get('o-version') || '').trim();
    if(!validateRequired(version)) errs.push({ id: 'o-version', message: t(K + 'form.required') });
    if(errs.length) return fail();
    store.constitution_versions.push({ id: 'cv-' + Date.now(), version, effective_date: String(fd.get('o-date') || ''), articles_bn: String(fd.get('o-body') || '').trim(), status: 'superseded' });
    writeAudit(ctx.user.id, ctx.role, 'constitution.create', 'constitution', version, null, 'superseded');
    ctx.toast(t(K + 'toast.saved'));
    go('#/organisation/constitution');
  } else if(kind === 'committee'){
    const name = String(fd.get('o-name-bn') || '').trim();
    if(!validateRequired(name)) errs.push({ id: 'o-name-bn', message: t(K + 'form.required') });
    if(errs.length) return fail();
    const tab = ctx.query.tab || 'executive';
    const rec = { id: 'cm-' + Date.now(), name_bn: name, name_en: String(fd.get('o-name-en') || '').trim(), role_bn: String(fd.get('o-role') || '').trim(), term: String(fd.get('o-term') || '').trim() };
    if(tab === 'advisory') store.advisors.push(rec);
    else if(tab === 'former') store.past_leaders.push(rec);
    else store.committee.current.push(rec);
    writeAudit(ctx.user.id, ctx.role, 'committee.add', 'committee', rec.id, null, tab);
    ctx.toast(t(K + 'toast.saved'));
    go('#/organisation/committee?tab=' + tab);
  } else {
    const title = String(fd.get('o-title-bn') || '').trim();
    if(!validateRequired(title)) errs.push({ id: 'o-title-bn', message: t(K + 'form.required') });
    if(!validateRequired(String(fd.get('o-year') || ''))) errs.push({ id: 'o-year', message: t(K + 'form.required') });
    if(errs.length) return fail();
    const id = ctx.query.edit;
    const existing = id ? store.achievements.find(a => a.id === id) : null;
    const rec = { id: existing ? existing.id : 'ac-' + Date.now(), year: parseInt(String(fd.get('o-year')), 10) || 0,
      title_bn: title, title_en: String(fd.get('o-title-en') || '').trim(), body_bn: String(fd.get('o-body') || '').trim(), archived: existing ? !!existing.archived : false };
    if(existing) Object.assign(existing, rec); else store.achievements.push(rec);
    writeAudit(ctx.user.id, ctx.role, existing ? 'achievement.update' : 'achievement.create', 'achievement', rec.id, null, 'active');
    ctx.toast(t(K + 'toast.saved'));
    go('#/organisation/achievements');
  }
}
