// Roles & Permissions — VIEW ONLY matrix (Doc 04 §4). Phase 1 has exactly two
// admin roles; roles are seeded by deployment and there is NO create/edit UI and
// NO role builder here. Deferred roles (President/Treasurer/GS) are never offered.
// Grants follow Doc 04; the prototype's route guards check the subset in guards.js.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store } from '../js/lib/store.js';
import { fmtNum, esc } from '../js/lib/format.js';

const STRINGS = {
  bn: {
    'title': 'ভূমিকা ও অনুমতি', 'subtitle': 'শুধু দেখার জন্য — ভূমিকা তৈরি বা সম্পাদনা করা যায় না।',
    'viewOnly': 'এই পাতাটি শুধু দেখার জন্য। ভূমিকা ও অনুমতি ডেপ্লয়মেন্টে নির্ধারিত হয়; প্রথম ধাপে এখান থেকে বদলানো যায় না।',
    'deferred': 'সভাপতি / সাধারণ সম্পাদক / কোষাধ্যক্ষসহ অন্যান্য ভূমিকা ভবিষ্যতের জন্য স্থগিত — প্রথম ধাপে এগুলো দেওয়া হয় না।',
    'sa.name': 'সুপার অ্যাডমিন', 'sa.scope': 'সব মডিউলের পূর্ণ প্রশাসন।',
    'helper.name': 'প্রবাসী সহায়ক', 'helper.scope': 'শুধু প্রবাসী সহায়তা (M5) + নিজের প্রোফাইল ও বিজ্ঞপ্তি।',
    'colPerm': 'অনুমতি', 'colMeaning': 'অর্থ', 'colSA': 'সুপার অ্যাডমিন', 'colHelper': 'প্রবাসী সহায়ক',
    'yes': 'আছে', 'no': 'নেই', 'countUsers': 'ব্যবহারকারী',
    'g.identity': 'পরিচয় ও সদস্যপদ (M1)', 'g.directory': 'ডিরেক্টরি (M2)', 'g.organisation': 'সংগঠন (M3)',
    'g.activities': 'বার্ষিক কার্যক্রম (M4)', 'g.expatriate': 'প্রবাসী সহায়তা (M5)', 'g.blood': 'রক্তদান (M6)',
    'g.content': 'কনটেন্ট (M7)', 'g.finance': 'অর্থ (M8)', 'g.notifications': 'বিজ্ঞপ্তি (M9)', 'g.admin': 'প্রশাসন ও সিস্টেম (M10)',
    'matrixNote': 'দ্রষ্টব্য: roles.manage সুপার অ্যাডমিনের থাকলেও প্রথম ধাপে ভূমিকা সম্পাদনার UI নেই — ভূমিকা শুধু ডেপ্লয়মেন্টের সিড থেকে আসে। সদস্য-স্তরের অনুমতি (যেমন view_own) কোনো অ্যাডমিন ভূমিকাকে দেওয়া হয়নি।',
    'perm.members.view': 'সদস্য দেখা', 'perm.members.create': 'সদস্য/ব্যবহারকারী তৈরি', 'perm.members.update': 'সদস্যের তথ্য সম্পাদনা',
    'perm.members.approve': 'সদস্য অনুমোদন / প্রত্যাখ্যান', 'perm.members.suspend': 'সদস্যপদ স্থগিত / পুনর্বহাল',
    'perm.members.delete': 'সদস্য সফট-ডিলিট', 'perm.members.export': 'সদস্য তথ্য রপ্তানি',
    'perm.members.reset_password': 'অন্যের পাসওয়ার্ড রিসেট', 'perm.profile.view_own': 'নিজের প্রোফাইল দেখা',
    'perm.profile.update_own': 'নিজের প্রোফাইল সম্পাদনা', 'perm.families.manage_own': 'নিজের পরিবারের রেকর্ড',
    'perm.directory.view': 'ডিরেক্টরি দেখা', 'perm.directory.create': 'ডিরেক্টরি এন্ট্রি তৈরি',
    'perm.directory.update': 'ডিরেক্টরি সম্পাদনা', 'perm.directory.delete': 'ডিরেক্টরি সফট-ডিলিট',
    'perm.directory.publish': 'এন্ট্রি প্রকাশ / প্রত্যাহার', 'perm.community.stats.view': 'কমিউনিটি পরিসংখ্যান দেখা',
    'perm.organisation.view': 'সংগঠন দেখা', 'perm.organisation.update': 'সংগঠনের তথ্য সম্পাদনা',
    'perm.organisation.timeline.manage': 'ইতিহাসের মাইলফলক পরিচালনা', 'perm.constitution.view': 'গঠনতন্ত্র দেখা',
    'perm.constitution.manage': 'গঠনতন্ত্রের সংস্করণ পরিচালনা', 'perm.committee.view': 'কমিটি দেখা',
    'perm.committee.manage': 'কমিটি পরিচালনা', 'perm.activities.view': 'কার্যক্রম দেখা',
    'perm.activities.create': 'কার্যক্রম তৈরি', 'perm.activities.update': 'কার্যক্রম সম্পাদনা',
    'perm.activities.delete': 'কার্যক্রম সফট-ডিলিট', 'perm.activities.publish': 'কার্যক্রম প্রকাশ / প্রত্যাহার',
    'perm.expatriate.requests.view': 'অনুরোধের সারি ও বিস্তারিত দেখা', 'perm.expatriate.requests.view_own': 'শুধু নিজের অনুরোধ দেখা (সদস্য)',
    'perm.expatriate.requests.assign': 'সহায়ক নিয়োগ / নিজে নেওয়া', 'perm.expatriate.requests.accept': 'অনুরোধ গ্রহণ',
    'perm.expatriate.requests.advance': 'অনুরোধ এক ধাপ এগোনো', 'perm.expatriate.requests.reject': 'অনুরোধ প্রত্যাখ্যান (কারণসহ)',
    'perm.expatriate.requests.cancel': 'অনুরোধ বাতিল', 'perm.expatriate.requests.close': 'অনুরোধ বন্ধ (আবেদনকারীর নিশ্চয়তায়)',
    'perm.expatriate.updates.create': 'অনুরোধে আপডেট যোগ', 'perm.expatriate.expenses.create': 'খরচের লাইন যোগ',
    'perm.expatriate.expenses.view': 'খরচ দেখা', 'perm.service_types.manage': 'সেবার তালিকা পরিচালনা',
    'perm.expatriate.emergency.manage': 'জরুরি দল পরিচালনা', 'perm.donors.view': 'দাতা তালিকা দেখা',
    'perm.donors.view_contact': 'সম্মতির পর দাতার নম্বর দেখা', 'perm.donors.create': 'দাতা নিবন্ধন',
    'perm.donors.update': 'দাতার রেকর্ড সম্পাদনা', 'perm.donors.delete': 'দাতার রেকর্ড প্রত্যাহার',
    'perm.blood.requests.view': 'রক্তের অনুরোধ দেখা', 'perm.blood.requests.update': 'রক্তের অনুরোধের অবস্থা বদল',
    'perm.content.view_public': 'প্রকাশিত কনটেন্ট দেখা', 'perm.content.create': 'খসড়া কনটেন্ট তৈরি',
    'perm.content.update': 'কনটেন্ট সম্পাদনা', 'perm.content.publish': 'কনটেন্ট প্রকাশ / সময়সূচি',
    'perm.content.archive': 'কনটেন্ট আর্কাইভ', 'perm.content.delete': 'কনটেন্ট সফট-ডিলিট',
    'perm.media.upload': 'মিডিয়া আপলোড', 'perm.media.manage': 'মিডিয়া লাইব্রেরি পরিচালনা',
    'perm.finance.view': 'লেজার দেখা', 'perm.finance.view_public': 'প্রকাশিত অর্থ-সারাংশ দেখা',
    'perm.finance.create': 'লেজার এন্ট্রি লেখা (খসড়া)', 'perm.finance.approve': 'এন্ট্রি যাচাই ও প্রকাশ',
    'perm.finance.reverse': 'বিপরীত (রিভার্সাল) এন্ট্রি তৈরি', 'perm.finance.categories.manage': 'অর্থের শ্রেণি পরিচালনা',
    'perm.finance.projects.manage': 'প্রকল্প হিসাব পরিচালনা', 'perm.finance.reports.publish': 'মাসিক সারাংশ / বার্ষিক প্রতিবেদন প্রকাশ',
    'perm.finance.export': 'অর্থ তথ্য রপ্তানি', 'perm.notifications.view_own': 'নিজের বিজ্ঞপ্তি দেখা',
    'perm.notifications.manage_own': 'নিজের বিজ্ঞপ্তি পরিচালনা', 'perm.notifications.send': 'বিজ্ঞপ্তি পাঠানো',
    'perm.notifications.view_log': 'বিজ্ঞপ্তির ডেলিভারি লগ দেখা', 'perm.dashboard.view_admin': 'সুপার অ্যাডমিন ড্যাশবোর্ড',
    'perm.dashboard.view_helper': 'সহায়কের ড্যাশবোর্ড', 'perm.audit_logs.view': 'অডিট লগ দেখা (শুধু পড়া)',
    'perm.roles.manage': 'ভূমিকা ও অনুমতি পরিচালনা', 'perm.users.manage_roles': 'ব্যবহারকারীকে ভূমিকা দেওয়া / সরানো',
    'perm.settings.manage': 'সাইট সেটিংস পরিচালনা', 'perm.contact_messages.view': 'যোগাযোগ বার্তা দেখা',
    'perm.contact_messages.reply': 'বার্তার উত্তর / সমাধান', 'perm.data_rights.manage': 'তথ্য-অধিকার অনুরোধ প্রক্রিয়া',
    'perm.system.health.view': 'সিস্টেম স্বাস্থ্য দেখা'
  },
  en: {
    'title': 'Roles & Permissions', 'subtitle': 'View only — roles cannot be created or edited here.',
    'viewOnly': 'This page is view only. Roles and permissions are set at deployment; they cannot be changed from here in Phase 1.',
    'deferred': 'Other roles, including President / General Secretary / Treasurer, are deferred — they are not assigned in Phase 1.',
    'sa.name': 'Super Admin', 'sa.scope': 'Full administration of all modules.',
    'helper.name': 'Expatriate Helper', 'helper.scope': 'Expatriate support only (M5) + own profile and notifications.',
    'colPerm': 'Permission', 'colMeaning': 'Meaning', 'colSA': 'Super Admin', 'colHelper': 'Expatriate Helper',
    'yes': 'Granted', 'no': 'Not granted', 'countUsers': 'users',
    'g.identity': 'Identity & membership (M1)', 'g.directory': 'Directory (M2)', 'g.organisation': 'Organisation (M3)',
    'g.activities': 'Annual activities (M4)', 'g.expatriate': 'Expatriate support (M5)', 'g.blood': 'Blood donation (M6)',
    'g.content': 'Content (M7)', 'g.finance': 'Finance (M8)', 'g.notifications': 'Notifications (M9)', 'g.admin': 'Administration & system (M10)',
    'matrixNote': 'Note: roles.manage belongs to Super Admin, but Phase 1 has no role-editing UI — roles come only from the deployment seed. Member-level permissions (such as view_own) are granted to no admin role.',
    'perm.members.view': 'View members', 'perm.members.create': 'Create member / user', 'perm.members.update': 'Edit member details',
    'perm.members.approve': 'Approve / reject members', 'perm.members.suspend': 'Suspend / reinstate membership',
    'perm.members.delete': 'Soft-delete member', 'perm.members.export': 'Export member data',
    'perm.members.reset_password': 'Reset another user\u2019s password', 'perm.profile.view_own': 'View own profile',
    'perm.profile.update_own': 'Edit own profile', 'perm.families.manage_own': 'Own family records',
    'perm.directory.view': 'View directory', 'perm.directory.create': 'Create directory entry',
    'perm.directory.update': 'Edit directory', 'perm.directory.delete': 'Soft-delete directory entry',
    'perm.directory.publish': 'Publish / withdraw entry', 'perm.community.stats.view': 'View community statistics',
    'perm.organisation.view': 'View organisation', 'perm.organisation.update': 'Edit organisation details',
    'perm.organisation.timeline.manage': 'Manage history milestones', 'perm.constitution.view': 'View constitution',
    'perm.constitution.manage': 'Manage constitution versions', 'perm.committee.view': 'View committee',
    'perm.committee.manage': 'Manage committee', 'perm.activities.view': 'View activities',
    'perm.activities.create': 'Create activity', 'perm.activities.update': 'Edit activity',
    'perm.activities.delete': 'Soft-delete activity', 'perm.activities.publish': 'Publish / unpublish activity',
    'perm.expatriate.requests.view': 'View request queue and detail', 'perm.expatriate.requests.view_own': 'View only own requests (member)',
    'perm.expatriate.requests.assign': 'Assign helper / self-assign', 'perm.expatriate.requests.accept': 'Accept a request',
    'perm.expatriate.requests.advance': 'Advance a request one step', 'perm.expatriate.requests.reject': 'Reject a request (with reason)',
    'perm.expatriate.requests.cancel': 'Cancel a request', 'perm.expatriate.requests.close': 'Close a request (applicant confirms)',
    'perm.expatriate.updates.create': 'Add request updates', 'perm.expatriate.expenses.create': 'Add expense lines',
    'perm.expatriate.expenses.view': 'View expenses', 'perm.service_types.manage': 'Manage service catalogue',
    'perm.expatriate.emergency.manage': 'Manage emergency team', 'perm.donors.view': 'View donor list',
    'perm.donors.view_contact': 'View donor number after consent', 'perm.donors.create': 'Register donor',
    'perm.donors.update': 'Edit donor record', 'perm.donors.delete': 'Withdraw donor record',
    'perm.blood.requests.view': 'View blood requests', 'perm.blood.requests.update': 'Change blood-request status',
    'perm.content.view_public': 'View published content', 'perm.content.create': 'Create draft content',
    'perm.content.update': 'Edit content', 'perm.content.publish': 'Publish / schedule content',
    'perm.content.archive': 'Archive content', 'perm.content.delete': 'Soft-delete content',
    'perm.media.upload': 'Upload media', 'perm.media.manage': 'Manage media library',
    'perm.finance.view': 'View ledger', 'perm.finance.view_public': 'View published finance summaries',
    'perm.finance.create': 'Enter ledger entry (draft)', 'perm.finance.approve': 'Verify and publish entry',
    'perm.finance.reverse': 'Create reversal entry', 'perm.finance.categories.manage': 'Manage finance categories',
    'perm.finance.projects.manage': 'Manage project accounts', 'perm.finance.reports.publish': 'Publish monthly summary / annual report',
    'perm.finance.export': 'Export finance data', 'perm.notifications.view_own': 'View own notifications',
    'perm.notifications.manage_own': 'Manage own notifications', 'perm.notifications.send': 'Send notifications',
    'perm.notifications.view_log': 'View notification delivery log', 'perm.dashboard.view_admin': 'Super Admin dashboard',
    'perm.dashboard.view_helper': 'Helper dashboard', 'perm.audit_logs.view': 'View audit log (read-only)',
    'perm.roles.manage': 'Manage roles and permissions', 'perm.users.manage_roles': 'Assign / remove roles on users',
    'perm.settings.manage': 'Manage site settings', 'perm.contact_messages.view': 'View contact messages',
    'perm.contact_messages.reply': 'Reply to / resolve messages', 'perm.data_rights.manage': 'Process data-rights requests',
    'perm.system.health.view': 'View system health'
  }
};
registerStrings('roles', STRINGS);

// [permission, super-admin?, helper?] — grants per Doc 04 §4.
const GROUPS = [
  ['g.identity', [['members.view', 1, 0], ['members.create', 1, 0], ['members.update', 1, 0], ['members.approve', 1, 0], ['members.suspend', 1, 0], ['members.delete', 1, 0], ['members.export', 1, 0], ['members.reset_password', 1, 0], ['profile.view_own', 1, 1], ['profile.update_own', 1, 1], ['families.manage_own', 1, 1]]],
  ['g.directory', [['directory.view', 1, 0], ['directory.create', 1, 0], ['directory.update', 1, 0], ['directory.delete', 1, 0], ['directory.publish', 1, 0], ['community.stats.view', 1, 0]]],
  ['g.organisation', [['organisation.view', 1, 0], ['organisation.update', 1, 0], ['organisation.timeline.manage', 1, 0], ['constitution.view', 1, 0], ['constitution.manage', 1, 0], ['committee.view', 1, 0], ['committee.manage', 1, 0]]],
  ['g.activities', [['activities.view', 1, 0], ['activities.create', 1, 0], ['activities.update', 1, 0], ['activities.delete', 1, 0], ['activities.publish', 1, 0]]],
  ['g.expatriate', [['expatriate.requests.view', 1, 1], ['expatriate.requests.view_own', 0, 0], ['expatriate.requests.assign', 1, 1], ['expatriate.requests.accept', 1, 1], ['expatriate.requests.advance', 1, 1], ['expatriate.requests.reject', 1, 0], ['expatriate.requests.cancel', 1, 0], ['expatriate.requests.close', 1, 0], ['expatriate.updates.create', 1, 1], ['expatriate.expenses.create', 1, 1], ['expatriate.expenses.view', 1, 1], ['service_types.manage', 1, 0], ['expatriate.emergency.manage', 1, 0]]],
  ['g.blood', [['donors.view', 1, 0], ['donors.view_contact', 1, 0], ['donors.create', 1, 0], ['donors.update', 1, 0], ['donors.delete', 1, 0], ['blood.requests.view', 1, 0], ['blood.requests.update', 1, 0]]],
  ['g.content', [['content.view_public', 1, 1], ['content.create', 1, 0], ['content.update', 1, 0], ['content.publish', 1, 0], ['content.archive', 1, 0], ['content.delete', 1, 0], ['media.upload', 1, 0], ['media.manage', 1, 0]]],
  ['g.finance', [['finance.view', 1, 0], ['finance.view_public', 1, 1], ['finance.create', 1, 0], ['finance.approve', 1, 0], ['finance.reverse', 1, 0], ['finance.categories.manage', 1, 0], ['finance.projects.manage', 1, 0], ['finance.reports.publish', 1, 0], ['finance.export', 1, 0]]],
  ['g.notifications', [['notifications.view_own', 1, 1], ['notifications.manage_own', 1, 1], ['notifications.send', 1, 0], ['notifications.view_log', 1, 0]]],
  ['g.admin', [['dashboard.view_admin', 1, 0], ['dashboard.view_helper', 0, 1], ['audit_logs.view', 1, 0], ['roles.manage', 1, 0], ['users.manage_roles', 1, 0], ['settings.manage', 1, 0], ['contact_messages.view', 1, 0], ['contact_messages.reply', 1, 0], ['data_rights.manage', 1, 0], ['system.health.view', 1, 0]]]
];

export const Roles = {
  route: '#/roles',
  title: { bn: 'ভূমিকা ও অনুমতি', en: 'Roles & Permissions' },
  breadcrumb: ['nav.dashboard', 'nav.roles'],
  roles: ['super-admin'],
  permissions: ['roles.view'],
  render(ctx){
    const lang = getLang();
    const count = role => store.users.filter(u => u.role === role && u.status === 'active').length;
    const cell = granted => granted
      ? `<span aria-label="${t('roles.yes')}">✓ ${t('roles.yes')}</span>`
      : `<span class="muted" aria-label="${t('roles.no')}">— ${t('roles.no')}</span>`;
    const card = (nameKey, scopeKey, role) => `<section class="card"><h3>${t(nameKey)}</h3>
      <p class="mt-4">${t(scopeKey)}</p>
      <p class="mt-4"><strong class="num">${fmtNum(count(role), lang)}</strong> ${t('roles.countUsers')}</p></section>`;
    return `<span class="demo-badge">${t('app.demo')}</span>
    <div class="view-head"><div><h1>${t('roles.title')}</h1><p class="sub">${t('roles.subtitle')}</p></div></div>
    <div class="banner" role="note"><span>${t('roles.viewOnly')}</span></div>
    <p class="small muted mt-4">${t('roles.deferred')}</p>
    <div class="two-col mt-4">
      ${card('roles.sa.name', 'roles.sa.scope', 'super-admin')}
      ${card('roles.helper.name', 'roles.helper.scope', 'expatriate-helper')}
    </div>
    ${GROUPS.map(([g, rows]) => `<section class="card mt-4"><h3>${t('roles.' + g)}</h3>
      <div class="table-wrap"><table class="tbl"><thead><tr>
        <th>${t('roles.colPerm')}</th><th>${t('roles.colMeaning')}</th>
        <th>${t('roles.colSA')}</th><th>${t('roles.colHelper')}</th>
      </tr></thead><tbody>
      ${rows.map(([p, sa, h]) => `<tr><td data-label="${t('roles.colPerm')}"><code class="num">${esc(p)}</code></td>
        <td data-label="${t('roles.colMeaning')}">${t('roles.perm.' + p)}</td>
        <td data-label="${t('roles.colSA')}">${cell(sa)}</td>
        <td data-label="${t('roles.colHelper')}">${cell(h)}</td></tr>`).join('')}
      </tbody></table></div></section>`).join('')}
    <p class="small muted mt-4">${t('roles.matrixNote')}</p>`;
  },
  onMount(){},
  onUnmount(){}
};
