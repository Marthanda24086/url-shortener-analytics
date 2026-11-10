# LinkSnap — Design System Specification

**Design System Version:** 2.0.0  
**Design Systems Engineering Directorate**  
**Date:** November 2026

---

## 1. Color System (WCAG 2.1 AAA / AA Conformance)

```css
:root {
  /* Chromatic Foundation */
  --bg-void: #07080A;              /* Deepest obsidian canvas */
  --bg-base: #0B0D11;              /* Section foundation */
  --bg-surface: #11141A;           /* Card containers & modules */
  --bg-surface-elevated: #161A23;  /* Dropdowns, tooltips, active rows */
  --bg-surface-hover: #1D222F;     /* Interactive element hover */
  --bg-overlay: rgba(7, 8, 10, 0.85);

  /* Primary Signal Accent */
  --accent: #FF5500;               /* Kinetic Signal Amber */
  --accent-bright: #FF6A1A;        /* Interactive active/hover */
  --accent-muted: rgba(255, 85, 0, 0.15);
  --accent-glow: rgba(255, 85, 0, 0.35);

  /* Telemetry Status Spectrum */
  --signal-green: #00F59B;         /* Operational / Active (Emerald) */
  --signal-green-muted: rgba(0, 245, 155, 0.12);
  --signal-cyan: #00D8F6;          /* Network telemetry stream */
  --signal-cyan-muted: rgba(0, 216, 246, 0.12);
  --signal-amber: #FFB800;         /* TTL Warning / Expiring */
  --signal-red: #FF3B30;           /* Decommissioned / Error */
  --signal-red-muted: rgba(255, 59, 48, 0.15);

  /* Hairline Precision Borders */
  --border-subtle: rgba(255, 255, 255, 0.07);
  --border-medium: rgba(255, 255, 255, 0.14);
  --border-strong: rgba(255, 255, 255, 0.25);
  --border-accent: rgba(255, 85, 0, 0.5);

  /* Text Hierarchy */
  --text-primary: #F8FAFC;         /* 16:1 Contrast Ratio on void */
  --text-secondary: #94A3B8;       /* 7:1 Contrast Ratio (WCAG AAA) */
  --text-tertiary: #64748B;        /* 4.5:1 Contrast Ratio (WCAG AA) */
  --text-dim: #334155;
}
```

---

## 2. Typography Scale

- **Display & Section Titles:** `'Space Grotesk'`, sans-serif  
  Weights: 700 (Bold), 600 (Semi-bold). Letter spacing: `-0.025em` to `-0.03em`.
- **Primary Body & UI Text:** `'Plus Jakarta Sans'`, system-ui, sans-serif  
  Weights: 400 (Regular), 500 (Medium), 600 (Semi-bold).
- **Code, Telemetry, Coordinates, & Metrics:** `'JetBrains Mono'`, monospace  
  Tabular figures (`font-variant-numeric: tabular-nums;`).

### Hierarchy & Sizes
- **Hero Title:** `clamp(2.4rem, 4.5vw, 4rem)`, line-height: `1.08`
- **Section Heading:** `clamp(1.8rem, 3vw, 2.75rem)`, line-height: `1.15`
- **Card / Bento Title:** `1.35rem`, font-weight: 700
- **Body Large:** `1.1rem`, line-height: `1.65`
- **Body Standard:** `0.875rem` (14px), line-height: `1.6`
- **Mono Technical Label:** `0.72rem` (11.5px), letter-spacing: `0.05em`, uppercase

---

## 3. Spatial & Geometric Rules

- **Base Unit:** 4px grid (multiples: 8px, 12px, 16px, 24px, 32px, 48px, 64px).
- **Border Radii:**
  - `var(--radius-xs)`: `4px` (Tags, code blocks)
  - `var(--radius-sm)`: `8px` (Inputs, buttons, small modules)
  - `var(--radius-md)`: `12px` (Cards, charts, bento cells)
  - `var(--radius-lg)`: `18px` (Master engine console)
  - `var(--radius-full)`: `9999px` (Pills, badges)

---

## 4. Reusable Component Standards

### Buttons
- **Primary:** High-visibility Signal Amber (`#FF5500`), tactile drop shadow, `transform: translateY(-1px)` on hover, `scale(0.98)` on active press.
- **Secondary:** Surface elevated background with hairline white border (`rgba(255,255,255,0.14)`).
- **Danger:** Subdued red background with crimson border.
- **Icon Buttons:** Fixed 32x32px or 36x36px with centered glyph.

### Data Tables
- Sticky headers with `var(--bg-surface-elevated)` background.
- Row hover transition to `var(--bg-surface-elevated)` with smooth opacity ramp.
- Tabular figures for all numerical counts and timestamps.
