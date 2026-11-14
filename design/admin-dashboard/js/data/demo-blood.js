// DEMO data only. Availability is COMPUTED from the 90-day rule, never a static flag.
// A− and AB− are EMPTY — a reachable empty state.
export const DEMO = true;
export const blood_donors = [
  { id:'d-1', name_bn:'রক্তদাতা ১ (ডেমো)', name_en:'Donor 1 (Demo)', blood_group:'A+', area:'সাতানীপাড়া', last_donation_date:'2026-06-01', consent_to_list:true, phone:'01994000001' },
  { id:'d-2', name_bn:'রক্তদাতা ২ (ডেমো)', name_en:'Donor 2 (Demo)', blood_group:'A+', area:'সাতানীপাড়া', last_donation_date:'2026-10-01', consent_to_list:true, phone:'01994000002' },
  { id:'d-3', name_bn:'রক্তদাতা ৩ (ডেমো)', name_en:'Donor 3 (Demo)', blood_group:'B+', area:'সাতানীপাড়া', last_donation_date:'2026-05-15', consent_to_list:true, phone:'01994000003' },
  { id:'d-4', name_bn:'রক্তদাতা ৪ (ডেমো)', name_en:'Donor 4 (Demo)', blood_group:'B+', area:'সাতানীপাড়া', last_donation_date:'2026-11-01', consent_to_list:true, phone:'01994000004' },
  { id:'d-5', name_bn:'রক্তদাতা ৫ (ডেমো)', name_en:'Donor 5 (Demo)', blood_group:'O+', area:'সাতানীপাড়া', last_donation_date:'2026-04-20', consent_to_list:true, phone:'01994000005' },
  { id:'d-6', name_bn:'রক্তদাতা ৬ (ডেমো)', name_en:'Donor 6 (Demo)', blood_group:'O+', area:'সাতানীপাড়া', last_donation_date:'2026-08-10', consent_to_list:true, phone:'01994000006' },
  { id:'d-7', name_bn:'রক্তদাতা ৭ (ডেমো)', name_en:'Donor 7 (Demo)', blood_group:'AB+', area:'সাতানীপাড়া', last_donation_date:'2026-03-01', consent_to_list:true, phone:'01994000007' },
  { id:'d-8', name_bn:'রক্তদাতা ৮ (ডেমো)', name_en:'Donor 8 (Demo)', blood_group:'B−', area:'সাতানীপাড়া', last_donation_date:'2026-02-01', consent_to_list:true, phone:'01994000008' },
  { id:'d-9', name_bn:'রক্তদাতা ৯ (ডেমো)', name_en:'Donor 9 (Demo)', blood_group:'O−', area:'সাতানীপাড়া', last_donation_date:'2026-01-15', consent_to_list:true, phone:'01994000009' },
  { id:'d-10', name_bn:'রক্তদাতা ১০ (ডেমো)', name_en:'Donor 10 (Demo)', blood_group:'A+', area:'সাতানীপাড়া', last_donation_date:'2026-07-01', consent_to_list:true, phone:'01994000010' },
  { id:'d-11', name_bn:'রক্তদাতা ১১ (ডেমো)', name_en:'Donor 11 (Demo)', blood_group:'B+', area:'সাতানীপাড়া', last_donation_date:'2026-09-01', consent_to_list:true, phone:'01994000011' },
  { id:'d-12', name_bn:'রক্তদাতা ১২ (ডেমো)', name_en:'Donor 12 (Demo)', blood_group:'O+', area:'সাতানীপাড়া', last_donation_date:'2026-06-15', consent_to_list:false, phone:'01994000012' }
];
// d-12 withdrew consent-to-list: hidden from public lists. No A− / AB− donors exist.
export function donorAvailable(donor, asOf = new Date('2026-11-14T00:00:00+06:00')){
  if(!donor.consent_to_list) return false;
  if(!donor.last_donation_date) return true;
  const last = new Date(donor.last_donation_date + 'T00:00:00+06:00');
  return (asOf - last) / 86400000 >= 90;
}
export const blood_requests = [
  { id:'br-1', blood_group:'A+', units:2, hospital_bn:'হাসপাতাল (ডেমো)', contact_masked:'01994•••01', status:'fulfilled', created_at:'2026-11-02T09:00:00+06:00' },
  { id:'br-2', blood_group:'B+', units:1, hospital_bn:'হাসপাতাল (ডেমো)', contact_masked:'01994•••03', status:'notified', created_at:'2026-11-12T09:00:00+06:00' },
  { id:'br-3', blood_group:'O+', units:2, hospital_bn:'হাসপাতাল (ডেমো)', contact_masked:'01994•••05', status:'submitted', created_at:'2026-11-13T09:00:00+06:00' },
  { id:'br-4', blood_group:'AB+', units:1, hospital_bn:'হাসপাতাল (ডেমো)', contact_masked:'01994•••07', status:'cancelled', created_at:'2026-11-01T09:00:00+06:00' }
];
export const blood_consents = [
  { id:'bc-1', blood_request_id:'br-2', donor_id:'d-3', outcome:'granted', granted_at:'2026-11-12T11:00:00+06:00' },
  { id:'bc-2', blood_request_id:'br-2', donor_id:'d-4', outcome:'pending', granted_at:null },
  { id:'bc-3', blood_request_id:'br-1', donor_id:'d-1', outcome:'granted', granted_at:'2026-11-02T10:00:00+06:00' }
];
