// DEMO data only. Figures are internally consistent: rows sum to the shown totals.
// 2026 published income — first 4 rows = ৳230,000 (home preview); all 5 rows = ৳320,000 (full year).
// 120,000 + 60,000 + 30,000 + 20,000 = 230,000; + 90,000 = 320,000.
export const DEMO = true;
export const finance_categories = [
  { id:'fc-1', name_bn:'অনুদান', name_en:'Donation', kind:'donation', active:true },
  { id:'fc-2', name_bn:'সদস্য চাঁদা', name_en:'Membership fee', kind:'income', active:true },
  { id:'fc-3', name_bn:'কার্যক্রম ব্যয়', name_en:'Activity expense', kind:'expense', active:true },
  { id:'fc-4', name_bn:'প্রশাসনিক ব্যয়', name_en:'Admin expense', kind:'expense', active:true }
];
// No stored `spent` on projects: spent is COMPUTED on read in views/finance-reports.js
// as the sum of the project's linked PUBLISHED expense entries (expense amounts are
// negative, so spent = -sum). A stored spent drifted from the ledger (was 90000/60000/80000)
// and is deliberately not kept. Seed check 2026-11-14: pj-1 ৳0 (its only linked expense,
// LE-2026-0006, is a draft), pj-2 ৳25,000 (LE-2025-0002), pj-3 ৳0.
export const projects = [
  { id:'pj-1', name_bn:'বৃত্তি তহবিল (ডেমো)', name_en:'Scholarship fund (Demo)', budget:150000, status:'active' },
  { id:'pj-2', name_bn:'শীতবস্ত্র তহবিল (ডেমো)', name_en:'Winter clothing fund (Demo)', budget:100000, status:'active' },
  { id:'pj-3', name_bn:'চিকিৎসা তহবিল (ডেমো)', name_en:'Medical fund (Demo)', budget:80000, status:'completed' }
];
export const ledger_entries = [
  { entry_no:'LE-2026-0001', entry_date:'2026-01-15', kind:'donation', category:'fc-1', project_id:null, item_bn:'অনুদান — জানুয়ারি (ডেমো)', item_en:'Donation — January (Demo)', amount:120000, payee_bn:'দাতা (ডেমো)', voucher:'ভাউচার LE-2026-0001', status:'published', entered_by:'u-sa2', approved_by:'u-sa1', approved_at:'2026-01-16T10:00:00+06:00' },
  { entry_no:'LE-2026-0002', entry_date:'2026-03-10', kind:'donation', category:'fc-1', project_id:null, item_bn:'অনুদান — মার্চ (ডেমো)', item_en:'Donation — March (Demo)', amount:60000, payee_bn:'দাতা (ডেমো)', voucher:'ভাউচার LE-2026-0002', status:'published', entered_by:'u-sa2', approved_by:'u-sa1', approved_at:'2026-03-11T10:00:00+06:00' },
  { entry_no:'LE-2026-0003', entry_date:'2026-06-05', kind:'income', category:'fc-2', project_id:null, item_bn:'সদস্য চাঁদা — জুন (ডেমো)', item_en:'Membership fees — June (Demo)', amount:30000, payee_bn:'সদস্যবৃন্দ (ডেমো)', voucher:'ভাউচার LE-2026-0003', status:'published', entered_by:'u-sa1', approved_by:'u-sa2', approved_at:'2026-06-06T10:00:00+06:00' },
  { entry_no:'LE-2026-0004', entry_date:'2026-09-12', kind:'income', category:'fc-2', project_id:null, item_bn:'সদস্য চাঁদা — সেপ্টেম্বর (ডেমো)', item_en:'Membership fees — September (Demo)', amount:20000, payee_bn:'সদস্যবৃন্দ (ডেমো)', voucher:'ভাউচার LE-2026-0004', status:'published', entered_by:'u-sa2', approved_by:'u-sa1', approved_at:'2026-09-13T10:00:00+06:00' },
  { entry_no:'LE-2026-0005', entry_date:'2026-11-01', kind:'donation', category:'fc-1', project_id:null, item_bn:'অনুদান — নভেম্বর (ডেমো)', item_en:'Donation — November (Demo)', amount:90000, payee_bn:'দাতা (ডেমো)', voucher:'ভাউচার LE-2026-0005', status:'published', entered_by:'u-sa1', approved_by:'u-sa2', approved_at:'2026-11-02T10:00:00+06:00' },
  { entry_no:'LE-2026-0006', entry_date:'2026-11-13', kind:'expense', category:'fc-3', project_id:'pj-1', item_bn:'বৃত্তি কার্যক্রম ব্যয় (ডেমো)', item_en:'Scholarship activity expense (Demo)', amount:-15000, payee_bn:'সরবরাহকারী (ডেমো)', voucher:'ভাউচার LE-2026-0006', status:'draft', entered_by:'u-sa1', approved_by:null, approved_at:null },
  { entry_no:'LE-2026-0007', entry_date:'2026-11-12', kind:'expense', category:'fc-4', project_id:null, item_bn:'প্রশাসনিক ব্যয় (ডেমো)', item_en:'Admin expense (Demo)', amount:-8500, payee_bn:'সরবরাহকারী (ডেমো)', voucher:'ভাউচার LE-2026-0007', status:'draft', entered_by:'u-sa2', approved_by:null, approved_at:null },
  { entry_no:'LE-2025-0001', entry_date:'2025-05-10', kind:'income', category:'fc-2', project_id:null, item_bn:'সদস্য চাঁদা ২০২৫ (ডেমো)', item_en:'Membership fees 2025 (Demo)', amount:45000, payee_bn:'সদস্যবৃন্দ (ডেমো)', voucher:'ভাউচার LE-2025-0001', status:'published', entered_by:'u-sa1', approved_by:'u-sa2', approved_at:'2025-05-11T10:00:00+06:00' },
  { entry_no:'LE-2025-0002', entry_date:'2025-08-20', kind:'expense', category:'fc-3', project_id:'pj-2', item_bn:'শীতবস্ত্র ব্যয় (ডেমো)', item_en:'Winter clothing expense (Demo)', amount:-25000, payee_bn:'সরবরাহকারী (ডেমো)', voucher:'ভাউচার LE-2025-0002', status:'published', entered_by:'u-sa2', approved_by:'u-sa1', approved_at:'2025-08-21T10:00:00+06:00' },
  { entry_no:'LE-2025-0003', entry_date:'2025-11-05', kind:'donation', category:'fc-1', project_id:null, item_bn:'অনুদান ২০২৫ (ডেমো)', item_en:'Donation 2025 (Demo)', amount:40000, payee_bn:'দাতা (ডেমো)', voucher:'ভাউচার LE-2025-0003', status:'rejected', entered_by:'u-sa1', approved_by:null, approved_at:null, rejection_reason_bn:'ভাউচার যাচাই হয়নি।' },
  { entry_no:'LE-2025-0004', entry_date:'2025-03-15', kind:'income', category:'fc-2', project_id:null, item_bn:'সদস্য চাঁদা — মার্চ ২০২৫ (ডেমো)', item_en:'Membership fees — March 2025 (Demo)', amount:30000, payee_bn:'সদস্যবৃন্দ (ডেমো)', voucher:'ভাউচার LE-2025-0004', status:'reversed', entered_by:'u-sa2', approved_by:'u-sa1', approved_at:'2025-03-16T10:00:00+06:00' },
  { entry_no:'LE-2025-0005', entry_date:'2025-04-02', kind:'income', category:'fc-2', project_id:null, item_bn:'বিপরীত এন্ট্রি — LE-2025-0004 (ডেমো)', item_en:'Reversal of LE-2025-0004 (Demo)', amount:-30000, payee_bn:'সদস্যবৃন্দ (ডেমো)', voucher:'ভাউচার LE-2025-0005', status:'published', entered_by:'u-sa1', approved_by:'u-sa2', approved_at:'2025-04-03T10:00:00+06:00', reverses:'LE-2025-0004' },
  { entry_no:'LE-2024-0001', entry_date:'2024-06-10', kind:'donation', category:'fc-1', project_id:null, item_bn:'অনুদান ২০২৪ (ডেমো)', item_en:'Donation 2024 (Demo)', amount:40000, payee_bn:'দাতা (ডেমো)', voucher:'ভাউচার LE-2024-0001', status:'published', entered_by:'u-sa1', approved_by:'u-sa2', approved_at:'2024-06-11T10:00:00+06:00' },
  { entry_no:'LE-2024-0002', entry_date:'2024-09-01', kind:'expense', category:'fc-4', project_id:null, item_bn:'প্রশাসনিক ব্যয় ২০২৪ (ডেমো)', item_en:'Admin expense 2024 (Demo)', amount:-12000, payee_bn:'সরবরাহকারী (ডেমো)', voucher:'ভাউচার LE-2024-0002', status:'discarded', entered_by:'u-sa2', approved_by:null, approved_at:null, discard_reason_bn:'ভুল এন্ট্রি — নতুন এন্ট্রি দিয়ে সংশোধন করা হয়েছে।' }
];
// Status counts: published 8, draft 2, rejected 1, discarded 1, reversed 1, reversal (published) 1 = 14 entries.
// LE-2026-0006 was entered by the LOGGED-IN demo Super Admin (u-sa1) — self-approval is blocked (dual control).
export const ledger_reversals = [
  { id:'rev-1', original_entry_no:'LE-2025-0004', reversal_entry_no:'LE-2025-0005', created_by:'u-sa1', approved_by:'u-sa2', approved_at:'2025-04-03T10:00:00+06:00' }
];
export const annual_reports = [
  { id:'ar-2025', year:2025, title_bn:'বার্ষিক প্রতিবেদন ২০২৫ (ডেমো)', title_en:'Annual report 2025 (Demo)', audited:false, status:'published', published_at:'2026-01-20T10:00:00+06:00' },
  { id:'ar-2024', year:2024, title_bn:'বার্ষিক প্রতিবেদন ২০২৪ (ডেমো)', title_en:'Annual report 2024 (Demo)', audited:false, status:'published', published_at:'2025-01-18T10:00:00+06:00' }
];
