// auth.js — demo login/session, client-side ONLY, labelled simulated. No real authentication.
// Demo credentials (FRESH — never the Direction D logins): see login view / README.
import { store } from './store.js';
const DEMO_ACCOUNTS = [
  { phone:'01990000000', password:'AdminDemo-2026', userId:'u-sa1' },
  { phone:'01990000002', password:'AdminDemo-2026b', userId:'u-sa2' },
  { phone:'01990000001', password:'HelperDemo-2026', userId:'u-h1' }
];
let session = null; // { user, startedAt } — in-memory only; reload resets.
const failures = new Map(); // phone -> { count, lockedUntil }
export function getSession(){ return session; }
export function getUser(){ return session ? session.user : null; }
export function isLocked(phone){
  const f = failures.get(phone);
  return f && f.lockedUntil && Date.now() < f.lockedUntil;
}
export function login(phone, password){
  const p = String(phone || '').trim();
  if(isLocked(p)) return { ok:false, error:'locked' };
  const acct = DEMO_ACCOUNTS.find(a => a.phone === p && a.password === password);
  if(!acct){
    const f = failures.get(p) || { count:0, lockedUntil:0 };
    f.count += 1;
    if(f.count >= 5) f.lockedUntil = Date.now() + 30*60*1000; // simulated 30-min lock
    failures.set(p, f);
    return { ok:false, error: f.count >= 5 ? 'locked' : 'failed', attempts: f.count };
  }
  failures.delete(p);
  const user = store.users.find(u => u.id === acct.userId);
  session = { user, startedAt: Date.now() };
  return { ok:true, user };
}
export function logout(){ session = null; }
// DEMO role switch (labelled simulated): re-renders shell nav and re-runs the route guard.
// The real system has no such control — roles are server-assigned.
// D9: switchRole(role, userId?) — with a userId it switches to that exact demo account
// (so SA2 is selectable); without one it keeps the old first-match behaviour.
// switchUser(userId) switches to any demo account by id (SA1 / SA2 / Helper).
export function switchRole(role, userId){
  if(!session) return null;
  const target = userId
    ? store.users.find(u => u.id === userId && u.role === role && u.status === 'active')
    : store.users.find(u => u.role === role && u.status === 'active');
  if(!target) return null;
  session = { user: target, startedAt: session.startedAt };
  return session.user;
}
export function switchUser(userId){
  if(!session) return null;
  const target = store.users.find(u => u.id === userId && u.status === 'active');
  if(!target) return null;
  session = { user: target, startedAt: session.startedAt };
  return session.user;
}
export function resetFailures(phone){ failures.delete(phone); }
