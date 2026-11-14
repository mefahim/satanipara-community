// Timeline (Meridian): vertical 1px gold line, 4 nodes (Pending/Accepted/In Progress/Completed);
// completed = filled forest circle + check; current = gold ring + pulsing dot + "চলমান" label;
// upcoming = hollow neutral circle; timestamps under completed nodes; closed = completion banner;
// rejected/cancelled = terminal-state notice replacing the timeline; aria-live="polite".
import { t } from '../i18n.js';
import { fmtDateTime, esc } from '../lib/format.js';
const STEPS = ['pending','accepted','in_progress','completed'];
const ORDER = { pending:0, accepted:1, in_progress:2, completed:3, closed:4, rejected:-1, cancelled:-1 };
export function meridianTimeline(request, lang, stepTimes){
  if(request.status === 'rejected' || request.status === 'cancelled'){
    const reason = request.rejection_reason_bn || request.cancellation_reason_bn || '';
    return `<div class="error-box" aria-live="polite"><strong>${t('exp.status.' + request.status)}</strong>${reason ? `<p class="mt-4">${esc(reason)}</p>` : ''}</div>`;
  }
  const current = ORDER[request.status] ?? 0;
  const items = STEPS.map((s, i) => {
    const cls = i < current ? 'done' : (i === current ? 'current' : '');
    const mark = i < current ? '✓' : '';
    const live = i === current ? `<div class="small muted">${t('timeline.current')}</div>` : '';
    return `<li class="${cls}"><span class="node" aria-hidden="true">${mark}</span>
      <div class="m-label">${t('exp.status.' + s)}</div>${live}
      ${i < current ? `<div class="m-time">${fmtDateTime((stepTimes && stepTimes[s]) || request.created_at, lang)}</div>` : ''}</li>`;
  }).join('');
  const closed = request.status === 'closed' ? `<div class="card"><strong>${t('exp.status.closed')}</strong><p class="small muted">${t('timeline.closedByApplicant')}</p></div>` : '';
  return `<ol class="meridian" aria-live="polite">${items}</ol>${closed}`;
}
