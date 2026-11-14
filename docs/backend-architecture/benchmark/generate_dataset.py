#!/usr/bin/env python3
"""
Satanipara Community — Bengali search benchmark: SYNTHETIC dataset generator.
Generates seed.sql with ~3,900 rows across 3 tables mirroring the real
Phase 0 schema (doc 06): posts (notices/news), persons (directory names),
activities (annual activities).

SYNTHETIC DATA — clearly labelled. No real organisation data was available
to the benchmarker; all names, figures and texts are invented for testing
only. Production validation on real org data remains pending.

Deterministic: random.seed(20261114) — re-running produces the same file.
Publishable package version (Phase 0.1.1): arguments added (--output,
--seed, --posts/--persons/--activities, --database); the generated content
at the defaults is byte-identical to the Phase 0.1 generator output
(md5 b2164ed52f58e36d3954a42cebacad40 for seed.sql at the defaults).
Usage: python3 generate_dataset.py [--output seed.sql] [--seed 20261114]
       [--posts 1800] [--persons 1500] [--activities 600] [--database bench]
The generated seed.sql is NOT committed to the repo (see README.md).
"""
import argparse
import os
import random

random.seed(20261114)

AREAS_BN = ["উত্তর পাড়া", "মধ্য পাড়া", "দক্ষিণ পাড়া", "পূর্ব পাড়া",
            "পশ্চিম পাড়া", "বাজার পাড়া", "নতুন পাড়া", "পুরনো পাড়া",
            "মসজিদ পাড়া", "স্কুল পাড়া"]
AREAS_EN = ["Uttar Para", "Madhya Para", "Dakshin Para", "Purba Para",
            "Paschim Para", "Bazar Para", "Natun Para", "Purono Para",
            "Masjid Para", "School Para"]

# Canonical org name + deliberate spelling variants (real-world messiness)
ORG_VARIANTS = ["সাতানিপাড়া"] * 88 + ["শাতানিপাড়া"] * 6 + \
               ["সাতানীপাড়া"] * 4 + ["সাতানিপারা"] * 2

FIRST_BN = ["মোহাম্মদ", "আব্দুল", "রহিম", "করিম", "জামাল", "কামাল", "সেলিম",
            "নাসির", "ফারুক", "আনোয়ার", "হাসান", "মাহমুদ", "ইব্রাহিম", "ইউসুফ",
            "সাইফুল", "রফিক", "শফিক", "মনির", "জসিম", "আবুল", "নুরুল", "শাহজাহান",
            "ফাতেমা", "আয়েশা", "খাদিজা", "মরিয়ম", "নাসরিন", "শারমিন", "রুবিনা",
            "সুমাইয়া", "তানিয়া", "রেহানা", " সালমা", "জাহানারা", "পারভীন", "নাজমা",
            "রিনা", "মিনা", "সাবিনা", "হাসিনা", "শ্রাবণী", "ফারহানা", "তাসলিমা"]
FIRST_BN = [n.strip() for n in FIRST_BN]
FIRST_EN = ["Mohammad", "Abdul", "Rahim", "Karim", "Jamal", "Kamal", "Selim",
            "Nasir", "Faruk", "Anwar", "Hasan", "Mahmud", "Ibrahim", "Yusuf",
            "Saiful", "Rafiq", "Shafiq", "Monir", "Jasim", "Abul", "Nurul",
            "Shahjahan", "Fatema", "Ayesha", "Khadija", "Mariam", "Nasrin",
            "Sharmin", "Rubina", "Sumaiya", "Tania", "Rehana", "Salma",
            "Jahanara", "Parvin", "Nazma", "Rina", "Mina", "Sabina", "Hasina",
            "Shraboni", "Farhana", "Taslima"]

LAST_BN = ["উদ্দিন", "হোসেন", "আলী", "আহমেদ", "চৌধুরী", "মিয়া", "সরকার",
           "রহমান", "ইসলাম", "খান", "বেগম", "আক্তার", "সুলতানা", "মোল্লা",
           "শেখ", "ভূঁইয়া", "তালুকদার", "মজুমদার", "দাস", "রায়", "পাল",
           "দেবনাথ", "সাহা", "ঘোষ", "চক্রবর্তী", "ভট্টাচার্য"]
LAST_EN = ["Uddin", "Hossen", "Ali", "Ahmed", "Chowdhury", "Mia", "Sarkar",
           "Rahman", "Islam", "Khan", "Begum", "Akter", "Sultana", "Molla",
           "Sheikh", "Bhuiyan", "Talukdar", "Majumdar", "Das", "Roy", "Pal",
           "Debnath", "Saha", "Ghosh", "Chakraborty", "Bhattacharya"]

PROF_BN = ["শিক্ষক", "ডাক্তার", "ব্যবসায়ী", "কৃষক", "প্রবাসী", "ইঞ্জিনিয়ার",
           "আইনজীবী", "সাংবাদিক", "সরকারি কর্মকর্তা", "পুলিশ", "ব্যাংকার",
           "নার্স", "ছাত্র", "গৃহিণী", "দোকানদার", "ড্রাইভার", "শ্রমিক",
           "মৎস্যজীবী", "ইমাম", "প্রশিক্ষক"]
PROF_EN = ["Teacher", "Doctor", "Businessman", "Farmer", "Expatriate",
           "Engineer", "Lawyer", "Journalist", "Government Officer", "Police",
           "Banker", "Nurse", "Student", "Homemaker", "Shopkeeper", "Driver",
           "Worker", "Fisherman", "Imam", "Trainer"]

BN_DIGITS = "০১২৩৪৫৬৭৮৯"


def bn_num(n):
    return "".join(BN_DIGITS[int(d)] for d in str(n))


def esc(s):
    return s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ")


# ---------------------------------------------------------------- posts
POST_TITLES = [
    ("শীতবস্ত্র বিতরণ কর্মসূচি {y}", "notice"),
    ("রক্তদান শিবির {area}", "notice"),
    ("মেধাবী শিক্ষার্থীদের বৃত্তি প্রদান অনুষ্ঠান", "news"),
    ("বৃক্ষরোপণ কর্মসূচি {y}", "news"),
    ("ফ্রি মেডিকেল ক্যাম্প {area}", "notice"),
    ("বার্ষিক সাধারণ সভা {y}", "notice"),
    ("ঈদ পুনর্মিলনী অনুষ্ঠান", "news"),
    ("মসজিদ সংস্কার কাজের অগ্রগতি", "news"),
    ("মাদ্রাসা শিক্ষার্থীদের সংবর্ধনা", "news"),
    ("ক্রিকেট টুর্নামেন্টের ফাইনাল খেলা", "event"),
    ("শিক্ষা সফর: ঐতিহাসিক স্থান পরিদর্শন", "event"),
    ("ত্রাণ বিতরণ কর্মসূচি", "notice"),
    ("স্বাস্থ্য সচেতনতা সেমিনার", "news"),
    ("নতুন কমিটি গঠন সংক্রান্ত বিজ্ঞপ্তি", "notice"),
    ("বার্ষিক প্রতিবেদন প্রকাশ {y}", "news"),
    ("চাঁদা আদায় সংক্রান্ত বিজ্ঞপ্তি", "notice"),
    ("SSC পরীক্ষায় কৃতী শিক্ষার্থীদের সংবর্ধনা", "news"),
    ("HSC বৃত্তি পরীক্ষার ফলাফল প্রকাশ", "news"),
    ("Blood Donation Camp — রক্তদান শিবির", "notice"),
    ("Scholarship আবেদনের শেষ তারিখ ঘোষণা", "notice"),
    ("প্রশিক্ষণ কর্মশালা: কম্পিউটার শিক্ষা", "event"),
    ("শ্রমিক দিবসের অনুষ্ঠান", "news"),
    ("শ্রদ্ধাঞ্জলি: ভাষা শহীদদের স্মরণে", "news"),
    ("বিদ্যালয় ভবন নির্মাণে অনুদান আহ্বান", "notice"),
    ("গ্রন্থাগার উদ্বোধন অনুষ্ঠান", "news"),
    ("জ্ঞান ও নৈতিকতা বিষয়ক আলোচনা সভা", "event"),
    ("ক্ষুদ্র ব্যবসায়ীদের সহায়তা তহবিল", "notice"),
    ("মাদরাসা ভবন মেরামতের জন্য অর্থ সংগ্রহ", "notice"),
    ("রক্ত দান করুন, জীবন বাঁচান", "notice"),
    ("শীত বস্ত্র সংগ্রহ অভিযান", "notice"),
    ("ইফতার মাহফিল {y}", "event"),
    ("বার্ষিক ক্রীড়া প্রতিযোগিতা", "event"),
    ("স্বেচ্ছাসেবক নিয়োগ বিজ্ঞপ্তি", "notice"),
    ("দরিদ্র মেধাবী ছাত্রদের জন্য বৃত্তি", "news"),
    ("প্রবাসীদের সহায়তায় বিশেষ সভা", "news"),
]

POST_BODIES = [
    "{org} সমাজ কল্যাণ সংঘের উদ্যোগে {area} এলাকায় এই কর্মসূচি অনুষ্ঠিত হবে। "
    "সকল সদস্যকে উপস্থিত থাকার জন্য অনুরোধ করা হচ্ছে। বিস্তারিত জানতে কমিটির সঙ্গে যোগাযোগ করুন।",
    "এই কর্মসূচিতে {n} জন উপকারভোগী অংশ নেবেন বলে আশা করা হচ্ছে। {org} এলাকার সকল পরিবারকে "
    "আমন্ত্রণ জানানো হচ্ছে। অনুষ্ঠানটি সকাল {h}টায় শুরু হবে।",
    "{org} কমিটির সভাপতির সভাপতিত্বে অনুষ্ঠানটি অনুষ্ঠিত হবে। {area} সহ আশপাশের এলাকার "
    "সদস্যরা উপস্থিত থাকবেন। শিক্ষা ও স্বাস্থ্য বিষয়ে আলোচনা হবে।",
    "গত বছর এই কর্মসূচিতে {n} জন অংশ নিয়েছিলেন। এবার আরও বেশি মানুষের অংশগ্রহণের আশা করা হচ্ছে। "
    "স্বেচ্ছাসেবকদের সহযোগিতায় অনুষ্ঠানটি সুন্দরভাবে সম্পন্ন হবে।",
    "বিস্তারিত তথ্যের জন্য সংঘের কার্যালয়ে যোগাযোগ করুন অথবা নোটিশ বোর্ড দেখুন। "
    "প্রবাসী সদস্যরাও এই কর্মসূচিতে সহযোগিতা করেছেন।",
]


def gen_posts(n):
    rows = []
    for i in range(n):
        title, cat = random.choice(POST_TITLES)
        y = random.choice([2023, 2024, 2025, 2026])
        area = random.choice(AREAS_BN)
        title = title.format(y=y, area=area)
        body = random.choice(POST_BODIES).format(
            org=random.choice(ORG_VARIANTS), area=area,
            n=bn_num(random.randint(20, 450)), h=bn_num(random.randint(8, 11)))
        # extra sentence with conjunct-heavy / English-mixed content, ~30% of rows
        r = random.random()
        if r < 0.15:
            body += " অনুষ্ঠানে শ্রদ্ধেয় অতিথিরা প্রশিক্ষণ ও শিক্ষার গুরুত্ব নিয়ে আলোচনা করবেন।"
        elif r < 0.25:
            body += " Free Medical Camp-এ বিনামূল্যে স্বাস্থ্য পরীক্ষা করা হবে। Blood Donation-এর জন্য রক্তদাতারা নিবন্ধন করতে পারবেন।"
        elif r < 0.32:
            body += " SSC ও HSC পরীক্ষায় উত্তীর্ণ শিক্ষার্থীদের Scholarship দেওয়া হবে।"
        rows.append((i + 1, cat, "published", title, body))
    return rows


# ---------------------------------------------------------------- persons
def gen_persons(n):
    rows = []
    for i in range(n):
        fi = random.randrange(len(FIRST_BN))
        li = random.randrange(len(LAST_BN))
        name_bn = f"{FIRST_BN[fi]} {LAST_BN[li]}"
        name_en = f"{FIRST_EN[fi]} {LAST_EN[li]}"
        ai = random.randrange(len(AREAS_BN))
        pi = random.randrange(len(PROF_BN))
        rows.append((i + 1, name_bn, name_en, AREAS_BN[ai], AREAS_EN[ai],
                     PROF_BN[pi], PROF_EN[pi]))
    return rows


# ---------------------------------------------------------------- activities
ACT_TITLES = [
    ("শীতবস্ত্র বিতরণ", "winter_clothing"),
    ("রক্তদান শিবির", "blood_donation"),
    ("মেধাবী শিক্ষার্থীদের বৃত্তি প্রদান", "scholarship"),
    ("বৃক্ষরোপণ কর্মসূচি", "tree_plantation"),
    ("ফ্রি মেডিকেল ক্যাম্প", "medical_camp"),
    ("ত্রাণ বিতরণ", "relief"),
    ("জাতীয় দিবস উদযাপন", "national_day"),
    ("ক্রীড়া প্রতিযোগিতা", "other"),
    ("শিক্ষা সফর", "other"),
    ("স্বাস্থ্য সচেতনতা সেমিনার", "medical_camp"),
    ("প্রশিক্ষণ কর্মশালা", "scholarship"),
    ("ঈদ পুনর্মিলনী", "other"),
]
ACT_BODIES = [
    "{org} সমাজ কল্যাণ সংঘ {y} সালে {area} এলাকায় এই কর্মসূচি আয়োজন করে। "
    "{n} জন উপকারভোগী এতে অংশ নেন।",
    "এই কর্মসূচিতে সংঘের সদস্য, স্বেচ্ছাসেবক ও প্রবাসী শুভাকাঙ্ক্ষীরা সহযোগিতা করেন। "
    "শিক্ষা, স্বাস্থ্য ও সচেতনতা বৃদ্ধিই ছিল মূল লক্ষ্য।",
    "{y} সালের এই আয়োজনে {n} টি পরিবার উপকৃত হয়। {area} সহ পুরো {org} এলাকায় "
    "কর্মসূচিটি পরিচালিত হয়।",
]


def gen_activities(n):
    rows = []
    for i in range(n):
        title, cat = random.choice(ACT_TITLES)
        y = random.choice([2020, 2021, 2022, 2023, 2024, 2025, 2026])
        area = random.choice(AREAS_BN)
        body = random.choice(ACT_BODIES).format(
            org=random.choice(ORG_VARIANTS), y=y, area=area,
            n=bn_num(random.randint(15, 600)))
        rows.append((i + 1, y, cat, title, body, random.randint(15, 600)))
    return rows


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--output", default=None,
                    help="output seed.sql path (default: seed.sql next to this script)")
    ap.add_argument("--seed", type=int, default=20261114,
                    help="deterministic RNG seed (default: 20261114)")
    ap.add_argument("--posts", type=int, default=1800)
    ap.add_argument("--persons", type=int, default=1500)
    ap.add_argument("--activities", type=int, default=600)
    ap.add_argument("--database", default="bench",
                    help="database name written in the USE statement (default: bench)")
    args = ap.parse_args()
    random.seed(args.seed)
    posts = gen_posts(args.posts)
    persons = gen_persons(args.persons)
    acts = gen_activities(args.activities)
    out = []
    out.append("-- Satanipara Community Bengali search benchmark — SYNTHETIC seed data")
    out.append(f"-- Generated by generate_dataset.py (seed {args.seed}). NO real org data.")
    out.append(f"-- Rows: posts={len(posts)}, persons={len(persons)}, activities={len(acts)} "
               f"(total {len(posts) + len(persons) + len(acts)}).")
    out.append(f"USE {args.database};")
    out.append("SET NAMES utf8mb4;")
    out.append("")
    out.append("-- posts ------------------------------------------------------------")
    for pid, cat, status, title, body in posts:
        out.append(
            f"INSERT INTO posts (id, category, status, title_bn, body_bn) VALUES "
            f"({pid}, '{cat}', '{status}', '{esc(title)}', '{esc(body)}');")
    out.append("")
    out.append("-- persons ----------------------------------------------------------")
    for pid, nbn, nen, abn, aen, pbn, pen in persons:
        out.append(
            f"INSERT INTO persons (id, name_bn, name_en, area_bn, area_en, profession_bn, profession_en) VALUES "
            f"({pid}, '{esc(nbn)}', '{esc(nen)}', '{esc(abn)}', '{esc(aen)}', '{esc(pbn)}', '{esc(pen)}');")
    out.append("")
    out.append("-- activities -------------------------------------------------------")
    for aid, y, cat, title, body, bc in acts:
        out.append(
            f"INSERT INTO activities (id, year, category, title_bn, body_bn, beneficiary_count) VALUES "
            f"({aid}, {y}, '{cat}', '{esc(title)}', '{esc(body)}', {bc});")
    out_path = args.output or os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "seed.sql")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")
    print(f"{out_path} written: posts={len(posts)} persons={len(persons)} "
          f"activities={len(acts)} total={len(posts)+len(persons)+len(acts)}")


if __name__ == "__main__":
    main()
