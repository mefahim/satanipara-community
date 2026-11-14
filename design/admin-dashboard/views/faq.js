// faq.js — FAQ list + editor: question/answer BN/EN, category, order, search.
// All data DEMO-labelled. No backend calls.
import { t, getLang, registerStrings } from '../js/i18n.js';
import { store, filterList, writeAudit } from '../js/lib/store.js';
import { fmtNum, esc } from '../js/lib/format.js';
import { plainBadge } from '../js/components/badges.js';
import { renderTable, bindTableRows } from '../js/components/table.js';
import { renderFilters, bindFilters } from '../js/components/filters.js';
import { field } from '../js/components/forms.js';
import { emptyState } from '../js/components/states.js';
const STRINGS = {
bn: {
'list.title':'সাধারণ জিজ্ঞাসা (FAQ)', 'list.new':'নতুন প্রশ্ন', 'list.colQuestion':'প্রশ্ন', 'list.colCategory':'বিভাগ', 'list.colOrder':'ক্রম', 'list.searchHint':'প্রশ্ন খুঁজুন',
'cat.membership':'সদস্যপদ', 'cat.expatriate':'প্রবাসী সহায়তা', 'cat.blood':'রক্তদান', 'cat.finance':'অর্থ', 'cat.privacy':'তথ্য-গোপনীয়তা', 'cat.emergency':'জরুরি',
'act.edit':'সম্পাদনা', 'act.delete':'মুছুন', 'act.save':'সংরক্ষণ করুন', 'act.cancel':'বাতিল',
'msg.saved':'সংরক্ষণ করা হয়েছে।', 'msg.deleted':'মুছে ফেলা হয়েছে।',
'confirm.deleteBody':'এই প্রশ্নোত্তরটি মুছে ফেলা হবে।',
'edit.questionBn':'প্রশ্ন (বাংলা)', 'edit.questionEn':'প্রশ্ন (ইংরেজি)', 'edit.answerBn':'উত্তর (বাংলা)', 'edit.answerEn':'উত্তর (ইংরেজি)', 'edit.category':'বিভাগ', 'edit.order':'ক্রম', 'edit.required':'প্রশ্ন (বাংলা) ও উত্তর (বাংলা) আবশ্যক।', 'edit.newTitle':'নতুন প্রশ্ন', 'edit.editTitle':'প্রশ্ন সম্পাদনা',
'list.note':'প্রশ্নোত্তর ক্রম অনুযায়ী জনসমক্ষে দেখানো হয়।'
},
en: {
'list.title':'Frequently asked questions (FAQ)', 'list.new':'New question', 'list.colQuestion':'Question', 'list.colCategory':'Category', 'list.colOrder':'Order', 'list.searchHint':'Search questions',
'cat.membership':'Membership', 'cat.expatriate':'Expatriate support', 'cat.blood':'Blood donation', 'cat.finance':'Finance', 'cat.privacy':'Privacy', 'cat.emergency':'Emergency',
'act.edit':'Edit', 'act.delete':'Delete', 'act.save':'Save', 'act.cancel':'Cancel',
'msg.saved':'Saved.', 'msg.deleted':'Deleted.',
'confirm.deleteBody':'This Q&A will be deleted.',
'edit.questionBn':'Question (Bengali)', 'edit.questionEn':'Question (English)', 'edit.answerBn':'Answer (Bengali)', 'edit.answerEn':'Answer (English)', 'edit.category':'Category', 'edit.order':'Order', 'edit.required':'Question (Bengali) and answer (Bengali) are required.', 'edit.newTitle':'New question', 'edit.editTitle':'Edit question',
'list.note':'Questions are shown publicly in order.'
}};
registerStrings('faq', STRINGS);
const CATS = [['membership','faq.cat.membership'], ['expatriate','faq.cat.expatriate'], ['blood','faq.cat.blood'], ['finance','faq.cat.finance'], ['privacy','faq.cat.privacy'], ['emergency','faq.cat.emergency']];
function catLabel(c){ const f = CATS.find(x => x[0] === c); return f ? t(f[1]) : c; }
function qOf(f, lang){ return lang === 'bn' ? (f.question_bn || f.question_en || '') : (f.question_en || f.question_bn || ''); }
function aOf(f, lang){ return lang === 'bn' ? (f.answer_bn || f.answer_en || '') : (f.answer_en || f.answer_bn || ''); }
function setHash(path, query){ const qs = new URLSearchParams(query).toString(); location.hash = '#' + path + (qs ? '?' + qs : ''); }
export const Faq = {
  route: '#/faq',
  title: { bn: 'সাধারণ জিজ্ঞাসা', en: 'FAQ' },
  breadcrumb: ['nav.dashboard', 'nav.faq'],
  roles: ['super-admin'],
  permissions: ['faq.manage'],
  render(ctx){
    const lang = getLang();
    ctx.shell.setTitle(t('faq.list.title'));
    const q = ctx.query.q || '';
    const catF = ctx.query.category || 'all';
    let rows = filterList(store.faqs, { q, fields: ['question_bn', 'question_en', 'answer_bn', 'answer_en'] });
    if(catF !== 'all') rows = rows.filter(f => f.category === catF);
    rows.sort((a, b) => (a.order || 0) - (b.order || 0));
    const editId = ctx.query.edit || null;
    const isNew = ctx.query.new === '1';
    const editing = isNew ? {} : (editId ? store.faqs.find(f => f.id === editId) : null);
    const chips = [{ value:'all', label:t('common.viewAll') }, ...CATS.map(([v, k]) => ({ value: v, label: t(k) }))];
    return `<span class="demo-badge">${t('app.demo')}</span>
    <div class="view-head"><div><h1>${t('faq.list.title')}</h1><p class="sub">${t('faq.list.note')}</p></div>
    <div><a class="btn btn-primary" href="#/faq?new=1">${t('faq.list.new')}</a></div></div>
    ${editing || isNew ? editorHtml(ctx, lang, editing, isNew) : ''}
    ${renderFilters({ q, chips, activeChip: catF })}
    ${rows.length ? renderTable({ columns: [
      { key:'order', label:t('faq.list.colOrder'), render: r => fmtNum(r.order ?? 0, lang) },
      { key:'question_bn', label:t('faq.list.colQuestion'), render: r => `<strong>${esc(qOf(r, lang))}</strong><br><span class="small muted">${esc(aOf(r, lang).slice(0, 120))}</span>` },
      { key:'category', label:t('faq.list.colCategory'), render: r => plainBadge(catLabel(r.category)) },
      { key:'actions', label:'', render: r => `<a class="btn btn-secondary btn-sm" href="#/faq?edit=${r.id}">${t('faq.act.edit')}</a> <button type="button" class="btn btn-ghost btn-sm" data-act="delete" data-id="${r.id}">${t('faq.act.delete')}</button>` }
    ], rows, page: parseInt(ctx.query.page || '1', 10), perPage: 20, stacked: true }) : emptyState(t('common.empty'), t('faq.list.new'), '#/faq?new=1')}`;
  },
  onMount(ctx){
    const root = document.getElementById('view');
    bindTableRows(root);
    bindFilters(root, {
      onSearch: v => { const q = { ...ctx.query, q: v, page: '1' }; delete q.edit; delete q.new; if(!v) delete q.q; setHash(ctx.path, q); },
      onChip: v => { const q = { ...ctx.query, category: v, page: '1' }; delete q.edit; delete q.new; if(v === 'all') delete q.category; setHash(ctx.path, q); },
      onClear: () => setHash(ctx.path, {})
    });
    root.querySelectorAll('[data-act="delete"]').forEach(b => b.addEventListener('click', () => {
      const f = store.faqs.find(x => x.id === b.dataset.id);
      if(!f) return;
      ctx.modal({ title: t('faq.act.delete'), body: `<p>${t('faq.confirm.deleteBody')}</p><p class="small muted">${esc(f.question_bn)}</p>`, confirmLabel: t('faq.act.delete'), danger: true, onConfirm: () => { store.faqs = store.faqs.filter(x => x.id !== f.id); writeAudit(ctx.user.id, ctx.role, 'faq.delete', 'faq', f.id, 'active', 'deleted'); ctx.toast(t('faq.msg.deleted')); location.hash = '#/faq'; ctx.rerender && ctx.rerender(); } });
    }));
    const form = root.querySelector('#faq-form');
    if(form) form.addEventListener('submit', e => { e.preventDefault(); saveForm(ctx, form); });
  },
  onUnmount(){}
};
function editorHtml(ctx, lang, f, isNew){
  const v = f || {};
  return `<form id="faq-form" class="card" data-id="${v.id || ''}" novalidate>
  <h3>${isNew ? t('faq.edit.newTitle') : t('faq.edit.editTitle')}</h3>
  ${field({ id:'fq-q-bn', label:t('faq.edit.questionBn'), value: v.question_bn || '', required: true })}
  ${field({ id:'fq-q-en', label:t('faq.edit.questionEn'), value: v.question_en || '' })}
  <div class="field"><label for="fq-a-bn">${t('faq.edit.answerBn')} *</label><textarea id="fq-a-bn" class="input" rows="3">${esc(v.answer_bn || '')}</textarea></div>
  <div class="field"><label for="fq-a-en">${t('faq.edit.answerEn')}</label><textarea id="fq-a-en" class="input" rows="3">${esc(v.answer_en || '')}</textarea></div>
  <div class="field"><label for="fq-cat">${t('faq.edit.category')}</label><select id="fq-cat" class="input">${CATS.map(([cv, k]) => `<option value="${cv}"${v.category === cv ? ' selected' : ''}>${t(k)}</option>`).join('')}</select></div>
  ${field({ id:'fq-order', label:t('faq.edit.order'), type:'number', value: v.order ?? (store.faqs.length + 1) })}
  <div class="error" id="form-err" hidden>${t('faq.edit.required')}</div>
  <div class="row mt-4"><button type="submit" class="btn btn-primary">${t('faq.act.save')}</button>
  <a class="btn btn-ghost" href="#/faq">${t('faq.act.cancel')}</a></div></form>`;
}
function saveForm(ctx, form){
  const id = form.dataset.id;
  const qBn = form.querySelector('#fq-q-bn').value.trim();
  const aBn = form.querySelector('#fq-a-bn').value.trim();
  const err = document.getElementById('form-err');
  if(!qBn || !aBn){ err.hidden = false; form.querySelector('#fq-q-bn').focus(); return; }
  const val = s => { const el = form.querySelector(s); return el ? el.value.trim() : ''; };
  const data = { question_bn: qBn, question_en: val('#fq-q-en'), answer_bn: aBn, answer_en: val('#fq-a-en'), category: val('#fq-cat') || 'other', order: parseInt(val('#fq-order'), 10) || 1 };
  if(id){ const f = store.faqs.find(x => x.id === id); if(f){ Object.assign(f, data); writeAudit(ctx.user.id, ctx.role, 'faq.update', 'faq', id, null, data.question_bn); } }
  else { store.faqs.push({ id:'faq-' + Date.now(), ...data }); writeAudit(ctx.user.id, ctx.role, 'faq.create', 'faq', data.question_bn, null, 'created'); }
  ctx.toast(t('faq.msg.saved'));
  location.hash = '#/faq';
}
