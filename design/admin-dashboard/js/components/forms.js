// Form controls: 48px, radius 12px, 1px line-strong border, visible <label> above every field,
// helper text beneath, focus 2px moss outline + 2px offset; validation on blur
// (error under field, cause + fix); failed submit -> focusable error summary linking to fields.
import { esc } from '../lib/format.js';
import { t } from '../i18n.js';
export function field({ id, label, hint = '', error = '', type = 'text', value = '', required = false, attrs = '' }){
  return `<div class="field"><label for="${id}">${esc(label)}${required ? ' *' : ''}</label>
  <input id="${id}" name="${id}" type="${type}" class="input" value="${esc(value)}" ${required ? 'required' : ''} ${error ? 'aria-invalid="true" aria-describedby="' + id + '-err"' : ''} ${attrs}>
  ${hint ? `<div class="hint">${esc(hint)}</div>` : ''}${error ? `<div class="error" id="${id}-err">${esc(error)}</div>` : ''}</div>`;
}
export function errorSummary(errors){
  if(!errors || !errors.length) return '';
  return `<div class="error-summary" tabindex="-1" role="alert"><strong>${esc(errors.length + ' ')}${t('common.required')}</strong><ul>${errors.map(e => `<li><a href="#${e.id}">${esc(e.message)}</a></li>`).join('')}</ul></div>`;
}
export function validateRequired(value, minLen = 1){
  return String(value || '').trim().length >= minLen;
}
