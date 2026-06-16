# HealthMatrix360 — Design Brief

## Purpose & Tone
Modern healthcare platform for multi-hospital management. Professional, trustworthy, accessible. Tone: clinical clarity without coldness.

## Aesthetic
Light/dark mode with intent. Light: clean white surfaces, navy text, teal/blue accents, orange CTAs. Dark: deep navy backgrounds, white text, same accent palette. Glassmorphism for depth, no skeuomorphism.

## Color Palette

| Name | Light | Dark | Purpose |
|------|-------|------|----------|
| Background | 0.98 0.005 260 | 0.11 0.01 260 | Page base |
| Foreground | 0.12 0.01 260 | 0.96 0.005 260 | Text default |
| Card | 0.99 0 0 | 0.16 0.025 265 | Elevated surface |
| Primary (Blue) | 0.5 0.18 265 | 0.55 0.18 265 | Main actions |
| Accent (Orange) | 0.68 0.22 31 | 0.68 0.22 31 | CTAs, highlights |
| Destructive | 0.62 0.22 25 | 0.62 0.22 25 | Danger actions |
| Muted | 0.88 0.01 260 | 0.22 0.015 265 | Disabled, secondary |
| Border | 0.92 0.01 260 | 0.26 0.02 265 | Dividers, strokes |

## Typography
Display: GeneralSans 700–900 | Body: GeneralSans 400–600 | Mono: GeneralSans

## Structural Zones
- Navbar: elevated card with glassmorphism, theme toggle right-aligned
- Sidebar: muted bg, navy text (light) / dark bg (dark), primary accent on active
- Content: background base with card-based grid layout
- Footer: muted border-top, reduced opacity text

## Components
Buttons: primary (blue), secondary (muted), destructive (red), accent (orange). States: default, hover (+opacity), active (glow), disabled (-contrast). Cards: glass, glass-sm, glass-elevated. Inputs: minimal style, blue ring on focus. Tables: zebra-stripe with muted-200, hover highlight.

## Motion
Smooth: 0.3s cubic-bezier(0.4, 0, 0.2, 1). Fade-in on mount. No bounce, no jank.

## Constraints
- No gradients on text. No neon shadows. No arbitrary colors. All from OKLCH tokens.
- Dark mode: ensure 0.45+ chroma for accent visibility against 0.16 card. Light mode: 0.5+ L difference text/bg.
- Theme stored in localStorage, applied on mount via `document.documentElement.classList.toggle('dark')`.

## Signature Detail
Theme toggle in navbar as a subtle icon button with smooth class transition. Glassmorphism on all elevated surfaces to reinforce unified visual language across light/dark.
