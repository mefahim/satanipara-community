// Emergency Response Team roster (#/emergency-team). Super Admin only.
// Reached via a link from #/expatriate — NOT a sidebar item. ERT is 3–5 members
// plus backups. Escalation rules are OPEN (Q-17) — shown as a pending-confirmation
// label; no escalation chain is invented. This is not an ambulance replacement.
// Design System v2: shared statGrid (fmtNum, no hand-rolled digit conversion),
// status badges with text + dot, .link-more back link, role labels through t()
// (no hardcoded English mapping), no post-rerender toast delay (stable shell).
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store, writeAudit } from '../js/lib/store.js';
import { fmtPhoneMasked, fmtNum, esc } from '../js/lib/format.js';
import { badge, plainBadge } from '../js/components/badges.js';
import { renderTable, bindTableRows } from '../js/components/table.js';
import { statGrid } from '../js/components/stat.js';

const STRINGS = {
  bn: {
    'title': 'জরুরি দল', 'sub': 'জরুরি সহায়তা দল (ERT) — ৩–৫ জন সদস্য ও ব্যাকআপ। এই দল অ্যাম্বুলেন্স বা জরুরি সেবার বিকল্প নয় — আগে ৯৯৯-এ কল করুন।',
    'back': 'প্রবাসী অনুরোধে ফিরুন', 'onCall': 'দায়িত্বে আছেন', 'offCall': 'দায়িত্বে নেই', 'backup': 'ব্যাকআপ',
    'member': 'সদস্য', 'role': 'ভূমিকা', 'phone': 'মোবাইল', 'status': 'অবস্থা', 'action': 'কাজ',
    'setOnCall': 'দায়িত্বে বসান', 'setOffCall': 'দায়িত্ব থেকে সরান', 'changed': 'দায়িত্বের অবস্থা পরিবর্তন হয়েছে।',
    'q17': 'খোলা প্রশ্ন Q-17 — জরুরি অবস্থায় দায়িত্বে যাওয়ার নিয়ম এখনো নিশ্চিত হয়নি। নিয়ম না আসা পর্যন্ত কোনো স্বয়ংক্রিয় ধাপ দেখানো হয় না।',
    'count': 'দায়িত্বে আছেন', 'size': 'দলের আকার', 'sizeNote': '৩–৫ জন সদস্য + ব্যাকআপ (নীতিমালা অনুযায়ী)।',
    'confirmTitle': 'নিশ্চিত করুন', 'confirmBody': 'এই সদস্যের দায়িত্বের অবস্থা পরিবর্তন হবে। এই কাজটি লগে লেখা হবে।',
    'roleLead': 'দলনেতা', 'roleMember': 'সদস্য'
  },
  en: {
    'title': 'Emergency Team', 'sub': 'Emergency Response Team (ERT) — 3–5 members plus backups. This team is not an ambulance or emergency-services replacement — call 999 first.',
    'back': 'Back to expatriate requests', 'onCall': 'On call', 'offCall': 'Off call', 'backup': 'Backup',
    'member': 'Member', 'role': 'Role', 'phone': 'Mobile', 'status': 'Status', 'action': 'Action',
    'setOnCall': 'Put on call', 'setOffCall': 'Take off call', 'changed': 'On-call status changed.',
    'q17': 'Open question Q-17 — escalation rules are not yet confirmed. No automatic escalation step is shown until they are.',
    'count': 'On call', 'size': 'Team size', 'sizeNote': '3–5 members + backups (per policy).',
    'confirmTitle': 'Confirm', 'confirmBody': 'This member’s on-call status will change. This action will be written to the log.',
    'roleLead': 'Team lead', 'roleMember': 'Member'
  }
};
registerStrings('emergency', STRINGS);

// Role labels go through t() in EN; in BN the stored Bengali role is shown as-is.
const ROLE_KEY = { 'দলনেতা': 'roleLead', 'সদস্য': 'roleMember', 'ব্যাকআপ': 'backup' };
function roleLabel(m, lang){
  if(lang === 'bn') return m.role_bn || '';
  const key = ROLE_KEY[m.role_bn];
  return key ? t('emergency.' + key) : (m.role_bn || '');
}

export const Emergency = {
  route: '#/emergency-team',
  title: { bn: 'জরুরি দল', en: 'Emergency Team' },
  breadcrumb: ['nav.dashboard', 'nav.expatriate'],
  roles: ['super-admin'],
  permissions: ['expatriate.emergency.manage'],
  render(ctx) {
    const lang = getLang(), tt = k => ctx.t('emergency.' + k);
    const team = store.emergency_team_members;
    const onCall = team.filter(m => m.on_call).length;
    return `<span class="demo-badge">${ctx.t('app.demo')}</span>
    <p><a class="link-more" href="#/expatriate">${tt('back')}</a></p>
    <div class="view-head"><div><h1>${tt('title')}</h1><p class="sub">${tt('sub')}</p></div></div>
    ${statGrid([
      { href: '#/emergency-team', num: fmtNum(onCall, lang), label: tt('count') },
      { href: '#/emergency-team', num: fmtNum(team.length, lang), label: tt('size') }
    ])}
    <p class="small muted mt-4">${tt('sizeNote')}</p>
    <div class="card mt-4"><p><strong>${tt('q17')}</strong></p></div>
    <section class="card"><h3>${tt('title')}</h3>
    ${renderTable({ stacked: true, rows: team, columns: [
      { key: 'name_bn', label: tt('member'), render: m => esc(lang === 'bn' ? m.name_bn : m.name_en) },
      { key: 'role_bn', label: tt('role'), render: m => `${esc(roleLabel(m, lang))}${m.role_bn === 'ব্যাকআপ' ? ` ${plainBadge(tt('backup'))}` : ''}` },
      { key: 'phone', label: tt('phone'), render: m => `<span class="num">${fmtPhoneMasked(m.phone)}</span>` },
      { key: 'on_call', label: tt('status'), render: m => m.on_call ? badge('published', tt('onCall')) : badge('draft', tt('offCall')) },
      { key: 'id', label: tt('action'), render: m => `<button type="button" class="btn btn-secondary btn-sm" data-toggle="${m.id}">${m.on_call ? tt('setOffCall') : tt('setOnCall')}</button>` }
    ] })}</section>`;
  },
  onMount(ctx) {
    const root = document.getElementById('view');
    bindTableRows(root);
    root.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => {
      const m = store.emergency_team_members.find(x => x.id === b.dataset.toggle);
      if (!m) return;
      ctx.modal({ title: ctx.t('emergency.confirmTitle'), body: `<p>${ctx.t('emergency.confirmBody')}</p><p>${esc(getLang() === 'bn' ? m.name_bn : m.name_en)}</p>`, confirmLabel: ctx.t('common.confirm'), onConfirm: () => {
        m.on_call = !m.on_call;
        writeAudit(ctx.user.id, ctx.role, 'emergency.oncall', 'emergency_team_member', m.id, null, m.on_call ? 'on_call' : 'off_call');
        ctx.rerender();
        ctx.toast(ctx.t('emergency.changed'));
      } });
    }));
  },
  onUnmount() {}
};
