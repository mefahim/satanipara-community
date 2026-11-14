// format.js — BDT, Asia/Dhaka dates, phone masking, Request IDs, numerals.
// Numerals/dates/money are FORMATTED, not translated (audit §3.6).
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
export function fmtPhoneMasked(phone){ if(!phone) return ''; return phone.length > 5 ? phone.slice(0,5) + '•••' + phone.slice(-2) : phone; }
export function fmtPhoneFull(phone){ return phone || ''; }
export function fmtRequestNo(no){ return no || ''; } // Latin only, tabular, tracking via CSS .num
export function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
