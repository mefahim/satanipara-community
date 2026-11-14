// DEMO data only. No base64 blobs — placeholder labels/paths only. Video album is a placeholder (0 videos).
export const DEMO = true;
export const albums = [
  { id:'alb-1', name_bn:'কার্যক্রম (ডেমো)', name_en:'Activities (Demo)', count:4 },
  { id:'alb-2', name_bn:'অনুষ্ঠান (ডেমো)', name_en:'Events (Demo)', count:3 },
  { id:'alb-3', name_bn:'সম্প্রদায় (ডেমো)', name_en:'Community (Demo)', count:3 },
  { id:'alb-video', name_bn:'ভিডিও গ্যালারি', name_en:'Video gallery', count:0, placeholder:true }
];
export const media = [
  { id:'med-1', caption_bn:'বৃত্তি প্রদান (ডেমো)', caption_en:'Scholarship award (Demo)', album_id:'alb-1', consent_on_file:true, uploader:'u-sa1', size_kb:120, placeholder:'photo-1' },
  { id:'med-2', caption_bn:'রক্তদান কর্মসূচি (ডেমো)', caption_en:'Blood donation programme (Demo)', album_id:'alb-1', consent_on_file:true, uploader:'u-sa1', size_kb:140, placeholder:'photo-2' },
  { id:'med-3', caption_bn:'শীতবস্ত্র বিতরণ (ডেমো)', caption_en:'Winter clothing distribution (Demo)', album_id:'alb-1', consent_on_file:true, uploader:'u-sa1', size_kb:110, placeholder:'photo-3' },
  { id:'med-4', caption_bn:'চিকিৎসা শিবির (ডেমো)', caption_en:'Medical camp (Demo)', album_id:'alb-1', consent_on_file:true, uploader:'u-sa1', size_kb:130, placeholder:'photo-4' },
  { id:'med-5', caption_bn:'বিজয় দিবস (ডেমো)', caption_en:'Victory Day (Demo)', album_id:'alb-2', consent_on_file:true, uploader:'u-sa1', size_kb:150, placeholder:'photo-5' },
  { id:'med-6', caption_bn:'সামাজিক অনুষ্ঠান (ডেমো)', caption_en:'Community event (Demo)', album_id:'alb-2', consent_on_file:true, uploader:'u-sa1', size_kb:125, placeholder:'photo-6' },
  { id:'med-7', caption_bn:'অনুষ্ঠান (ডেমো)', caption_en:'Event (Demo)', album_id:'alb-2', consent_on_file:true, uploader:'u-sa1', size_kb:135, placeholder:'photo-7' },
  { id:'med-8', caption_bn:'সম্প্রদায়ের ছবি (ডেমো)', caption_en:'Community photo (Demo)', album_id:'alb-3', consent_on_file:true, uploader:'u-sa1', size_kb:115, placeholder:'photo-8' },
  { id:'med-9', caption_bn:'সম্প্রদায়ের ছবি (ডেমো)', caption_en:'Community photo (Demo)', album_id:'alb-3', consent_on_file:true, uploader:'u-sa1', size_kb:118, placeholder:'photo-9' },
  { id:'med-10', caption_bn:'সম্প্রদায়ের ছবি (ডেমো)', caption_en:'Community photo (Demo)', album_id:'alb-3', consent_on_file:true, uploader:'u-sa1', size_kb:122, placeholder:'photo-10' }
];
