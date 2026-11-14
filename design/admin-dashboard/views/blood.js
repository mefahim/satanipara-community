// blood.js — Blood donor registry + blood requests + per-request consent flow.
// Donor phone is NEVER public: masked by default, revealed only after a recorded
// consent grant for that specific request, and every reveal is audit-logged.
// Availability is COMPUTED from the 90-day rule, never a static flag.
// Consent is granted by the DONOR (never by an admin click here): this view only
// records asks / revocations and reveals on already-granted consents (demo seed).
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store, filterList, writeAudit } from '../js/lib/store.js';
import { fmtDate, fmtDateTime, fmtNum, fmtPhoneMasked, esc } from '../js/lib/format.js';
import { badge, plainBadge } from '../js/components/badges.js';
import { renderTable, bindTableRows } from '../js/components/table.js';
import { renderFilters, bindFilters } from '../js/components/filters.js';
import { emptyState } from '../js/components/states.js';
import { donorAvailable } from '../js/data/demo-blood.js';
const STRINGS = {
bn: {
'title':'রক্তদান', 'crumbDonors':'রক্তদাতা', 'crumbRequests':'রক্তের অনুরোধ', 'crumbDonor':'রক্তদাতার বিবরণ', 'crumbRequest':'অনুরোধের বিবরণ',
'donors.title':'রক্তদাতা তালিকা', 'donors.note':'সম্মতি প্রত্যাহারকারী রক্তদাতা তালিকায় দেখানো হয় না। ফোন নম্বর তালিকায় কখনো দেখানো হয় না।',
'donors.hidden':'সম্মতি প্রত্যাহারের কারণে লুকানো রক্তদাতা', 'donors.count':'জন রক্তদাতা',
'filter.group':'রক্তের গ্রুপ', 'filter.all':'সব', 'filter.avail':'উপলব্ধতা', 'filter.available':'দিতে পারবেন', 'filter.waiting':'এখনো নয়',
'col.name':'নাম', 'col.group':'গ্রুপ', 'col.area':'এলাকা', 'col.last':'শেষ দান', 'col.avail':'উপলব্ধতা', 'col.units':'ইউনিট',
'col.hospital':'হাসপাতাল', 'col.status':'অবস্থা', 'col.date':'তারিখ', 'col.requester':'অনুরোধকারীর যোগাযোগ',
'avail.yes':'দিতে পারবেন', 'avail.no':'এখনো নয়', 'avail.from':'দিতে পারবেন', 'avail.never':'শেষ দানের তারিখ নেই',
'consent.listed':'তালিকায় থাকতে সম্মত', 'consent.withdrawn':'সম্মতি প্রত্যাহার করেছেন',
'consent.withdrawnTitle':'এই রক্তদাতা লুকানো আছে', 'consent.withdrawnBody':'রক্তদাতা তালিকায় থাকার সম্মতি প্রত্যাহার করেছেন। সম্মতি প্রত্যাহারের সঙ্গে সঙ্গে রেকর্ডটি লুকানো হয়।',
'phone.maskedNote':'ফোন নম্বর মাস্ক করা আছে। পূর্ণ নম্বর শুধু নির্দিষ্ট রক্তের অনুরোধে রক্তদাতার সম্মতি পেলে দেখানো যায়।',
'phone.reveal':'ফোন নম্বর দেখুন', 'phone.revealed':'ফোন নম্বর দেখানো হয়েছে — এই প্রকাশ অডিট লগে লেখা হয়েছে।',
'phone.hidden':'মাস্ক করা', 'phone.neverPublic':'রক্তদাতার ফোন নম্বর কখনো প্রকাশ্যে দেখানো হয় না।',
'detail.lastDonation':'শেষ রক্তদান', 'detail.nextEligible':'পরবর্তী দানের যোগ্য তারিখ', 'detail.consent':'সম্মতির অবস্থা', 'detail.area':'এলাকা',
'requests.title':'রক্তের অনুরোধ', 'requests.note':'প্রতিটি অনুরোধে শুধু সংশ্লিষ্ট গ্রুপের সম্মতিপ্রাপ্ত রক্তদাতারা দেখানো হয়।',
'status.submitted':'জমা হয়েছে', 'status.notified':'জানানো হয়েছে', 'status.fulfilled':'পূরণ হয়েছে', 'status.cancelled':'বাতিল',
'consent.granted':'সম্মতি দিয়েছেন', 'consent.pending':'সম্মতির অপেক্ষায়', 'consent.revoked':'সম্মতি প্রত্যাহার করেছেন', 'consent.none':'এখনো সম্মতি চাওয়া হয়নি',
'consent.ask':'সম্মতি চান', 'consent.askSent':'সম্মতির অনুরোধ পাঠানো হয়েছে — নম্বর দেখানো হয়নি।', 'consent.waiting':'রক্তদাতার উত্তরের অপেক্ষায় আছি।',
'consent.revoke':'প্রত্যাহার রেকর্ড করুন', 'consent.revokedMsg':'সম্মতি প্রত্যাহার রেকর্ড করা হয়েছে। ফোন নম্বর আবার লুকানো হয়েছে।',
'consent.grantNote':'সম্মতি রক্তদাতা নিজে দেন — এই পাতা থেকে সম্মতি দেওয়া যায় না। নিচে শুধু আগে থেকে রেকর্ড করা সম্মতির ফল দেখানো হয়েছে।',
'match.title':'মিলে যাওয়া রক্তদাতা', 'match.none':'এই গ্রুপের কোনো সম্মতিপ্রাপ্ত রক্তদাতা নেই।',
'match.emptyGroup':'এই গ্রুপে কোনো রক্তদাতা নেই', 'match.emptyGroupBody':'এই গ্রুপের রক্তদাতা তালিকা খালি — এটি একটি পৌঁছানো যায় এমন খালি অবস্থা।',
'audit.title':'যোগাযোগ প্রকাশের অডিট', 'audit.none':'এই অনুরোধের জন্য এখনো কোনো অডিট রেকর্ড নেই।',
'act.fulfil':'পূরণ হয়েছে বলে চিহ্নিত করুন', 'act.cancel':'অনুরোধ বাতিল করুন', 'act.fulfilledMsg':'অনুরোধ পূরণ হয়েছে বলে চিহ্নিত করা হয়েছে; সম্মতিপ্রাপ্ত রক্তদাতার শেষ দানের তারিখ হালনাগাদ হয়েছে।',
'act.cancelledMsg':'অনুরোধ বাতিল করা হয়েছে।', 'act.needGrant':'পূরণ চিহ্নিত করতে অন্তত একজন রক্তদাতার সম্মতি প্রয়োজন।',
'confirm.revealTitle':'ফোন নম্বর দেখাবেন?', 'confirm.revealBody':'এই রক্তদাতা এই নির্দিষ্ট অনুরোধের জন্য সম্মতি দিয়েছেন। নম্বর দেখালে তা অডিট লগে লেখা হবে।',
'confirm.revokeTitle':'সম্মতি প্রত্যাহার রেকর্ড করবেন?', 'confirm.revokeBody':'প্রত্যাহারের পর এই অনুরোধের জন্য ফোন নম্বর আর দেখানো যাবে না।',
'confirm.fulfilTitle':'অনুরোধ পূরণ হয়েছে?', 'confirm.fulfilBody':'পূরণ চিহ্নিত করলে সম্মতিপ্রাপ্ত রক্তদাতার শেষ দানের তারিখ আজকের তারিখে হালনাগাদ হবে।',
'confirm.cancelTitle':'অনুরোধ বাতিল করবেন?', 'confirm.cancelBody':'বাতিল করা অনুরোধ আর পূরণ চিহ্নিত করা যাবে না।',
'confirm.askTitle':'সম্মতি চাইবেন?', 'confirm.askBody':'রক্তদাতাকে সম্মতির অনুরোধ পাঠানো হবে। এতে ফোন নম্বর দেখানো হবে না।',
'back.donors':'রক্তদাতা তালিকায় ফিরুন', 'back.requests':'অনুরোধের তালিকায় ফিরুন'
},
en: {
'title':'Blood donation', 'crumbDonors':'Donors', 'crumbRequests':'Blood requests', 'crumbDonor':'Donor detail', 'crumbRequest':'Request detail',
'donors.title':'Donor list', 'donors.note':'Donors who withdrew consent are not shown in the list. Phone numbers are never shown in lists.',
'donors.hidden':'donor hidden because consent was withdrawn', 'donors.count':'donors',
'filter.group':'Blood group', 'filter.all':'All', 'filter.avail':'Availability', 'filter.available':'Available', 'filter.waiting':'Not yet',
'col.name':'Name', 'col.group':'Group', 'col.area':'Area', 'col.last':'Last donation', 'col.avail':'Availability', 'col.units':'Units',
'col.hospital':'Hospital', 'col.status':'Status', 'col.date':'Date', 'col.requester':'Requester contact',
'avail.yes':'Available', 'avail.no':'Not yet', 'avail.from':'Available from', 'avail.never':'No last donation date',
'consent.listed':'Consented to be listed', 'consent.withdrawn':'Withdrew consent',
'consent.withdrawnTitle':'This donor is hidden', 'consent.withdrawnBody':'The donor withdrew consent to be listed. The record is hidden as soon as consent is withdrawn.',
'phone.maskedNote':'The phone number is masked. The full number is shown only with the donor\u2019s consent for a specific blood request.',
'phone.reveal':'Reveal phone number', 'phone.revealed':'Phone number revealed — this disclosure is written to the audit log.',
'phone.hidden':'Masked', 'phone.neverPublic':'A donor\u2019s phone number is never shown publicly.',
'detail.lastDonation':'Last donation', 'detail.nextEligible':'Next eligible date', 'detail.consent':'Consent state', 'detail.area':'Area',
'requests.title':'Blood requests', 'requests.note':'Each request shows only consenting donors of the matching group.',
'status.submitted':'Submitted', 'status.notified':'Notified', 'status.fulfilled':'Fulfilled', 'status.cancelled':'Cancelled',
'consent.granted':'Consent granted', 'consent.pending':'Consent pending', 'consent.revoked':'Consent revoked', 'consent.none':'Consent not asked yet',
'consent.ask':'Ask for consent', 'consent.askSent':'Consent request sent — the number was not revealed.', 'consent.waiting':'Waiting for the donor\u2019s reply.',
'consent.revoke':'Record revocation', 'consent.revokedMsg':'Consent revocation recorded. The phone number is hidden again.',
'consent.grantNote':'Consent is given by the donor — it cannot be granted from this page. Below are only the outcomes of consents already recorded.',
'match.title':'Matching donors', 'match.none':'No consenting donor in this group.',
'match.emptyGroup':'No donor in this group', 'match.emptyGroupBody':'The donor list for this group is empty — this is a reachable empty state.',
'audit.title':'Contact-disclosure audit', 'audit.none':'No audit record for this request yet.',
'act.fulfil':'Mark as fulfilled', 'act.cancel':'Cancel request', 'act.fulfilledMsg':'Request marked fulfilled; the consenting donor\u2019s last donation date was updated.',
'act.cancelledMsg':'Request cancelled.', 'act.needGrant':'At least one donor\u2019s consent is needed to mark fulfilled.',
'confirm.revealTitle':'Reveal the phone number?', 'confirm.revealBody':'This donor consented for this specific request. Revealing it will be written to the audit log.',
'confirm.revokeTitle':'Record the consent revocation?', 'confirm.revokeBody':'After revocation the phone number can no longer be shown for this request.',
'confirm.fulfilTitle':'Mark this request fulfilled?', 'confirm.fulfilBody':'Marking fulfilled updates the consenting donor\u2019s last donation date to today.',
'confirm.cancelTitle':'Cancel this request?', 'confirm.cancelBody':'A cancelled request can no longer be marked fulfilled.',
'confirm.askTitle':'Ask for consent?', 'confirm.askBody':'A consent request will be sent to the donor. The phone number will not be revealed.',
'back.donors':'Back to donor list', 'back.requests':'Back to request list'
}};
registerStrings('blood', STRINGS);
const GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
const AS_OF = new Date('2026-11-14T00:00:00+06:00');
const revealed = new Set(); // consent ids whose phone was revealed this session (demo only)
const langOf = () => getLang();
function donorName(d, lang){ return lang === 'bn' ? d.name_bn : d.name_en; }
function nextEligible(d){
  if(!d.last_donation_date) return null;
  const dt = new Date(d.last_donation_date + 'T00:00:00+06:00');
  dt.setDate(dt.getDate() + 90);
  return dt.toISOString().slice(0, 10);
}
function availBadge(d){
  const ok = donorAvailable(d, AS_OF);
  return plainBadge(ok ? t('blood.avail.yes') : t('blood.avail.no'));
}
function statusBadge(s){ return badge(s === 'fulfilled' ? 'completed' : s === 'cancelled' ? 'cancelled' : s === 'notified' ? 'accepted' : 'pending', t('blood.status.' + s)); }
function consentFor(reqId, donorId){ return store.blood_consents.find(c => c.blood_request_id === reqId && c.donor_id === donorId); }
function setHash(base, params){
  const qs = Object.entries(params).filter(([, v]) => v !== '' && v != null).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
  location.hash = base + (qs ? '?' + qs : '');
}
export const Blood = {
  route: '#/blood',
  title: { bn: 'রক্তদান', en: 'Blood donation' },
  breadcrumb: ['nav.dashboard', 'nav.blood'],
  roles: ['super-admin'],
  permissions: ['blood.view'],
  render(ctx){
    const lang = langOf();
    if(ctx.params.id && ctx.path.startsWith('/blood/requests')) return requestDetailHtml(ctx, lang);
    if(ctx.path === '/blood/requests') return requestsHtml(ctx, lang);
    if(ctx.params.id) return donorDetailHtml(ctx, lang);
    return donorsHtml(ctx, lang);
  },
  onMount(ctx){ bindBlood(ctx); },
  onUnmount(){}
};
function head(title, note){
  return `<span class="demo-badge">${t('app.demo')}</span><div class="view-head"><div><h1>${esc(title)}</h1>${note ? `<p class="sub muted">${esc(note)}</p>` : ''}</div></div>`;
}
function donorsHtml(ctx, lang){
  const q = ctx.query.q || '', group = ctx.query.group || 'all', avail = ctx.query.avail || 'all', area = ctx.query.area || 'all';
  const all = store.blood_donors;
  const visible = all.filter(d => d.consent_to_list);
  const hidden = all.length - visible.length;
  const areas = [...new Set(visible.map(d => d.area))];
  let rows = filterList(visible, { q, fields: ['name_bn', 'name_en', 'area', 'blood_group'] });
  if(group !== 'all') rows = rows.filter(d => d.blood_group === group);
  if(area !== 'all') rows = rows.filter(d => d.area === area);
  if(avail === 'available') rows = rows.filter(d => donorAvailable(d, AS_OF));
  if(avail === 'waiting') rows = rows.filter(d => !donorAvailable(d, AS_OF));
  const chips = [{ value: 'all', label: t('blood.filter.all') }, ...GROUPS.map(g => ({ value: g, label: g }))];
  const groupEmpty = group !== 'all' && rows.length === 0 && visible.filter(d => d.blood_group === group).length === 0;
  return `${head(t('blood.donors.title'), t('blood.donors.note'))}
  <p class="small muted">${fmtNum(visible.length, lang)} ${t('blood.donors.count')} · ${fmtNum(hidden, lang)} ${t('blood.donors.hidden')}</p>
  <div class="filters" role="search">
    <input class="input search-box" type="search" data-filter-q value="${esc(q)}" placeholder="${t('common.search')}…" aria-label="${t('common.search')}">
    ${chips.map(c => `<button type="button" class="chip" data-chip="group:${c.value}" aria-pressed="${group === c.value}">${esc(c.label)}</button>`).join('')}
    <button type="button" class="chip" data-chip="avail:available" aria-pressed="${avail === 'available'}">${t('blood.filter.available')}</button>
    <button type="button" class="chip" data-chip="avail:waiting" aria-pressed="${avail === 'waiting'}">${t('blood.filter.waiting')}</button>
    ${areas.map(a => `<button type="button" class="chip" data-chip="area:${a}" aria-pressed="${area === a}">${esc(a)}</button>`).join('')}
    <button type="button" class="btn btn-ghost btn-sm" data-clear-filters>${t('common.clearFilters')}</button>
  </div>
  ${groupEmpty ? emptyState(t('blood.match.emptyGroup'), '', '') : ''}
  ${renderTable({ columns: [
    { key: 'name_bn', label: t('blood.col.name'), render: d => esc(donorName(d, lang)) },
    { key: 'blood_group', label: t('blood.col.group'), render: d => `<span class="num">${esc(d.blood_group)}</span>` },
    { key: 'area', label: t('blood.col.area'), render: d => esc(d.area) },
    { key: 'last_donation_date', label: t('blood.col.last'), render: d => d.last_donation_date ? fmtDate(d.last_donation_date, lang) : t('blood.avail.never') },
    { key: 'avail', label: t('blood.col.avail'), render: d => availBadge(d) }
  ], rows, page: parseInt(ctx.query.page || '1', 10), perPage: 20, onRowClick: d => '#/blood/donors/' + d.id, stacked: true })}`;
}
function donorDetailHtml(ctx, lang){
  const d = store.blood_donors.find(x => x.id === ctx.params.id);
  if(!d) return `<div class="card"><h1>${t('notfound.title')}</h1><p class="mt-4">${t('notfound.body')}</p><p class="mt-4"><a class="btn btn-primary" href="#/blood/donors">${t('blood.back.donors')}</a></p></div>`;
  if(!d.consent_to_list) return `${head(t('blood.consent.withdrawnTitle'))}${emptyState(t('blood.consent.withdrawnBody'), t('blood.back.donors'), '#/blood/donors')}`;
  const ok = donorAvailable(d, AS_OF);
  const next = nextEligible(d);
  return `${head(donorName(d, lang))}
  <section class="card"><dl class="kv">
    <dt>${t('blood.col.group')}</dt><dd><span class="num">${esc(d.blood_group)}</span></dd>
    <dt>${t('blood.detail.area')}</dt><dd>${esc(d.area)}</dd>
    <dt>${t('blood.detail.lastDonation')}</dt><dd>${d.last_donation_date ? fmtDate(d.last_donation_date, lang) : t('blood.avail.never')}</dd>
    <dt>${t('blood.col.avail')}</dt><dd>${availBadge(d)}${!ok && next ? ` · ${t('blood.avail.from')} ${fmtDate(next, lang)}` : ''}</dd>
    <dt>${t('blood.detail.consent')}</dt><dd>${plainBadge(t('blood.consent.listed'))}</dd>
    <dt>${t('blood.col.name')}</dt><dd>${fmtPhoneMasked(d.phone)} <span class="small muted">(${t('blood.phone.hidden')})</span></dd>
  </dl>
  <p class="small muted mt-4">${t('blood.phone.maskedNote')}</p>
  <p class="small muted">${t('blood.phone.neverPublic')}</p>
  <p class="mt-4"><a class="btn btn-secondary" href="#/blood/requests">${t('blood.crumbRequests')}</a> <a class="btn btn-ghost" href="#/blood/donors">${t('blood.back.donors')}</a></p></section>`;
}
function requestsHtml(ctx, lang){
  const q = ctx.query.q || '', status = ctx.query.status || 'all';
  let rows = filterList(store.blood_requests, { q, fields: ['blood_group', 'hospital_bn'] });
  if(status !== 'all') rows = rows.filter(r => r.status === status);
  rows = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const chips = [{ value: 'all', label: t('blood.filter.all') }, 'submitted', 'notified', 'fulfilled', 'cancelled'].map(v => ({ value: v, label: v === 'all' ? t('blood.filter.all') : t('blood.status.' + v) }));
  return `${head(t('blood.requests.title'), t('blood.requests.note'))}
  ${renderFilters({ q, chips, activeChip: status })}
  ${renderTable({ columns: [
    { key: 'blood_group', label: t('blood.col.group'), render: r => `<span class="num">${esc(r.blood_group)}</span>` },
    { key: 'units', label: t('blood.col.units'), render: r => fmtNum(r.units, lang) },
    { key: 'hospital_bn', label: t('blood.col.hospital'), render: r => esc(r.hospital_bn) },
    { key: 'status', label: t('blood.col.status'), render: r => statusBadge(r.status) },
    { key: 'contact_masked', label: t('blood.col.requester'), render: r => `<span class="num">${esc(r.contact_masked)}</span>` },
    { key: 'created_at', label: t('blood.col.date'), render: r => fmtDate(r.created_at, lang) }
  ], rows, page: parseInt(ctx.query.page || '1', 10), perPage: 20, onRowClick: r => '#/blood/requests/' + r.id, stacked: true })}`;
}
function requestDetailHtml(ctx, lang){
  const r = store.blood_requests.find(x => x.id === ctx.params.id);
  if(!r) return `<div class="card"><h1>${t('notfound.title')}</h1><p class="mt-4">${t('notfound.body')}</p><p class="mt-4"><a class="btn btn-primary" href="#/blood/requests">${t('blood.back.requests')}</a></p></div>`;
  const matching = store.blood_donors.filter(d => d.consent_to_list && d.blood_group === r.blood_group);
  const granted = store.blood_consents.filter(c => c.blood_request_id === r.id && c.outcome === 'granted');
  const open = r.status === 'submitted' || r.status === 'notified';
  const auditRows = store.activity_log.filter(a => a.subject_id === r.id);
  return `${head(`${r.blood_group} · ${fmtNum(r.units, lang)} ${t('blood.col.units')}`)}
  <section class="card"><dl class="kv">
    <dt>${t('blood.col.group')}</dt><dd><span class="num">${esc(r.blood_group)}</span></dd>
    <dt>${t('blood.col.units')}</dt><dd>${fmtNum(r.units, lang)}</dd>
    <dt>${t('blood.col.hospital')}</dt><dd>${esc(r.hospital_bn)}</dd>
    <dt>${t('blood.col.status')}</dt><dd>${statusBadge(r.status)}</dd>
    <dt>${t('blood.col.requester')}</dt><dd><span class="num">${esc(r.contact_masked)}</span></dd>
    <dt>${t('blood.col.date')}</dt><dd>${fmtDateTime(r.created_at, lang)}</dd>
  </dl>
  ${open ? `<div class="row mt-4"><button type="button" class="btn btn-primary" data-act="fulfil" ${granted.length ? '' : 'disabled'}>${t('blood.act.fulfil')}</button>
  <button type="button" class="btn btn-secondary" data-act="cancel">${t('blood.act.cancel')}</button></div>
  ${granted.length ? '' : `<p class="small muted mt-4">${t('blood.act.needGrant')}</p>`}` : ''}
  <p class="mt-4"><a class="btn btn-ghost" href="#/blood/requests">${t('blood.back.requests')}</a></p></section>
  <section class="card"><h3>${t('blood.match.title')} (${fmtNum(matching.length, lang)})</h3>
  <p class="small muted">${t('blood.consent.grantNote')}</p>
  ${matching.length ? matching.map(d => {
    const c = consentFor(r.id, d.id);
    const outcome = c ? c.outcome : 'none';
    const isRevealed = c && revealed.has(c.id);
    return `<div class="list-row"><div class="grow"><strong>${esc(donorName(d, lang))}</strong> · <span class="num">${esc(d.blood_group)}</span> · ${esc(d.area)}<br>
    <span class="small muted">${t('blood.detail.lastDonation')}: ${d.last_donation_date ? fmtDate(d.last_donation_date, lang) : '—'} · </span>${availBadge(d)}<br>
    <span class="small">${plainBadge(t('blood.consent.' + outcome))}</span><br>
    <span class="small muted num">${isRevealed ? esc(d.phone) : fmtPhoneMasked(d.phone)}</span>
    ${isRevealed ? `<span class="small muted"> — ${t('blood.phone.revealed')}</span>` : ''}</div>
    <div class="row">${outcome === 'granted' && !isRevealed ? `<button type="button" class="btn btn-secondary btn-sm" data-reveal="${c.id}" data-donor="${d.id}">${t('blood.phone.reveal')}</button>` : ''}
    ${outcome === 'granted' ? `<button type="button" class="btn btn-ghost btn-sm" data-revoke="${c.id}">${t('blood.consent.revoke')}</button>` : ''}
    ${outcome === 'pending' || outcome === 'none' ? `<button type="button" class="btn btn-secondary btn-sm" data-ask="${d.id}">${t('blood.consent.ask')}</button>` : ''}</div></div>`;
  }).join('') : `<p class="muted">${t('blood.match.none')}</p>`}
  ${matching.length === 0 && (r.blood_group === 'A-' || r.blood_group === 'AB-') ? `<p class="muted">${t('blood.match.emptyGroupBody')}</p>` : ''}</section>
  <section class="card"><h3>${t('blood.audit.title')}</h3>
  ${auditRows.length ? auditRows.map(a => `<div class="list-row"><div class="grow"><strong>${esc(a.action)}</strong> — <span class="num">${esc(a.subject_id)}</span><br><span class="small muted">${fmtDateTime(a.created_at, lang)} · ${esc(a.actor_role)}</span></div></div>`).join('') : `<p class="muted">${t('blood.audit.none')}</p>`}
  <p class="mt-4"><a href="#/audit">${t('nav.audit')}</a></p></section>`;
}
function bindBlood(ctx){
  const root = document.getElementById('view');
  if(!root) return;
  bindTableRows(root);
  const q = root.querySelector('[data-filter-q]');
  if(q) q.addEventListener('change', () => setHash('#' + ctx.path, { ...ctx.query, q: q.value, page: 1 }));
  root.querySelectorAll('[data-chip]').forEach(b => b.addEventListener('click', () => {
    const [kind, val] = b.dataset.chip.split(':');
    if(kind === 'group') setHash('#/blood/donors', { ...ctx.query, group: val, page: 1 });
    if(kind === 'avail') setHash('#/blood/donors', { ...ctx.query, avail: ctx.query.avail === val ? 'all' : val, page: 1 });
    if(kind === 'area') setHash('#/blood/donors', { ...ctx.query, area: ctx.query.area === val ? 'all' : val, page: 1 });
  }));
  const clear = root.querySelector('[data-clear-filters]');
  if(clear) clear.addEventListener('click', () => { location.hash = '#/blood/donors'; });
  // The shared filter binder is only for the requests LIST page; the donor
  // list has its own chips bound above. Detail-page actions bind below.
  if(ctx.path === '/blood/requests'){
    bindFilters(root, {
      onSearch: v => setHash('#/blood/requests', { ...ctx.query, q: v, page: 1 }),
      onChip: v => setHash('#/blood/requests', { ...ctx.query, status: v, page: 1 }),
      onClear: () => { location.hash = '#/blood/requests'; }
    });
  }
  root.querySelectorAll('[data-ask]').forEach(b => b.addEventListener('click', () => {
    const donorId = b.dataset.ask;
    const reqId = ctx.params.id;
    ctx.modal({ title: t('blood.confirm.askTitle'), body: `<p>${esc(t('blood.confirm.askBody'))}</p>`,
      confirmLabel: t('blood.consent.ask'),
      onConfirm: () => {
        let c = consentFor(reqId, donorId);
        if(!c){ c = { id: 'bc-demo-' + Date.now(), blood_request_id: reqId, donor_id: donorId, outcome: 'pending', granted_at: null }; store.blood_consents.push(c); }
        writeAudit(ctx.user.id, ctx.role, 'blood.consent.requested', 'blood_request', reqId, 'none', 'pending');
        Promise.resolve(ctx.rerender()).then(() => ctx.toast(t('blood.consent.askSent')));
      } });
  }));
  root.querySelectorAll('[data-reveal]').forEach(b => b.addEventListener('click', () => {
    const consentId = b.dataset.reveal;
    ctx.modal({ title: t('blood.confirm.revealTitle'), body: `<p>${esc(t('blood.confirm.revealBody'))}</p>`,
      confirmLabel: t('blood.phone.reveal'),
      onConfirm: () => {
        revealed.add(consentId);
        writeAudit(ctx.user.id, ctx.role, 'blood.phone.reveal', 'blood_request', ctx.params.id, null, 'revealed');
        Promise.resolve(ctx.rerender()).then(() => ctx.toast(t('blood.phone.revealed')));
      } });
  }));
  root.querySelectorAll('[data-revoke]').forEach(b => b.addEventListener('click', () => {
    const consentId = b.dataset.revoke;
    ctx.modal({ title: t('blood.confirm.revokeTitle'), body: `<p>${esc(t('blood.confirm.revokeBody'))}</p>`,
      confirmLabel: t('blood.consent.revoke'), danger: true,
      onConfirm: () => {
        const c = store.blood_consents.find(x => x.id === consentId);
        if(c) c.outcome = 'revoked';
        revealed.delete(consentId);
        writeAudit(ctx.user.id, ctx.role, 'blood.consent.revoke', 'blood_request', ctx.params.id, 'granted', 'revoked');
        Promise.resolve(ctx.rerender()).then(() => ctx.toast(t('blood.consent.revokedMsg')));
      } });
  }));
  const fulfil = root.querySelector('[data-act="fulfil"]');
  if(fulfil) fulfil.addEventListener('click', () => {
    ctx.modal({ title: t('blood.confirm.fulfilTitle'), body: `<p>${esc(t('blood.confirm.fulfilBody'))}</p>`,
      confirmLabel: t('blood.act.fulfil'),
      onConfirm: () => {
        const r = store.blood_requests.find(x => x.id === ctx.params.id);
        if(!r) return;
        const old = r.status; r.status = 'fulfilled';
        store.blood_consents.filter(c => c.blood_request_id === r.id && c.outcome === 'granted').forEach(c => {
          const d = store.blood_donors.find(x => x.id === c.donor_id);
          if(d) d.last_donation_date = '2026-11-14';
        });
        writeAudit(ctx.user.id, ctx.role, 'blood.request.fulfilled', 'blood_request', r.id, old, 'fulfilled');
        Promise.resolve(ctx.rerender()).then(() => ctx.toast(t('blood.act.fulfilledMsg')));
      } });
  });
  const cancel = root.querySelector('[data-act="cancel"]');
  if(cancel) cancel.addEventListener('click', () => {
    ctx.modal({ title: t('blood.confirm.cancelTitle'), body: `<p>${esc(t('blood.confirm.cancelBody'))}</p>`,
      confirmLabel: t('blood.act.cancel'), danger: true,
      onConfirm: () => {
        const r = store.blood_requests.find(x => x.id === ctx.params.id);
        if(!r) return;
        const old = r.status; r.status = 'cancelled';
        writeAudit(ctx.user.id, ctx.role, 'blood.request.cancelled', 'blood_request', r.id, old, 'cancelled');
        Promise.resolve(ctx.rerender()).then(() => ctx.toast(t('blood.act.cancelledMsg')));
      } });
  });
}
