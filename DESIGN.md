# Design System — Proteger Salud Tickets

## Color strategy: Restrained
Tinted dark neutrals + one green accent (≤10% of surface). Blue as secondary for interactive states.

## Colors
- Base: #050509 (near-black, blue-tinted)
- Surface: #0d0d1a
- Card: #12121f
- Elevated: #1a1a2e
- Accent green: #00e5a0 (teal-green, active states, CTAs)
- Accent blue: #3b82f6 (info, links, secondary)
- Text primary: #f8fafc
- Text secondary: #94a3b8
- Text muted: #475569
- Text faint: #334155
- Border subtle: rgba(255,255,255,0.07)
- Border strong: rgba(255,255,255,0.12)

## Status colors
- Open: #34d399 (emerald)
- In progress: #3b82f6 (blue)
- Waiting: #f59e0b (amber)
- Resolved: #8b5cf6 (violet)
- Closed: #64748b (slate)

## Priority colors
- Urgent: #f87171 (red) + pulse animation
- High: #fbbf24 (amber)
- Medium: #60a5fa (blue)
- Low: #94a3b8 (slate)

## Typography
- Sans: Geist Sans (via next/font)
- Mono: Geist Mono (ticket numbers, codes)
- Scale: 10px micro-labels → 11px small → 12px body-sm → 13px body → 14px body-md → 16px title → 20px h2 → 28–48px hero

## Spacing
- Base unit: 4px
- Component padding: 16px (p-4) cards, 20px (p-5) panels
- Page padding: 24px (p-6)
- Gap between cards: 16px (gap-4)

## Border radius
- Small elements: rounded-lg (8px)
- Cards/panels: rounded-2xl (16px)
- Buttons: rounded-xl (12px)
- Badges/pills: rounded-full

## Elevation
No box-shadow by default. Subtle glow shadows for metric cards (color-tinted, very low opacity). Borders define elevation hierarchy.

## Motion
- Fade in: 0.3s ease-out on page load
- Skeleton shimmer: 1.8s infinite linear
- Hover transitions: 150ms
- Sidebar drawer: 300ms ease-in-out translate

## Components
- Button primary: gradient from #00e5a0 to #00c87d, dark text
- Input/Select: bg-elevated, subtle border, green focus ring
- Badge: pill shape, color-tinted bg + matching border
- Sidebar: dark surface, active item = green tint + border
