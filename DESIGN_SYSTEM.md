# KAIRO — Design System Specifications (Black × Orange Edition)

**Version:** 2.0.0  
**Design Tokens, Typography, Components & Motion Guidelines**

---

## 1. Color Tokens

### Surface & Canvas
```css
--bg-deep-black: #090909;      /* Primary application canvas */
--surface-charcoal: #151515;   /* Elevated cards, sidebar, table header */
--surface-graphite: #1D1D1D;   /* Input fills, active badges, nested containers */
--surface-hover: #242424;      /* Interactive hover surfaces */
```

### Borders & Hairlines
```css
--border-subtle: #303030;      /* Hairline dark grey dividers */
--border-focus: #FF6B2C;       /* Focus rings on accessible inputs */
--border-hover: #454545;       /* Card hover state borders */
```

### Text & Contrast
```css
--text-primary: #F5F5F5;       /* Off-white headers, titles, metrics */
--text-secondary: #A1A1AA;     /* Muted grey subheadings, captions, labels */
--text-tertiary: #737373;      /* Timestamps, hints */
```

### Brand Accents (Black × Orange)
```css
--accent-burnt-orange: #FF6B2C; /* Primary CTA buttons, key statistics, active nav */
--accent-amber-orange: #FF8C42; /* Unique visitor highlights, secondary trend pills */
--accent-orange-hover: #E55A1F;
--accent-orange-glow: rgba(255, 107, 44, 0.25);
```

---

## 2. Typography System

| Token | Size / Line-Height | Weight | Tracking | Usage |
|---|---|---|---|---|
| `display-2xl` | 56px / 1.1 | 800 (Extrabold) | `-0.03em` | Hero landing page main punchline |
| `display-xl` | 40px / 1.15 | 700 (Bold) | `-0.025em` | Section headers |
| `heading-lg` | 24px / 1.25 | 700 (Bold) | `-0.02em` | Dashboard view titles |
| `heading-md` | 18px / 1.35 | 600 (Semibold) | `-0.015em` | Card titles, modal headers |
| `body-base` | 14px / 1.5 | 400 (Regular) | `normal` | Explanatory copy, table cells |
| `body-sm` | 12px / 1.4 | 500 (Medium) | `0.01em` | Metrics captions, tags, badges |
| `code-mono` | 13px / 1.4 | 600 (Semibold) | `0` | Short URLs, slugs, IPs, hashes |

---

## 3. UI Components

### 1. Button Variants
- `primary`: Solid Burnt Orange `#FF6B2C` text `#FFFFFF` with hover `#E55A1F` and active micro-scale (0.98).
- `secondary`: Charcoal `#1D1D1D` with hairline border `#303030` and hover `#242424`.
- `ghost`: Transparent with text `#A1A1AA` transitioning to `#F5F5F5` on hover.
- `destructive`: Subtle rose tint `#450A0A` with crimson text `#F87171` and border `#7F1D1D`.

### 2. Status Badge Pills
- **Active:** `#FF6B2C`/15 background with `#FF8C42` text and `#FF6B2C`/30 border.
- **Paused:** `#242424` background with `#A1A1AA` text and `#303030` border.
- **Expired:** `#1D1D1D` background with `#737373` text and `#303030` border.

### 3. Interactive Charts (Recharts)
- Background: `#151515` with `#303030` border.
- Grid: Subtle `#252525` horizontal hairline rules.
- Area Curve: Burnt Orange `#FF6B2C` stroke (width 2) with vertical gradient fading to transparent.
- Secondary Curve: Amber Orange `#FF8C42` stroke (width 2).
- Tooltip: `#151515` background, `#303030` border, `#F5F5F5` title, `#FF6B2C` numbers.
