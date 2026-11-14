// DEMO data only. DOB never shown publicly — age band only. Consent withdrawal hides immediately.
export const DEMO = true;
export const households = [
  { id:'hh-1', name_bn:'পরিবার ১ (ডেমো)', name_en:'Household 1 (Demo)', area:'সাতানীপাড়া', members_count:5, visibility:'members-only', consent_status:'granted' },
  { id:'hh-2', name_bn:'পরিবার ২ (ডেমো)', name_en:'Household 2 (Demo)', area:'সাতানীপাড়া', members_count:4, visibility:'public', consent_status:'granted' },
  { id:'hh-3', name_bn:'পরিবার ৩ (ডেমো)', name_en:'Household 3 (Demo)', area:'সাতানীপাড়া', members_count:6, visibility:'private', consent_status:'granted' }
];
export const persons = [
  { id:'p-1', name_bn:'ব্যক্তি ১ (ডেমো)', name_en:'Person 1 (Demo)', area:'সাতানীপাড়া', profession_bn:'শিক্ষক', age_band:'৪০–৪৯', visibility:'public', consent_status:'granted', kind:'person', household_id:'hh-1' },
  { id:'p-2', name_bn:'ব্যক্তি ২ (ডেমো)', name_en:'Person 2 (Demo)', area:'সাতানীপাড়া', profession_bn:'কৃষক', age_band:'৫০–৫৯', visibility:'members-only', consent_status:'granted', kind:'person', household_id:'hh-1' },
  { id:'p-3', name_bn:'ব্যক্তি ৩ (ডেমো)', name_en:'Person 3 (Demo)', area:'সাতানীপাড়া', profession_bn:'ব্যবসায়ী', age_band:'৩০–৩৯', visibility:'public', consent_status:'granted', kind:'person', household_id:'hh-2' },
  { id:'p-4', name_bn:'ব্যক্তি ৪ (ডেমো)', name_en:'Person 4 (Demo)', area:'সাতানীপাড়া', profession_bn:'ছাত্র', age_band:'১৮–২৯', visibility:'members-only', consent_status:'granted', kind:'person', household_id:'hh-2' },
  { id:'p-5', name_bn:'ব্যক্তি ৫ (ডেমো)', name_en:'Person 5 (Demo)', area:'সাতানীপাড়া', profession_bn:'ডাক্তার', age_band:'৩০–৩৯', visibility:'public', consent_status:'granted', kind:'person' },
  { id:'p-6', name_bn:'ব্যক্তি ৬ (ডেমো)', name_en:'Person 6 (Demo)', area:'সাতানীপাড়া', profession_bn:'প্রকৌশলী', age_band:'৩০–৩৯', visibility:'public', consent_status:'withdrawn', kind:'person' }
];
export const professionals = [
  { id:'pr-1', name_bn:'পেশাজীবী ১ (ডেমো)', name_en:'Professional 1 (Demo)', area:'সাতানীপাড়া', profession_bn:'ডাক্তার', age_band:'৩০–৩৯', visibility:'public', consent_status:'granted', kind:'professionals' },
  { id:'pr-2', name_bn:'পেশাজীবী ২ (ডেমো)', name_en:'Professional 2 (Demo)', area:'সাতানীপাড়া', profession_bn:'শিক্ষক', age_band:'৪০–৪৯', visibility:'public', consent_status:'granted', kind:'professionals' },
  { id:'pr-3', name_bn:'পেশাজীবী ৩ (ডেমো)', name_en:'Professional 3 (Demo)', area:'সাতানীপাড়া', profession_bn:'প্রকৌশলী', age_band:'৩০–৩৯', visibility:'members-only', consent_status:'granted', kind:'professionals' },
  { id:'pr-4', name_bn:'পেশাজীবী ৪ (ডেমো)', name_en:'Professional 4 (Demo)', area:'সাতানীপাড়া', profession_bn:'আইনজীবী', age_band:'৪০–৪৯', visibility:'public', consent_status:'granted', kind:'professionals' }
];
export const institutions = [
  { id:'in-1', name_bn:'প্রতিষ্ঠান ১ (ডেমো)', name_en:'Institution 1 (Demo)', area:'সাতানীপাড়া', type_bn:'বিদ্যালয়', visibility:'public', consent_status:'granted', kind:'institutions' },
  { id:'in-2', name_bn:'প্রতিষ্ঠান ২ (ডেমো)', name_en:'Institution 2 (Demo)', area:'সাতানীপাড়া', type_bn:'মসজিদ', visibility:'public', consent_status:'granted', kind:'institutions' },
  { id:'in-3', name_bn:'প্রতিষ্ঠান ৩ (ডেমো)', name_en:'Institution 3 (Demo)', area:'সাতানীপাড়া', type_bn:'ক্লাব', visibility:'public', consent_status:'granted', kind:'institutions' },
  { id:'in-4', name_bn:'প্রতিষ্ঠান ৪ (ডেমো)', name_en:'Institution 4 (Demo)', area:'সাতানীপাড়া', type_bn:'বিদ্যালয়', visibility:'public', consent_status:'granted', kind:'institutions' },
  { id:'in-5', name_bn:'প্রতিষ্ঠান ৫ (ডেমো)', name_en:'Institution 5 (Demo)', area:'সাতানীপাড়া', type_bn:'মাদ্রাসা', visibility:'public', consent_status:'granted', kind:'institutions' },
  { id:'in-6', name_bn:'প্রতিষ্ঠান ৬ (ডেমো)', name_en:'Institution 6 (Demo)', area:'সাতানীপাড়া', type_bn:'সমিতি', visibility:'members-only', consent_status:'granted', kind:'institutions' }
];
export const landmarks = [
  { id:'lm-1', name_bn:'স্থাপনা ১ (ডেমো)', name_en:'Landmark 1 (Demo)', area:'সাতানীপাড়া', type_bn:'ঐতিহাসিক স্থান', visibility:'public', consent_status:'granted', kind:'landmarks' },
  { id:'lm-2', name_bn:'স্থাপনা ২ (ডেমো)', name_en:'Landmark 2 (Demo)', area:'সাতানীপাড়া', type_bn:'পুকুর', visibility:'public', consent_status:'granted', kind:'landmarks' },
  { id:'lm-3', name_bn:'স্থাপনা ৩ (ডেমো)', name_en:'Landmark 3 (Demo)', area:'সাতানীপাড়া', type_bn:'মাঠ', visibility:'public', consent_status:'granted', kind:'landmarks' },
  { id:'lm-4', name_bn:'স্থাপনা ৪ (ডেমো)', name_en:'Landmark 4 (Demo)', area:'সাতানীপাড়া', type_bn:'সড়ক', visibility:'public', consent_status:'granted', kind:'landmarks' }
];
export const freedom_fighters = [
  { id:'ff-1', name_bn:'বীর মুক্তিযোদ্ধা ১ (ডেমো)', name_en:'Freedom Fighter 1 (Demo)', area:'সাতানীপাড়া', age_band:'৭০–৭৯', visibility:'public', consent_status:'granted', kind:'freedom_fighters' },
  { id:'ff-2', name_bn:'বীর মুক্তিযোদ্ধা ২ (ডেমো)', name_en:'Freedom Fighter 2 (Demo)', area:'সাতানীপাড়া', age_band:'৭০–৭৯', visibility:'public', consent_status:'granted', kind:'freedom_fighters' }
];
