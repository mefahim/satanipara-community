// Toasts: bottom-centre mobile / bottom-right desktop; surface, radius 12px, shadow;
// icon + one sentence using the action's verb; auto-dismiss 5s; role="status"; dismiss 44px.
export function toast(message){
  const region = document.getElementById('toasts');
  if(!region) return;
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status');
  el.innerHTML = `<span aria-hidden="true">✓</span><span>${message}</span><button type="button" aria-label="Dismiss">✕</button>`;
  const kill = () => el.remove();
  el.querySelector('button').addEventListener('click', kill);
  region.appendChild(el);
  setTimeout(kill, 5000);
}
