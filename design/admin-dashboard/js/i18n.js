// i18n: t() lookup, BN/EN toggle, registerStrings(namespace, {bn,en}) for view modules.
// BN is the default and the fallback. Session-only; reload resets to BN (Q-20 open).
import { bn } from './i18n/bn.js';
import { en } from './i18n/en.js';
const base = { bn, en };
const extra = { bn: {}, en: {} }; // namespaced view strings, registered by view modules
let lang = 'bn';
export function getLang(){ return lang; }
export function setLang(l){ lang = (l === 'en') ? 'en' : 'bn'; document.documentElement.lang = lang === 'bn' ? 'bn' : 'en'; }
export function registerStrings(namespace, strings){
  if(!strings || typeof strings !== 'object') return;
  for(const l of ['bn','en']){
    if(strings[l]) for(const [k,v] of Object.entries(strings[l])) extra[l][namespace + '.' + k] = v;
  }
}
export function t(key){
  const dict = lang === 'en' ? en : bn;
  const ex = lang === 'en' ? extra.en : extra.bn;
  if(key in ex) return ex[key];
  if(key in dict) return dict[key];
  // Fallback is BN, never the key, never English.
  const bx = extra.bn[key]; if(bx !== undefined) return bx;
  if(key in bn) return bn[key];
  return bn[key] ?? key;
}
export function applyI18n(root = document){
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
}
