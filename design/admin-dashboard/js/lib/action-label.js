// action-label.js — human-readable label for audit action codes (audit D-10).
// Moved out of views/audit.js so views/dashboard.js no longer imports a view
// module. The audit.action.* strings live in the base i18n dicts (merged by
// the integrator), so this works without loading views/audit.js. Unknown codes
// fall back to the raw code, never to a bare translation key.
import { t } from '../i18n.js';
export function actionLabel(action){
  const key = 'audit.action.' + action;
  const v = t(key);
  return v === key ? action : v;
}
