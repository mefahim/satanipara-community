// DEMO data only.
export const DEMO = true;
export const notifications = [
  { id:'n-1', user_id:'u-sa1', title_bn:'নতুন প্রবাসী অনুরোধ', title_en:'New expatriate request', body_bn:'EXP-2026-0014 — সাধারণ সহায়তার নতুন অনুরোধ এসেছে।', type:'expatriate', related:'#/expatriate/EXP-2026-0014', read:false, created_at:'2026-11-14T10:00:00+06:00' },
  { id:'n-2', user_id:'u-sa1', title_bn:'সদস্য অনুমোদন অপেক্ষমাণ', title_en:'Member approval pending', body_bn:'৪টি সদস্য আবেদন অনুমোদনের অপেক্ষায় আছে।', type:'member', related:'#/members?status=pending', read:false, created_at:'2026-11-13T09:00:00+06:00' },
  { id:'n-3', user_id:'u-sa1', title_bn:'অর্থ প্রকাশের অপেক্ষায়', title_en:'Finance awaiting approval', body_bn:'LE-2026-0007 খসড়া অনুমোদনের অপেক্ষায় আছে।', type:'finance', related:'#/finance/pending', read:false, created_at:'2026-11-12T11:00:00+06:00' },
  { id:'n-4', user_id:'u-sa1', title_bn:'জরুরি অনুরোধ', title_en:'Urgent request', body_bn:'EXP-2026-0013 জরুরি হিসেবে চিহ্নিত হয়েছে।', type:'expatriate', related:'#/expatriate/EXP-2026-0013', read:true, created_at:'2026-11-14T07:00:00+06:00' },
  { id:'n-5', user_id:'u-sa1', title_bn:'রক্তের অনুরোধ', title_en:'Blood request', body_bn:'B+ রক্তের অনুরোধ এসেছে।', type:'blood', related:'#/blood/requests', read:true, created_at:'2026-11-12T09:00:00+06:00' },
  { id:'n-6', user_id:'u-sa1', title_bn:'নতুন বার্তা', title_en:'New message', body_bn:'যোগাযোগ ফরমে নতুন বার্তা এসেছে।', type:'message', related:'#/messages', read:true, created_at:'2026-11-11T09:00:00+06:00' },
  { id:'n-7', user_id:'u-sa1', title_bn:'ব্যাকআপ সম্পন্ন', title_en:'Backup completed', body_bn:'সর্বশেষ ব্যাকআপ সফল হয়েছে।', type:'system', related:'#/health', read:true, created_at:'2026-11-13T03:00:00+06:00' },
  { id:'n-8', user_id:'u-sa1', title_bn:'সাপ্তাহিক সারসংক্ষেপ', title_en:'Weekly summary', body_bn:'এই সপ্তাহের সারসংক্ষেপ প্রস্তুত।', type:'system', related:'#/dashboard', read:true, created_at:'2026-11-10T09:00:00+06:00' },
  { id:'n-9', user_id:'u-h1', title_bn:'আপনাকে দায়িত্ব দেওয়া হয়েছে', title_en:'Assigned to you', body_bn:'EXP-2026-0003 আপনাকে দেওয়া হয়েছে।', type:'expatriate', related:'#/expatriate/EXP-2026-0003', read:false, created_at:'2026-11-11T10:00:00+06:00' },
  { id:'n-10', user_id:'u-h1', title_bn:'নতুন অনুরোধ', title_en:'New request', body_bn:'EXP-2026-0014 — নতুন অনুরোধ এসেছে।', type:'expatriate', related:'#/expatriate/EXP-2026-0014', read:false, created_at:'2026-11-14T10:00:00+06:00' },
  { id:'n-11', user_id:'u-h1', title_bn:'জরুরি অনুরোধ', title_en:'Urgent request', body_bn:'EXP-2026-0013 জরুরি হিসেবে চিহ্নিত হয়েছে।', type:'expatriate', related:'#/expatriate/EXP-2026-0013', read:false, created_at:'2026-11-14T07:00:00+06:00' },
  { id:'n-12', user_id:'u-h1', title_bn:'অনুরোধ সম্পন্ন হয়েছে', title_en:'Request completed', body_bn:'EXP-2026-0008 সম্পন্ন হয়েছে।', type:'expatriate', related:'#/expatriate/EXP-2026-0008', read:true, created_at:'2026-11-12T12:00:00+06:00' }
];
export const contact_messages = [
  { id:'msg-1', sender_name_bn:'বার্তা প্রেরক ১ (ডেমো)', phone:'01995000001', message_bn:'সদস্য হওয়ার প্রক্রিয়া জানতে চাই।', status:'new', reply_bn:null, created_at:'2026-11-13T09:00:00+06:00' },
  { id:'msg-2', sender_name_bn:'বার্তা প্রেরক ২ (ডেমো)', phone:'01995000002', message_bn:'প্রবাসী সহায়তা সম্পর্কে জানতে চাই।', status:'new', reply_bn:null, created_at:'2026-11-12T09:00:00+06:00' },
  { id:'msg-3', sender_name_bn:'বার্তা প্রেরক ৩ (ডেমো)', phone:'01995000003', message_bn:'রক্তদাতা নিবন্ধন কীভাবে করব?', status:'read', reply_bn:null, created_at:'2026-11-11T09:00:00+06:00' },
  { id:'msg-4', sender_name_bn:'বার্তা প্রেরক ৪ (ডেমো)', phone:'01995000004', message_bn:'অনুদান দিতে চাই।', status:'read', reply_bn:null, created_at:'2026-11-10T09:00:00+06:00' },
  { id:'msg-5', sender_name_bn:'বার্তা প্রেরক ৫ (ডেমো)', phone:'01995000005', message_bn:'কার্যক্রম সম্পর্কে জানতে চাই।', status:'replied', reply_bn:'ধন্যবাদ, বিস্তারিত জানানো হয়েছে।', created_at:'2026-11-09T09:00:00+06:00' },
  { id:'msg-6', sender_name_bn:'বার্তা প্রেরক ৬ (ডেমো)', phone:'01995000006', message_bn:'যোগাযোগের ঠিকানা জানতে চাই।', status:'resolved', reply_bn:'ঠিকানা জানানো হয়েছে।', created_at:'2026-11-08T09:00:00+06:00' }
];
export const activity_log = [
  { id:'al-1', actor:'u-sa1', actor_role:'super-admin', action:'login', subject_type:'user', subject_id:'u-sa1', old_value:null, new_value:null, ip:'127.0.0.1', created_at:'2026-11-14T08:30:00+06:00' },
  { id:'al-2', actor:'u-sa1', actor_role:'super-admin', action:'member.approve', subject_type:'member', subject_id:'MB-2026-0001', old_value:'pending', new_value:'approved', ip:'127.0.0.1', created_at:'2026-11-13T10:00:00+06:00' },
  { id:'al-3', actor:'u-h1', actor_role:'expatriate-helper', action:'request.transition', subject_type:'service_request', subject_id:'EXP-2026-0006', old_value:'accepted', new_value:'in_progress', ip:'127.0.0.1', created_at:'2026-11-14T08:00:00+06:00' },
  { id:'al-4', actor:'u-sa1', actor_role:'super-admin', action:'finance.publish', subject_type:'ledger_entry', subject_id:'LE-2026-0005', old_value:'draft', new_value:'published', ip:'127.0.0.1', created_at:'2026-11-02T10:00:00+06:00' },
  { id:'al-5', actor:'u-sa2', actor_role:'super-admin', action:'finance.reverse.approve', subject_type:'ledger_entry', subject_id:'LE-2025-0005', old_value:'draft', new_value:'published', ip:'127.0.0.1', created_at:'2025-04-03T10:00:00+06:00' },
  { id:'al-6', actor:'u-sa1', actor_role:'super-admin', action:'blood.consent.grant', subject_type:'blood_request', subject_id:'br-2', old_value:'pending', new_value:'granted', ip:'127.0.0.1', created_at:'2026-11-12T11:00:00+06:00' },
  { id:'al-7', actor:'u-sa1', actor_role:'super-admin', action:'blood.phone.reveal', subject_type:'blood_request', subject_id:'br-2', old_value:null, new_value:'revealed', ip:'127.0.0.1', created_at:'2026-11-12T11:05:00+06:00' },
  { id:'al-8', actor:'u-sa1', actor_role:'super-admin', action:'export.members', subject_type:'members', subject_id:'all', old_value:null, new_value:'csv', ip:'127.0.0.1', created_at:'2026-11-10T10:00:00+06:00' },
  { id:'al-9', actor:'u-sa1', actor_role:'super-admin', action:'settings.change', subject_type:'settings', subject_id:'brand', old_value:'—', new_value:'tagline updated', ip:'127.0.0.1', created_at:'2026-11-09T10:00:00+06:00' },
  { id:'al-10', actor:'u-h1', actor_role:'expatriate-helper', action:'request.complete', subject_type:'service_request', subject_id:'EXP-2026-0008', old_value:'in_progress', new_value:'completed', ip:'127.0.0.1', created_at:'2026-11-12T12:00:00+06:00' }
];
export const settings = {
  brand: { name_bn:'সাতানীপাড়া কমিউনিটি', name_en:'Satanipara Community', tagline_bn:'একটি এলাকা, একটি পরিবার', slogan_bn:'শিক্ষা • ঐক্য • শান্তি • প্রগতি' },
  contact: { address_bn:'তথ্য হালনাগাদ হচ্ছে', phone_bn:'তথ্য হালনাগাদ হচ্ছে', email_bn:'তথ্য হালনাগাদ হচ্ছে', hours_bn:'তথ্য হালনাগাদ হচ্ছে' },
  policy: { no_service_charge_bn:'প্রবাসী সহায়তায় কোনো সেবা মূল্য নেই — শুধু প্রকৃত খরচ ও যাতায়াত আবেদনকারী বহন করেন।', disclaimer_999_bn:'এই সেবা জরুরি সেবার বিকল্প নয় — আগে ৯৯৯-এ কল করুন।', ert_size_bn:'জরুরি সাড়া দল: ৩–৫ জন।' },
  system: { language_default:'bn', theme_default:'light', session_sa_idle_min:30, session_helper_idle_min:120, session_absolute_h:12 }
};
export const data_requests = [
  { id:'dr-1', type:'access', member_id:'m-1', status:'pending', requested_at:'2026-11-12T09:00:00+06:00', grace_ends_at:null },
  { id:'dr-2', type:'correction', member_id:'m-3', status:'in_progress', requested_at:'2026-11-10T09:00:00+06:00', grace_ends_at:null },
  { id:'dr-3', type:'deletion', member_id:'m-11', status:'in_grace', requested_at:'2026-11-01T09:00:00+06:00', grace_ends_at:'2026-12-01T09:00:00+06:00' }
];
