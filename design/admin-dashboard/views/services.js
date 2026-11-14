// Service catalogue (#/services). Super Admin only.
// Reached via links from #/expatriate and #/settings — NOT a sidebar item.
// The 7 demo seed types are editable / deactivatable so the final list can replace
// them. The final service list is OPEN (Q-22) — labelled pending confirmation.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store, writeAudit } from '../js/lib/store.js';
import { esc } from '../js/lib/format.js';
import { plainBadge } from '../js/components/badges.js';
import { renderTable, bindTableRows } from '../js/components/table.js';

const STRINGS = {
  bn: {
    'title': 'সেবার তালিকা', 'sub': 'প্রবাসী সহায়তার সেবার ধরন — নাম পরিবর্তন বা নিষ্ক্রিয় করা যায়, যাতে চূড়ান্ত তালিকা বসানো যায়।',
    'back': 'প্রবাসী অনুরোধে ফিরুন', 'nameBn': 'নাম (বাংলা)', 'nameEn': 'নাম (English)', 'status': 'অবস্থা',
    'active': 'সক্রিয়', 'inactive': 'নিষ্ক্রিয়', 'action': 'কাজ', 'edit': 'পরিবর্তন করুন', 'deactivate': 'নিষ্ক্রিয় করুন',
    'activate': 'সক্রিয় করুন', 'saved': 'সেবার নাম সংরক্ষণ হয়েছে।', 'changed': 'সেবার অবস্থা পরিবর্তন হয়েছে।',
    'q22': 'খোলা প্রশ্ন Q-22 — চূড়ান্ত সেবার তালিকা এখনো নিশ্চিত হয়নি (৭টি নাকি ৬টি)। নিচের ৭টি শুধু ডেমো বীজ তথ্য।',
    'confirmTitle': 'নিশ্চিত করুন', 'confirmBody': 'এই সেবার ধরনের অবস্থা পরিবর্তন হবে। এই কাজটি লগে লেখা হবে।',
    'editTitle': 'সেবার নাম পরিবর্তন করুন', 'save': 'সংরক্ষণ করুন'
  },
  en: {
    'title': 'Service Catalogue', 'sub': 'Expatriate support service types — names can be edited and types deactivated, so the final list can replace them.',
    'back': 'Back to expatriate requests', 'nameBn': 'Name (Bengali)', 'nameEn': 'Name (English)', 'status': 'Status',
    'active': 'Active', 'inactive': 'Inactive', 'action': 'Action', 'edit': 'Edit', 'deactivate': 'Deactivate',
    'activate': 'Activate', 'saved': 'Service name saved.', 'changed': 'Service status changed.',
    'q22': 'Open question Q-22 — the final service list is not yet confirmed (7 or 6 types). The 7 below are demo seed data only.',
    'confirmTitle': 'Confirm', 'confirmBody': 'This service type’s status will change. This action will be written to the log.',
    'editTitle': 'Edit service name', 'save': 'Save'
  }
};
registerStrings('services', STRINGS);

export const Services = {
  route: '#/services',
  title: { bn: 'সেবার তালিকা', en: 'Service Catalogue' },
  breadcrumb: ['nav.dashboard', 'nav.expatriate'],
  roles: ['super-admin'],
  permissions: ['service_types.manage'],
  render(ctx) {
    const lang = getLang(), tt = k => ctx.t('services.' + k);
    const types = store.service_types;
    const active = types.filter(s => s.active).length;
    const stat = (num, label) => `<a class="stat" href="#/services"><div class="num">${lang === 'bn' ? String(num).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[+d]) : num}</div><div class="lbl">${label}</div></a>`;
    return `<span class="demo-badge">${ctx.t('app.demo')}</span>
    <p><a href="#/expatriate">← ${tt('back')}</a></p>
    <div class="view-head"><div><h1>${tt('title')}</h1><p class="sub">${tt('sub')}</p></div></div>
    <div class="stat-grid">${stat(active, tt('active'))}${stat(types.length, tt('title'))}</div>
    <div class="card mt-4"><p><strong>${tt('q22')}</strong></p></div>
    <section class="card"><h3>${tt('title')}</h3>
    ${renderTable({ stacked: true, rows: types, columns: [
      { key: 'name_bn', label: tt('nameBn'), render: s => esc(s.name_bn) },
      { key: 'name_en', label: tt('nameEn'), render: s => esc(s.name_en) },
      { key: 'active', label: tt('status'), render: s => s.active ? plainBadge(tt('active')) : plainBadge(tt('inactive')) },
      { key: 'key', label: tt('action'), render: s => `<span class="row"><button type="button" class="btn btn-secondary btn-sm" data-edit="${s.key}">${tt('edit')}</button><button type="button" class="btn btn-secondary btn-sm" data-toggle="${s.key}">${s.active ? tt('deactivate') : tt('activate')}</button></span>` }
    ] })}</section>`;
  },
  onMount(ctx) {
    const root = document.getElementById('view');
    bindTableRows(root);
    root.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
      const s = store.service_types.find(x => x.key === b.dataset.edit);
      if (!s) return;
      ctx.modal({ title: ctx.t('services.editTitle'), body: `<div class="field"><label for="svc-bn">${ctx.t('services.nameBn')}</label><input id="svc-bn" class="input" value="${esc(s.name_bn)}"></div><div class="field"><label for="svc-en">${ctx.t('services.nameEn')}</label><input id="svc-en" class="input" value="${esc(s.name_en)}"></div>`, confirmLabel: ctx.t('services.save'), onConfirm: () => {
        // Modal DOM is cleared before onConfirm runs, so values are captured live
        // via input listeners attached right after the modal opens (see below).
        if (bnVal.trim()) s.name_bn = bnVal.trim();
        if (enVal.trim()) s.name_en = enVal.trim();
        writeAudit(ctx.user.id, ctx.role, 'service_types.edit', 'service_type', s.key, null, s.name_bn);
        ctx.rerender(); setTimeout(() => ctx.toast(ctx.t('services.saved')), 350);
      } });
      // Capture field values live: the modal root is emptied before onConfirm fires.
      let bnVal = s.name_bn, enVal = s.name_en;
      const bnEl = document.getElementById('svc-bn'), enEl = document.getElementById('svc-en');
      if (bnEl) bnEl.addEventListener('input', () => { bnVal = bnEl.value; });
      if (enEl) enEl.addEventListener('input', () => { enVal = enEl.value; });
    }));
    root.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => {
      const s = store.service_types.find(x => x.key === b.dataset.toggle);
      if (!s) return;
      ctx.modal({ title: ctx.t('services.confirmTitle'), body: `<p>${ctx.t('services.confirmBody')}</p><p>${esc(getLang() === 'bn' ? s.name_bn : s.name_en)}</p>`, confirmLabel: ctx.t('common.confirm'), onConfirm: () => {
        s.active = !s.active;
        writeAudit(ctx.user.id, ctx.role, 'service_types.toggle', 'service_type', s.key, null, s.active ? 'active' : 'inactive');
        ctx.rerender(); setTimeout(() => ctx.toast(ctx.t('services.changed')), 350);
      } });
    }));
  },
  onUnmount() {}
};
