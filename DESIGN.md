# Design System & UI Specs (Jack Deng's Hub)

## 1. Visual Theme & Atmosphere

The design language of `jackdeng.cc` represents a Senior Database & Integration Administrator — engineered, precise, data-driven, and minimalist. 
It blends the "infrastructure made invisible" philosophy of **Vercel** with the "dark-mode-first precision" of **Linear**.

- **Vibe:** Professional, tech-oriented, clean, and highly readable.
- **Concept:** The UI is not a decoration; it is a dashboard. Every pixel must justify its existence.
- **Theme Support:** Full Dark/Light mode support.

## 2. Typography

We use **Geist** (Vercel's open-source font) to achieve an engineered, compressed, and modern aesthetic.

*   **Primary Font (Sans-serif):** `var(--font-geist-sans)` for all headings, body text, and UI elements.
    *   *Headings:* Tight negative letter-spacing (tracking). E.g., `-0.04em` to `-0.05em` for H1/H2 to make them feel authoritative and compressed.
    *   *Body:* Relaxed letter-spacing for high legibility, line-height `1.6` or `1.7`.
*   **Monospace Font (Code & Labels):** `var(--font-geist-mono)` for code blocks, technical tags, metadata (dates, categories), and "Tools Engine" outputs.

## 3. Color Palette

The color system is achromatic (grays/blacks/whites) with a single, highly intentional brand accent color.

### Light Mode (Default)
*   **Background:** `#ffffff` (Pure White)
*   **Surface/Card:** `#fafafa` (Off-white) or transparent with a 1px border.
*   **Text Primary:** `#171717` (Near Black)
*   **Text Secondary:** `#666666` (Medium Gray)
*   **Border:** `rgba(0,0,0,0.08)`
*   **Brand Accent:** `#0a72ef` (Develop Blue - used for primary CTAs and active states).

### Dark Mode
*   **Background:** `#0a0a0a` (Deep Tech Black)
*   **Surface/Card:** `#121212` to `#171717` (Elevated dark surfaces)
*   **Text Primary:** `#ededed` (Off-white, avoids harsh #fff on black)
*   **Text Secondary:** `#a1a1aa` (Zinc-400 equivalent)
*   **Border:** `rgba(255,255,255,0.1)`
*   **Brand Accent:** `#3b82f6` (Blue-500)

## 4. Layout & Spacing Principles

*   **Container:** Max-width of `48rem` (768px) for blog/reading content (Tailwind `max-w-3xl`) and `64rem` (1024px) for the main layout/grid.
*   **Padding/Margins:** Use a base-4 scale (`p-4`, `p-8`, `gap-6`). Generous whitespace between major sections to let the content breathe.
*   **Borders & Shadows (The Vercel Way):** 
    *   Prefer subtle 1px borders (`border border-gray-200 dark:border-gray-800`) over heavy drop shadows.
    *   For elevation, use a multi-layered soft shadow: `box-shadow: 0px 0px 0px 1px rgba(0,0,0,0.08), 0px 2px 4px rgba(0,0,0,0.04)`.
    *   Radius: `rounded-xl` (12px) for cards, `rounded-full` (9999px) for pill tags and primary buttons.

## 5. Core Components (For Cursor/Claude)

When building the **Home Page**, use these exact Tailwind component structures:

### Hero Section
*   **Layout:** Left-aligned or centered, high contrast.
*   **Title:** H1, `<h1 className="text-4xl md:text-6xl font-bold tracking-tight text-black dark:text-white">`
*   **Subtitle/Bio:** `<p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl">`
*   **CTA Buttons:**
    *   Primary: `<button className="bg-black text-white dark:bg-white dark:text-black rounded-full px-6 py-2 font-medium hover:scale-105 transition-transform">`
    *   Secondary: `<button className="border border-gray-200 dark:border-gray-800 rounded-full px-6 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">`

### Skill / Tech Stack Grid
*   Use subtle badges or a subdued grid.
*   `<div className="grid grid-cols-2 md:grid-cols-4 gap-4">`
*   Card item: `<div className="flex items-center space-x-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121212] hover:border-gray-300 dark:hover:border-gray-700 transition-colors">`

### Navigation / Header
*   Floating blurred header (Glassmorphism).
*   `<header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 dark:bg-[#0a0a0a]/70 border-b border-gray-200 dark:border-gray-800">`

## 6. Prompting AI Agents
When generating UI components, prompt the coding agent with:
> *"Read `DESIGN.md`. Build a [Component Name] that strictly follows the typography (Geist), spacing, and color tokens defined here. Ensure flawless Dark/Light mode switching via Tailwind's `dark:` classes. Keep borders subtle, avoid heavy shadows, and use `rounded-xl` for cards."*