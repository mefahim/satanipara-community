// Toasts v2: bottom-centre mobile / bottom-right desktop; surface, radius 12px,
// shadow; icon + one sentence using the action's verb; auto-dismiss 5s;
// role="status"; dismiss 44px. Message is inserted as TEXT (audit D-26 fix):
// callers pass t() strings, never HTML.
export function toast(message){
  const region = document.getElementById('toasts');
  if(!region) return;
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status');
  const mark = document.createElement('span'); mark.setAttribute('aria-hidden', 'true'); mark.textContent = '✓';
  const text = document.createElement('span'); text.textContent = String(message ?? '');
  const btn = document.createElement('button'); btn.type = 'button'; btn.setAttribute('aria-label', 'Dismiss'); btn.textContent = '✕';
  el.append(mark, text, btn);
  const kill = () => el.remove();
  btn.addEventListener('click', kill);
  region.appendChild(el);
  setTimeout(kill, 5000);
}
