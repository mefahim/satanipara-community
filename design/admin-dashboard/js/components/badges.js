// Badges: pill, 14px/700, forest text on wash; status = text + 6px dot, never colour alone. No gold badges.
import { t } from '../i18n.js';
import { esc } from '../lib/format.js';
const STATUS_CLASS = { pending:'st-pending', accepted:'st-accepted', in_progress:'st-in_progress', completed:'st-completed', closed:'st-closed', published:'st-published', approved:'st-approved', rejected:'st-rejected', cancelled:'st-cancelled', discarded:'st-discarded', reversed:'st-reversed', draft:'st-draft' };
export function statusLabel(status){
  const map = { pending:'exp.status.pending', accepted:'exp.status.accepted', in_progress:'exp.status.in_progress', completed:'exp.status.completed', closed:'exp.status.closed', rejected:'exp.status.rejected', cancelled:'exp.status.cancelled', draft:'fin.status.draft', published:'fin.status.published', reversed:'fin.status.reversed', discarded:'fin.status.discarded' };
  return map[status] ? t(map[status]) : status;
}
export function badge(status, label){
  const cls = STATUS_CLASS[status] || 'st-draft';
  return `<span class="badge ${cls}"><span class="dot" aria-hidden="true"></span>${esc(label ?? statusLabel(status))}</span>`;
}
export function plainBadge(label){ return `<span class="badge"><span class="dot" aria-hidden="true"></span>${esc(label)}</span>`; }
