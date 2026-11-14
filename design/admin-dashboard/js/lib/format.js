// format.js — BDT, Asia/Dhaka dates, phone masking, Request IDs, numerals.
import { t } from '../i18n.js';
// Numerals/dates/money are FORMATTED, not translated (audit §3.6).
// now() is the SINGLE live clock for the whole prototype (DS v2, audit D-03):
// every staleness / availability computation must call now(), never a frozen date.
export function now(){ return new Date(); }
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export function toBnNumerals(s){ return String(s).replace(/[0-9]/g, d => BN_DIGITS[+d]); }
export function fmtNum(n, lang){ return lang === 'bn' ? toBnNumerals(String(n)) : String(n); }
export function fmtBDT(amount, lang){
  const abs = Math.abs(amount);
  const grouped = abs.toLocaleString('en-IN');
  const sign = amount < 0 ? '−' : '';
  return lang === 'bn' ? `${sign}৳${toBnNumerals(grouped)}` : `${sign}৳${grouped}`;
}
export function fmtDate(iso, lang){
  if(!iso) return '';
  const d = new Date(iso);
  const opts = { timeZone:'Asia/Dhaka', year:'numeric', month:'short', day:'numeric' };
  try { return lang === 'bn' ? d.toLocaleDateString('bn-BD', opts) : d.toLocaleDateString('en-GB', opts); }
  catch { return d.toISOString().slice(0,10); }
}
export function fmtDateTime(iso, lang){
  if(!iso) return '';
  const d = new Date(iso);
  const opts = { timeZone:'Asia/Dhaka', year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' };
  try { return lang === 'bn' ? d.toLocaleString('bn-BD', opts) : d.toLocaleString('en-GB', opts); }
  catch { return iso; }
}
export function donorAvailable(donor, asOf = now()){
  // 90-day rule (moved from js/data/demo-blood.js, G4-3 / audit D-11): pure logic, not data.
  if(!donor.consent_to_list) return false;
  if(!donor.last_donation_date) return true;
  const last = new Date(donor.last_donation_date + 'T00:00:00+06:00');
  return (asOf - last) / 86400000 >= 90;
}
export function fmtAgo(iso, lang){
  // Shared relative time (G4-2): was screen-local relAgo() in views/expatriate.js.
  if(!iso) return '';
  const ms = now() - new Date(iso).getTime();
  if(!(ms >= 0)) return fmtDateTime(iso, lang);
  const mins = Math.floor(ms / 60000);
  if(mins < 1) return t('expatriate.detail.agoJustNow');
  if(mins < 60) return t('expatriate.detail.agoMinutes').replace('{n}', fmtNum(mins, lang));
  const hrs = Math.floor(mins / 60);
  if(hrs < 24) return t('expatriate.detail.agoHours').replace('{n}', fmtNum(hrs, lang));
  return t('expatriate.detail.agoDays').replace('{n}', fmtNum(Math.floor(hrs / 24), lang));
}
export function fmtPhoneMasked(phone){ if(!phone) return ''; return phone.length > 5 ? phone.slice(0,5) + '•••' + phone.slice(-2) : phone; }
export function fmtPhoneFull(phone){ return phone || ''; }
export function fmtRequestNo(no){ return no || ''; } // Latin only, tabular, tracking via CSS .num
export function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
