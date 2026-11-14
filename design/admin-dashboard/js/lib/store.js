// store.js — in-memory demo store: collections, filtering, pagination, demo audit writer.
// Reload resets everything (by design — design-only prototype, no persistence).
import { users, members } from '../data/demo-users.js';
import { service_requests, service_request_updates, service_request_expenses, service_types, emergency_team_members } from '../data/demo-requests.js';
import { households, persons, professionals, institutions, landmarks, freedom_fighters } from '../data/demo-directory.js';
import { milestones, constitution_versions, committee, advisors, past_leaders, achievements } from '../data/demo-org.js';
import { activities, posts, faqs, student_achievements } from '../data/demo-content.js';
import { blood_donors, blood_requests, blood_consents } from '../data/demo-blood.js';
import { ledger_entries, ledger_reversals, finance_categories, projects, annual_reports } from '../data/demo-finance.js';
import { notifications, contact_messages, activity_log, settings, data_requests } from '../data/demo-system.js';
import { albums, media } from '../data/demo-media.js';
import { now } from './format.js';
export { now }; // single live clock — re-exported so views/components import it from the store

export const store = {
  DEMO: true,
  users: [...users], members: [...members],
  service_requests: [...service_requests], service_request_updates: [...service_request_updates],
  service_request_expenses: [...service_request_expenses], service_types: [...service_types],
  emergency_team_members: [...emergency_team_members],
  households: [...households], persons: [...persons], professionals: [...professionals],
  institutions: [...institutions], landmarks: [...landmarks], freedom_fighters: [...freedom_fighters],
  milestones: [...milestones], constitution_versions: [...constitution_versions],
  committee: JSON.parse(JSON.stringify(committee)), advisors: [...advisors], past_leaders: [...past_leaders], achievements: [...achievements],
  activities: [...activities], posts: [...posts], faqs: [...faqs],
  student_achievements: [...student_achievements],
  blood_donors: [...blood_donors], blood_requests: [...blood_requests], blood_consents: [...blood_consents],
  ledger_entries: [...ledger_entries], ledger_reversals: [...ledger_reversals],
  finance_categories: [...finance_categories], projects: [...projects], annual_reports: [...annual_reports],
  notifications: [...notifications], contact_messages: [...contact_messages],
  activity_log: [...activity_log], settings: JSON.parse(JSON.stringify(settings)), data_requests: [...data_requests],
  albums: [...albums], media: [...media]
};
// Store mutation API (DS v2, audit D-11): views MUST mutate through these
// helpers, never by writing to an imported js/data array directly.
// content.js still reads/writes the imported student_achievements array —
// the content module worker must migrate it to storeAdd/storeRemove (see DS-V2.md).
export function storeAdd(collection, item){
  if(!store[collection] || !Array.isArray(store[collection])) throw new Error('unknown store collection: ' + collection);
  store[collection].unshift(item);
  return item;
}
export function storeRemove(collection, predicate){
  if(!store[collection] || !Array.isArray(store[collection])) throw new Error('unknown store collection: ' + collection);
  store[collection] = store[collection].filter(item => !predicate(item));
}
export function storeUpdate(collection, predicate, patch){
  if(!store[collection] || !Array.isArray(store[collection])) throw new Error('unknown store collection: ' + collection);
  const item = store[collection].find(predicate);
  if(item) Object.assign(item, patch);
  return item || null;
}
export function filterList(list, { q = '', fields = [], match = null } = {}){
  let out = [...list];
  if(q){
    const needle = q.trim().toLowerCase();
    out = out.filter(item => fields.some(f => String(item[f] ?? '').toLowerCase().includes(needle)));
  }
  if(match) out = out.filter(match);
  return out;
}
export function paginate(list, page = 1, perPage = 20){
  const per = Math.min(Math.max(parseInt(perPage, 10) || 20, 1), 50);
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const total = list.length;
  const pages = Math.max(Math.ceil(total / per), 1);
  const start = (p - 1) * per;
  return { rows: list.slice(start, start + per), page: p, perPage: per, total, pages, from: total ? start + 1 : 0, to: Math.min(start + per, total) };
}
// Demo audit writer: every consequential demo action appends a row (visible in Audit Logs).
export function writeAudit(actorId, actorRole, action, subjectType, subjectId, oldValue, newValue){
  store.activity_log.unshift({ id: 'al-demo-' + Date.now(), actor: actorId, actor_role: actorRole, action, subject_type: subjectType, subject_id: subjectId, old_value: oldValue ?? null, new_value: newValue ?? null, ip: '127.0.0.1', created_at: new Date().toISOString() });
}
export function unreadCount(userId){ return store.notifications.filter(n => n.user_id === userId && !n.read).length; }
export function activeSuperAdmins(){ return store.users.filter(u => u.role === 'super-admin' && u.status === 'active').length; }
export function counts(){
  return {
    pendingMembers: store.members.filter(m => m.status === 'pending').length,
    totalMembers: store.members.filter(m => m.status === 'approved').length,
    openRequests: store.service_requests.filter(r => ['pending','accepted','in_progress'].includes(r.status)).length,
    activeRequests: store.service_requests.filter(r => ['accepted','in_progress'].includes(r.status)).length,
    urgentRequests: store.service_requests.filter(r => r.urgency === 'urgent' && ['pending','accepted','in_progress'].includes(r.status)).length,
    unreadMessages: store.contact_messages.filter(m => m.status === 'new').length,
    staleRequests: store.service_requests.filter(r => r.status === 'in_progress' && r.last_update_at && (now() - new Date(r.last_update_at)) > 72*3600*1000).length,
    pendingFinance: store.ledger_entries.filter(e => e.status === 'draft').length
  };
}
