// gallery.js — Media library (grid/list + albums), upload (preview only, simulated),
// video gallery PLACEHOLDER ONLY (Phase 2 — no upload control, no playback),
// #/media media-library view. Photos are labelled placeholders, never base64 blobs.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { setHash } from '../js/lib/router.js';
import { store, filterList, writeAudit, storeAdd, storeRemove } from '../js/lib/store.js';
import { fmtNum, esc } from '../js/lib/format.js';
import { plainBadge } from '../js/components/badges.js';
import { renderTable, bindTableRows, bindTableSort } from '../js/components/table.js';
import { renderFilters, bindFilters } from '../js/components/filters.js';
import { field } from '../js/components/forms.js';
import { emptyState } from '../js/components/states.js';
const STRINGS = {
bn: {
'list.title':'গ্যালারি', 'list.mediaTitle':'মিডিয়া লাইব্রেরি', 'list.upload':'আপলোড করুন', 'list.video':'ভিডিও গ্যালারি', 'list.grid':'গ্রিড', 'list.list':'তালিকা',
'list.colPhoto':'ছবি', 'list.colCaption':'ক্যাপশন', 'list.colAlbum':'অ্যালবাম', 'list.colConsent':'সম্মতি', 'list.colSize':'আকার', 'list.albumAll':'সব অ্যালবাম',
'list.placeholder':'স্থানধারক ছবি', 'list.consentYes':'সম্মতি আছে', 'list.consentNo':'সম্মতি নেই', 'list.kb':'কিলোবাইট',
'upload.title':'ছবি আপলোড', 'upload.note':'আপলোড অনুকরণ করা হয়েছে — ফাইল কোথাও সংরক্ষিত হয় না, শুধু প্রাকদর্শন দেখায়।', 'upload.file':'ছবি নির্বাচন করুন', 'upload.captionBn':'ক্যাপশন (বাংলা)', 'upload.captionEn':'ক্যাপশন (ইংরেজি)', 'upload.album':'অ্যালবাম', 'upload.consent':'ছবিতে থাকা ব্যক্তিদের সম্মতি ফাইলে আছে', 'upload.consentRequired':'মানুষের ছবির ক্ষেত্রে সম্মতির টিকচিহ্ন আবশ্যক।', 'upload.save':'সংরক্ষণ করুন', 'upload.preview':'প্রাকদর্শন', 'msg.saved':'সংরক্ষণ করা হয়েছে (ডেমো)।',
'video.title':'ভিডিও গ্যালারি', 'video.phase':'দ্বিতীয় ধাপ (Phase 2)', 'video.body':'ভিডিও গ্যালারি শীঘ্রই আসছে। এই ধাপে ভিডিও আপলোড বা ভিডিও চালানোর কোনো ব্যবস্থা নেই — কোনো ভিডিও সামগ্রী তৈরি করা হয়নি।', 'video.count':'ভিডিও: ০',
'media.note':'সব ছবি স্থানধারক — আসল ফাইল নয়। মানুষের ছবি প্রকাশের আগে সম্মতি যাচাই করুন।',
'act.edit':'সম্পাদনা', 'act.view':'দেখুন', 'act.delete':'মুছুন', 'msg.deleted':'মুছে ফেলা হয়েছে (নরম মুছে ফেলা — ফাইল সংরক্ষণ নীতি অনুযায়ী পরে মুছে যাবে)।',
'confirm.deleteBody':'এই ছবিটি লাইব্রেরি থেকে সরানো হবে। সংরক্ষণ নীতি অনুযায়ী ফাইলটি পরে মুছে যাবে।'
},
en: {
'list.title':'Gallery', 'list.mediaTitle':'Media library', 'list.upload':'Upload', 'list.video':'Video gallery', 'list.grid':'Grid', 'list.list':'List',
'list.colPhoto':'Photo', 'list.colCaption':'Caption', 'list.colAlbum':'Album', 'list.colConsent':'Consent', 'list.colSize':'Size', 'list.albumAll':'All albums',
'list.placeholder':'Placeholder photo', 'list.consentYes':'Consent on file', 'list.consentNo':'No consent', 'list.kb':'KB',
'upload.title':'Upload photo', 'upload.note':'Upload is simulated — the file is stored nowhere; only a preview is shown.', 'upload.file':'Choose a photo', 'upload.captionBn':'Caption (Bengali)', 'upload.captionEn':'Caption (English)', 'upload.album':'Album', 'upload.consent':'Consent of the people in the photo is on file', 'upload.consentRequired':'The consent checkbox is required for photos of people.', 'upload.save':'Save', 'upload.preview':'Preview', 'msg.saved':'Saved (demo).',
'video.title':'Video gallery', 'video.phase':'Phase 2', 'video.body':'The video gallery is coming soon. In this phase there is no video upload and no video playback — no video content has been created.', 'video.count':'Videos: 0',
'media.note':'All photos are placeholders — not real files. Check consent before publishing photos of people.',
'act.edit':'Edit', 'act.view':'View', 'act.delete':'Delete', 'msg.deleted':'Deleted (soft delete — the file is purged later under the retention rule).',
'confirm.deleteBody':'This photo will be removed from the library. The file is purged later under the retention rule.'
}};
registerStrings('gallery', STRINGS);
function albumName(a, lang){ return lang === 'bn' ? (a.name_bn || a.name_en) : (a.name_en || a.name_bn); }
function captionOf(m, lang){ return lang === 'bn' ? (m.caption_bn || m.caption_en || m.placeholder || '') : (m.caption_en || m.caption_bn || m.placeholder || ''); }
export const Gallery = {
  route: '#/gallery',
  title: { bn: 'গ্যালারি', en: 'Gallery' },
  breadcrumb: ['nav.dashboard', 'nav.gallery'],
  roles: ['super-admin'],
  permissions: ['gallery.manage'],
  render(ctx){
    const lang = getLang();
    const { path } = ctx;
    ctx.shell.setTitle(t('gallery.list.title'));
    if(path === '/gallery/upload') return uploadHtml(ctx, lang);
    if(path === '/gallery/video') return videoHtml(ctx, lang);
    return libraryHtml(ctx, lang, path === '/media');
  },
  onMount(ctx){
    const root = document.getElementById('view');
    bindTableRows(root);
    bindTableSort(root, (key, dir) => { const q = { ...ctx.query, sort: key, dir, page: '1' }; setHash(ctx.path, q); });
    bindFilters(root, {
      onSearch: v => { const q = { ...ctx.query, q: v, page: '1' }; if(!v) delete q.q; setHash(ctx.path, q); },
      onChip: v => { const q = { ...ctx.query, album: v, page: '1' }; if(v === 'all') delete q.album; setHash(ctx.path, q); },
      onClear: () => setHash(ctx.path, {})
    });
    const viewBtns = root.querySelectorAll('[data-view-mode]');
    viewBtns.forEach(b => b.addEventListener('click', () => { const q = { ...ctx.query, view: b.dataset.viewMode }; setHash(ctx.path, q); }));
    root.querySelectorAll('[data-act="delete"]').forEach(b => b.addEventListener('click', () => {
      const m = store.media.find(x => x.id === b.dataset.id);
      if(!m) return;
      ctx.modal({ title: t('gallery.act.delete'), body: `<p>${t('gallery.confirm.deleteBody')}</p><p class="small muted">${esc(m.caption_bn)}</p>`, confirmLabel: t('gallery.act.delete'), danger: true, onConfirm: () => { storeRemove('media', x => x.id === m.id); writeAudit(ctx.user.id, ctx.role, 'media.delete', 'media', m.id, 'active', 'deleted'); ctx.toast(t('gallery.msg.deleted')); ctx.rerender && ctx.rerender(); } });
    }));
    const file = root.querySelector('#g-file');
    if(file) file.addEventListener('change', () => {
      const prev = root.querySelector('#g-preview');
      if(prev && file.files && file.files[0]){ prev.src = URL.createObjectURL(file.files[0]); prev.hidden = false; }
    });
    const form = root.querySelector('#gallery-form');
    if(form) form.addEventListener('submit', e => {
      e.preventDefault();
      const consent = form.querySelector('#g-consent').checked;
      const err = document.getElementById('form-err');
      if(!consent){ err.hidden = false; form.querySelector('#g-consent').focus(); return; }
      const capBn = form.querySelector('#g-cap-bn').value.trim();
      const album = form.querySelector('#g-album').value;
      storeAdd('media', { id:'med-' + Date.now(), caption_bn: capBn || t('gallery.list.placeholder'), caption_en: form.querySelector('#g-cap-en').value.trim(), album_id: album, consent_on_file: true, uploader: ctx.user.id, size_kb: 0, placeholder:'photo-new' });
      writeAudit(ctx.user.id, ctx.role, 'media.create', 'media', album, null, 'uploaded-preview-only');
      ctx.toast(t('gallery.msg.saved'));
      location.hash = '#/gallery';
    });
  },
  onUnmount(){}
};
function libraryHtml(ctx, lang, isMedia){
  const q = ctx.query.q || '';
  const albumF = ctx.query.album || 'all';
  const mode = ctx.query.view || 'grid';
  let rows = filterList(store.media, { q, fields: ['caption_bn', 'caption_en', 'placeholder'] });
  if(albumF !== 'all') rows = rows.filter(m => m.album_id === albumF);
  const chips = [{ value:'all', label:t('gallery.list.albumAll') }, ...store.albums.filter(a => !a.placeholder).map(a => ({ value: a.id, label: albumName(a, lang) }))];
  // D-12 fix: the album "View" label is a real i18n key now (gallery.act.view),
  // not chosen by sniffing the English translation of the Edit string.
  const albumCards = store.albums.filter(a => !a.placeholder).map(a => `<section class="card"><h3>${esc(albumName(a, lang))}</h3><p class="small muted">${t('gallery.list.colPhoto')}: ${fmtNum(a.count, lang)}</p><p class="mt-4"><a class="btn btn-secondary btn-sm" href="#/gallery?album=${a.id}">${t('gallery.act.view')}</a></p></section>`).join('');
  const grid = `<div class="two-col">${rows.map(m => {
    const alb = store.albums.find(a => a.id === m.album_id);
    return `<section class="card"><div class="empty"><span>${esc(m.placeholder || 'photo')} · ${t('gallery.list.placeholder')}</span></div>
    <h3 class="mt-4">${esc(captionOf(m, lang))}</h3><p class="small muted">${alb ? esc(albumName(alb, lang)) : ''} · ${m.consent_on_file ? t('gallery.list.consentYes') : t('gallery.list.consentNo')}</p>
    <p class="mt-4"><button type="button" class="btn btn-ghost btn-sm" data-act="delete" data-id="${m.id}">${t('gallery.act.delete')}</button></p></section>`;
  }).join('')}</div>`;
  const sort = ctx.query.sort ? { key: ctx.query.sort, dir: ctx.query.dir || 'asc' } : null;
  const list = renderTable({ columns: [
    { key:'placeholder', label:t('gallery.list.colPhoto'), render: r => `<span class="num">${esc(r.placeholder || '')}</span><br><span class="small muted">${t('gallery.list.placeholder')}</span>` },
    { key:'caption_bn', label:t('gallery.list.colCaption'), sortable:true, render: r => `<strong>${esc(captionOf(r, lang))}</strong>` },
    { key:'album_id', label:t('gallery.list.colAlbum'), render: r => { const a = store.albums.find(x => x.id === r.album_id); return a ? esc(albumName(a, lang)) : ''; } },
    { key:'consent_on_file', label:t('gallery.list.colConsent'), render: r => r.consent_on_file ? plainBadge(t('gallery.list.consentYes')) : plainBadge(t('gallery.list.consentNo')) },
    { key:'size_kb', label:t('gallery.list.colSize'), sortable:true, render: r => `${fmtNum(r.size_kb ?? 0, lang)} ${t('gallery.list.kb')}` }
  ], rows, page: parseInt(ctx.query.page || '1', 10), perPage: 20, stacked: true, sort });
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${isMedia ? t('gallery.list.mediaTitle') : t('gallery.list.title')}</h1><p class="sub">${t('gallery.media.note')}</p></div>
  <div><a class="btn btn-secondary" href="#/gallery/video">${t('gallery.list.video')}</a> <a class="btn btn-primary" href="#/gallery/upload">${t('gallery.list.upload')}</a></div></div>
  <div class="two-col">${albumCards}</div>
  <div class="filters mt-6" role="group" aria-label="${t('gallery.list.grid')} / ${t('gallery.list.list')}">
    <button type="button" class="chip" data-view-mode="grid" aria-pressed="${mode === 'grid'}">${t('gallery.list.grid')}</button>
    <button type="button" class="chip" data-view-mode="list" aria-pressed="${mode === 'list'}">${t('gallery.list.list')}</button>
  </div>
  ${renderFilters({ q, chips, activeChip: albumF })}
  ${rows.length ? (mode === 'list' ? list : grid) : emptyState(t('common.empty'), t('gallery.list.upload'), '#/gallery/upload')}`;
}
function uploadHtml(ctx, lang){
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t('gallery.upload.title')}</h1><p class="sub">${t('gallery.upload.note')}</p></div>
  <div><a class="btn btn-ghost" href="#/gallery">${t('common.back')}</a></div></div>
  <form id="gallery-form" class="card" novalidate>
  <div class="field"><label for="g-file">${t('gallery.upload.file')}</label><input id="g-file" type="file" class="input" accept="image/*"><div class="hint">${t('gallery.upload.note')}</div><img id="g-preview" class="mt-4" alt="${t('gallery.upload.preview')}" hidden></div>
  ${field({ id:'g-cap-bn', label:t('gallery.upload.captionBn'), value: '' })}
  ${field({ id:'g-cap-en', label:t('gallery.upload.captionEn'), value: '' })}
  <div class="field"><label for="g-album">${t('gallery.upload.album')}</label><select id="g-album" class="input">${store.albums.filter(a => !a.placeholder).map(a => `<option value="${a.id}">${esc(albumName(a, lang))}</option>`).join('')}</select></div>
  <div class="field"><label><input id="g-consent" type="checkbox"> ${t('gallery.upload.consent')}</label></div>
  <div class="error" id="form-err" hidden>${t('gallery.upload.consentRequired')}</div>
  <div class="row mt-4"><button type="submit" class="btn btn-primary">${t('gallery.upload.save')}</button></div>
  </form>`;
}
function videoHtml(ctx, lang){
  const album = store.albums.find(a => a.placeholder);
  return `<span class="demo-badge">${t('app.demo')}</span>
  <div class="view-head"><div><h1>${t('gallery.video.title')}</h1><p class="sub">${t('gallery.video.phase')}</p></div>
  <div><a class="btn btn-ghost" href="#/gallery">${t('common.back')}</a></div></div>
  <section class="card"><p>${plainBadge(t('gallery.video.phase'))}</p>
  <p class="mt-4">${t('gallery.video.body')}</p>
  <p class="small muted mt-4">${t('gallery.video.count')}${album ? ` · ${esc(albumName(album, lang))}` : ''}</p></section>`;
}
