// guards.js — can(role, action) per audit §1.3; denied-screen renderer naming the required permission.
import { t } from '../i18n.js';
export const PERMISSIONS = {
  'super-admin': new Set([
    'users.view','users.manage','roles.view','members.view','members.approve','directory.view','directory.manage',
    'organisation.manage','activities.manage','expatriate.requests.view','expatriate.requests.manage','expatriate.requests.reject',
    'blood.view','blood.manage','content.manage','gallery.manage','faq.manage','finance.view','finance.manage','finance.publish',
    'reports.view','notifications.view','notifications.manage','messages.view','audit.view','settings.manage','health.view',
    'data_rights.manage','expatriate.emergency.manage','service_types.manage'
  ]),
  'expatriate-helper': new Set([
    'expatriate.requests.view','expatriate.requests.claim','expatriate.requests.advance',
    'notifications.view','profile.view'
  ])
};
export function can(role, action){ return !!(PERMISSIONS[role] && PERMISSIONS[role].has(action)); }
export function deniedHtml(requiredPermission){
  return `<div class="card"><h1>${t('denied.title')}</h1>
  <p class="mt-4">${t('denied.body')}</p>
  <p><strong>${t('denied.required')}:</strong> <code>${requiredPermission || '—'}</code></p>
  <p class="mt-4"><a class="btn btn-primary" href="#/dashboard">${t('common.back')}</a></p></div>`;
}
export function notFoundHtml(){
  return `<div class="card"><h1>${t('notfound.title')}</h1><p class="mt-4">${t('notfound.body')}</p>
  <p class="mt-4"><a class="btn btn-primary" href="#/dashboard">${t('common.back')}</a></p></div>`;
}
export function buildingHtml(route){
  return `<div class="card"><span class="demo-badge">${t('app.demo')}</span>
  <h1 class="mt-4">${t('building.title')}</h1><p class="mt-4">${t('building.body')}</p>
  <p class="small muted">Route: <code>${route}</code></p>
  <p class="mt-4"><a class="btn btn-primary" href="#/dashboard">${t('common.back')}</a></p></div>`;
}
