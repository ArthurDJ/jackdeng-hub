# DESIGN.md — jackdeng.cc

Adapted from Linear's design system. Dark-mode-native, content-first aesthetic.
Use this file as the single reference when building or modifying any UI.

---

## Core Philosophy

> "Darkness is the native medium. Content emerges through luminance gradation, not decoration."

- Elevation through background opacity steps, never box shadows
- Borders are barely-there: semi-transparent white overlays
- Accent color is reserved — use it only for primary CTAs and active states
- 8px base unit governs all spacing and rhythm
- Sections breathe through dark space, not visible dividers

---

## Color Tokens

### Backgrounds (darkest → elevated)
```css
--bg-base:     #08090a   /* page background */
--bg-panel:    #0f1011   /* cards, panels */
--bg-elevated: #191a1b   /* dropdowns, modals, hover states */
--bg-overlay:  #1f2022   /* tooltips, popovers */
```

### Text
```css
--text-primary:   #f7f8f8   /* headings, primary content */
--text-secondary: #d0d6e0   /* body text, descriptions */
--text-tertiary:  #8a8f98   /* placeholders, metadata, timestamps */
--text-disabled:  #4a4f58   /* disabled states */
```

### Borders
```css
--border-subtle:  rgba(255,255,255,0.05)   /* resting state */
--border-default: rgba(255,255,255,0.08)   /* cards, inputs */
--border-strong:  rgba(255,255,255,0.12)   /* focused, hover */
```

### Accent (use sparingly — CTAs and active states only)
```css
--accent-primary: #5e6ad2   /* indigo — primary CTA */
--accent-hover:   #7170ff   /* violet — CTA hover */
--accent-subtle:  rgba(94,106,210,0.12)  /* accent background tint */
```

### Status
```css
--status-success: #10b981   /* emerald */
--status-warning: #f59e0b
--status-error:   #ef4444
--status-info:    #3b82f6
```

### Light mode (use --bg-light-* when .light class is active)
```css
--bg-light-base:    #ffffff
--bg-light-panel:   #f8f9fa
--bg-light-elevated:#f1f3f5
--text-light-primary:   #0f1011
--text-light-secondary: #3d4147
--text-light-tertiary:  #7a8390
--border-light-subtle:  rgba(0,0,0,0.06)
--border-light-default: rgba(0,0,0,0.09)
```

---

## Typography

### Font
```css
font-family: 'Inter Variable', 'Inter', system-ui, sans-serif;
font-feature-settings: "cv01", "ss03";   /* geometric alternates */
```

### Scale & Letter-Spacing
| Token       | Size  | Weight | Letter-Spacing | Usage                  |
|-------------|-------|--------|----------------|------------------------|
| display-xl  | 72px  | 590    | -1.584px       | Hero titles            |
| display-lg  | 48px  | 590    | -1.056px       | Section headings       |
| display-md  | 36px  | 510    | -0.72px        | Page titles            |
| heading-lg  | 24px  | 510    | -0.36px        | Card titles            |
| heading-md  | 18px  | 510    | -0.18px        | Sub-headings           |
| body-lg     | 17px  | 400    | 0              | Long-form reading      |
| body-md     | 15px  | 400    | 0              | UI body text           |
| body-sm     | 13px  | 400    | 0.1px          | Captions, labels       |
| mono        | 13px  | 400    | 0              | Code, dates, metadata  |

### Weight Guide
- **300** — Deliberately de-emphasized (hero subtitles, footnotes)
- **400** — Reading weight (body copy)
- **510** — UI emphasis (nav links, card titles, button labels)
- **590** — Strong emphasis (headings, CTA text)

---

## Spacing System (8px base)

```
2px   — micro gaps (icon-to-label)
4px   — tight (tag padding, list item gaps)
8px   — base unit (component internal padding)
12px  — small gap (between related items)
16px  — medium gap (section internal spacing)
24px  — large gap (card padding, between components)
32px  — xl gap (section breaks within a page)
48px  — 2xl (major section separation)
64px  — 3xl (page-level top/bottom padding)
96px  — 4xl (hero vertical rhythm)
```

---

## Border Radius

```
2px    — micro (badges, table cells)
6px    — small (buttons, inputs, small cards)
8px    — default (cards, modals)
12px   — large (feature cards, popovers)
9999px — pill (tags, status pills, avatar chips)
```

---

## Component Patterns

### Buttons
```
Primary:   bg #5e6ad2, text white, radius 6px, px-16 py-8
           hover: bg #7170ff, no shadow
Secondary: bg rgba(255,255,255,0.04), border rgba(255,255,255,0.08)
           hover: bg rgba(255,255,255,0.07)
Ghost:     bg transparent, text secondary
           hover: bg rgba(255,255,255,0.04)
```

### Cards
```
bg: #0f1011
border: 1px solid rgba(255,255,255,0.08)
radius: 8px
padding: 24px
hover: border rgba(255,255,255,0.12), bg #191a1b
transition: all 150ms ease
```

### Navigation (sticky header)
```
bg: rgba(8,9,10,0.80) with backdrop-blur(12px)
border-bottom: 1px solid rgba(255,255,255,0.06)
height: 52px
```

### Inputs
```
bg: rgba(255,255,255,0.03)
border: 1px solid rgba(255,255,255,0.08)
radius: 6px
padding: 8px 12px
focus: border rgba(94,106,210,0.6), outline none
```

### Tags / Pills
```
bg: rgba(255,255,255,0.06)
border: 1px solid rgba(255,255,255,0.08)
radius: 9999px
padding: 2px 10px
font-size: 12px, weight 510
```

### Status Pill (available indicator)
```
bg: rgba(16,185,129,0.12)
border: 1px solid rgba(16,185,129,0.20)
text: #10b981
dot: 6px circle, bg #10b981, animate-pulse
```

---

## Motion

```css
--duration-fast:   100ms
--duration-base:   150ms
--duration-slow:   250ms
--ease-default:    cubic-bezier(0.16, 1, 0.3, 1)  /* spring-like */
--ease-in:         cubic-bezier(0.4, 0, 1, 1)
--ease-out:        cubic-bezier(0, 0, 0.2, 1)
```

Never animate color alone — always pair with transform or opacity.

---

## Do / Don't

| ✅ Do                                           | ❌ Don't                              |
|-------------------------------------------------|---------------------------------------|
| Use luminance stacking for depth                | Use box-shadow for elevation          |
| Reserve accent for one primary action per view  | Scatter accent color decoratively     |
| Let dark space separate sections                | Add heavy dividers or ruled lines     |
| Use weight 510 for UI emphasis                  | Bold everything (makes nothing bold)  |
| Keep borders barely visible                     | Use high-contrast borders             |
| Animate with transform + opacity                | Animate color or size alone           |
