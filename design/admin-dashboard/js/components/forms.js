// Form controls v2: 48px, radius 12px, 1px line-strong border, visible <label>
// above every field, helper text beneath, focus ring token; validation on blur
// (error under field, cause + fix); failed submit -> focusable error summary
// linking to fields. field() now also renders <textarea> (type:'textarea') and
// <select> (options:[{value,label}]) — use the CORRECT input type per field.
import { esc } from '../lib/format.js';
import { t } from '../i18n.js';
export function field({ id, label, hint = '', error = '', type = 'text', value = '', required = false, attrs = '', options = null, rows = 3 }){
  const invalid = error ? 'aria-invalid="true" aria-describedby="' + id + '-err"' : '';
  const req = required ? 'required' : '';
  let control;
  if(options){
    control = `<select id="${id}" name="${id}" class="input" ${req} ${invalid} ${attrs}>${options.map(o => `<option value="${esc(o.value)}"${String(o.value) === String(value) ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
  } else if(type === 'textarea'){
    control = `<textarea id="${id}" name="${id}" class="input" rows="${rows}" ${req} ${invalid} ${attrs}>${esc(value)}</textarea>`;
  } else {
    control = `<input id="${id}" name="${id}" type="${type}" class="input" value="${esc(value)}" ${req} ${invalid} ${attrs}>`;
  }
  return `<div class="field"><label for="${id}">${esc(label)}${required ? ' *' : ''}</label>
  ${control}
  ${hint ? `<div class="hint">${esc(hint)}</div>` : ''}${error ? `<div class="error" id="${id}-err">${esc(error)}</div>` : ''}</div>`;
}
export function errorSummary(errors){
  if(!errors || !errors.length) return '';
  return `<div class="error-summary" tabindex="-1" role="alert"><strong>${esc(errors.length + ' ')}${t('common.required')}</strong><ul>${errors.map(e => `<li><a href="#${e.id}">${esc(e.message)}</a></li>`).join('')}</ul></div>`;
}
export function validateRequired(value, minLen = 1){
  return String(value || '').trim().length >= minLen;
}
