# DESIGN_SYSTEM.md — Satanipara Community
Date: 2026-11-14 | Phase 3

## Tokens (CSS variables, :root; dark theme overrides under [data-theme="dark"])
```css
:root{
  --forest:#173F35; --deep:#102E27; --gold:#C49A4A; --gold-soft:#E4C98F;
  --ivory:#F7F4EA; --paper:#FFFDF6; --ink:#1C2420; --muted:#5A6B62;
  --line:#E2DCCB; --danger:#9B2C2C; --ok:#2F6B4F;
  --font-bn:"Hind Siliguri","Noto Sans Bengali",sans-serif;
  --font-display:"Noto Serif Bengali","Hind Siliguri",serif;
  --font-en:"Manrope","Hind Siliguri",sans-serif;
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-5:24px;
  --space-6:32px; --space-7:48px; --space-8:64px; --space-9:96px;
  --container:1180px; --radius:10px; --radius-lg:16px;
  --shadow:0 1px 2px rgba(16,46,39,.08),0 8px 24px rgba(16,46,39,.08);
  --dur:180ms; --dur-slow:320ms;
}
[data-theme="dark"]{ --ivory:#122019; --paper:#16261F; --ink:#F2EFE3; --muted:#A9B8AC; --line:#2A4036; }
```

## Typography
- Display (hero): Noto Serif Bengali, 700, clamp(2.4rem,6vw,4.2rem), line-height 1.25, letter-spacing 0.
- Section headings: Noto Serif Bengali 700, clamp(1.6rem,3vw,2.2rem), lh 1.35.
- Body Bengali: Hind Siliguri 400, 16–17px, **line-height 1.8** (matras/conjuncts), max 68ch.
- Body English: Manrope 400, 16px, lh 1.65.
- UI/nav/buttons: Hind Siliguri 600, 15px; metadata: 13px, muted, lh 1.6.
- Bengali rules: never <15px for Bengali body; test conjuncts ক্ষ ত্র ষ্ট জ্ঞ; Bengali sized ~10% larger than Latin at same hierarchy; lang="bn" on Bengali blocks.
- Scale: 12 / 13 / 15 / 16 / 18 / 20 / 24 / 32 / 40 / 56 (px, fluid via clamp for display).

## Colour use
- Forest = primary surfaces, headings on ivory, buttons. Deep = footer, dark bands, hero overlay. Gold = sparing accent: rules, badges, active states, never large backgrounds or gradients. Ivory = page ground; paper = cards. Contrast: ink on ivory 12.6:1; ivory on forest 9.8:1; gold on forest 4.6:1 (large text/UI only, never small body).

## Grid & layout
- Container 1180px, 24px gutters; 12-col desktop, 8-col tablet, 4-col mobile. Sections alternate: ivory / paper / deep-green band; asymmetric hero (7/5 split); editorial offsets (staggered cards, pull quotes).

## Components
- Buttons: primary (forest bg, ivory text), gold (gold bg, deep text, large text only), ghost (1px forest border); 44px min height, radius 10px, focus-visible 3px gold outline.
- Cards: paper bg, 1px line border, radius 16px, shadow on hover only; no glassmorphism.
- Forms: labelled inputs, 48px height, 1px line border, focus border forest + gold ring; inline error text in danger colour with icon.
- Badges/chips: pill, gold-soft bg for category, forest text; status pills: Pending (gold), Accepted (blue-green), In Progress (forest), Completed (ok green).
- Tabs/accordion: underline active tab, keyboard operable; timeline: vertical line + numbered nodes.
- Dialog/lightbox: overlay deep 80%, Esc close, focus trap, labelled close.

## Motion
- Reveal on scroll (IntersectionObserver, translateY 12px + fade, 320ms); hover lifts 2px; all disabled under prefers-reduced-motion.
- Durations: 180ms interactions, 320ms reveals; no infinite animation.

## Breakpoints
- 360 / 640 / 900 / 1180 / 1440. Mobile-first; hamburger ≤900px; hero stacks <900px; stats 2-col mobile, 4-col desktop.
