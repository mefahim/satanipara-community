// Stat card (DS v2, audit D-13): THE one stat-card implementation. Views used to
// hand-roll this in 8 places (two with their own Bengali-digit conversion).
// Use statCard() / statGrid() everywhere; pass pre-formatted numbers (fmtNum /
// fmtBDT) — this component never formats. `href` makes the whole card a link;
// without it the card is a plain <div>.
import { esc } from '../lib/format.js';
export function statCard({ href, num, label }){
  const inner = `<span class="num">${num}</span><span class="lbl">${esc(label)}</span>`;
  return href
    ? `<a class="stat" href="${esc(href)}">${inner}</a>`
    : `<div class="stat">${inner}</div>`;
}
export function statGrid(items){
  return `<div class="stat-grid">${items.map(statCard).join('')}</div>`;
}
