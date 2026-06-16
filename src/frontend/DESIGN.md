# Design Brief

## Direction

MediCore Pro — Enterprise healthcare management with precision-grade UI clarity

## Tone

Dark-mode enterprise SaaS: deep navy-slate backgrounds, orange action accents, glassmorphism cards — authoritative without being cold

## Differentiation

Glassmorphism card layers on a deep navy backdrop with a vivid orange CTA system creates instant visual authority — every action pops against the dark field

## Color Palette

| Token      | OKLCH         | Role                        |
| ---------- | ------------- | --------------------------- |
| background | 0.12 0 0      | Deep near-black base        |
| foreground | 0.96 0 0      | High-contrast white text    |
| card       | 0.16 0.03 280 | Blue-tinted glass surface   |
| primary    | 0.38 0.18 265 | Dark blue #1e40af equivalent|
| accent     | 0.62 0.21 31  | Vivid orange #f97316 equiv  |
| muted      | 0.24 0 0      | Subtle de-emphasized areas  |

## Typography

- Display: GeneralSans — headings, labels, stat values
- Body: GeneralSans — all body copy
- Scale: hero `text-4xl font-bold`, h1 `text-2xl font-bold`, label `text-xs uppercase tracking-wider`, body `text-sm`

## Elevation & Depth

Three layers: `.glass` (cards), `.glass-elevated` (primary panels), sidebar/navbar flat — depth through transparency, not shadow height

## Structural Zones

| Zone    | Background              | Border         | Notes                              |
| ------- | ----------------------- | -------------- | ---------------------------------- |
| Sidebar | `bg-sidebar`            | `border-r`     | Blue-tinted, role label + nav      |
| Navbar  | `bg-card`               | `border-b`     | Elevated search + user menu        |
| Content | `bg-background`         | —              | Page canvas, glass cards layered   |
| Footer  | Inline in login only    | `border-t`     | Attribution link                   |

## Spacing & Rhythm

`p-6` page padding, `space-y-6` section rhythm, `gap-4` grid gutters, `px-5 py-4` card headers

## Component Patterns

- Buttons: orange CTAs (`bg-accent`), ghost variants for secondary, rounded-lg
- Cards: `.glass-elevated` with `rounded-xl shadow-glass-sm`, divide-y rows
- Badges: `variant="outline"` with role-colored `bg/text/border` trio

## Motion

- Entrance: none (dashboard data is utility-first, not showcase)
- Hover: `transition-smooth` on all interactive elements (0.3s cubic)
- Decorative: none

## Constraints

- Never raw color classes — always semantic tokens
- No light mode — dark enterprise theme only
- Tables: sticky header pattern for long lists, right-align numbers

## Signature Detail

Role-colored badge trio (bg/text/border all tinted same hue) on the navbar user chip — each role instantly recognizable without text
