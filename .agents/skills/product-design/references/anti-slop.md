# Anti-slop rules

What makes a page read as AI-generated is rarely one bad choice. It's a stack of defaults nobody picked on purpose. This list adapts the [Impeccable](https://github.com/pbakaus/impeccable) craft floor to davidhoang.com. Every item with a rule ID is enforced by `npm run audit:design:check` (core tier, CI). The judgment items at the bottom can't be machine-checked, so review them by eye.

## Enforced (CI fails)

| Rule ID | Don't | Do instead |
|---------|-------|------------|
| `slop-gradient-text` | `background-clip: text` over a gradient, Tailwind `bg-clip-text bg-gradient-*` | Emphasis from weight, size, or the theme's link color |
| `slop-side-stripe` | A colored `border-left`/`border-right` ≥3px (≥2px on rounded boxes) on cards, callouts, list items | A full 1px `--color-border` hairline, a `--color-sidebar-bg` tint, or nothing. **Exempt:** `blockquote` (a typographic convention), transparent rails, and CSS chevrons drawn from rotated borders |
| `slop-bounce-easing` | `cubic-bezier` with y outside [-0.1, 1.1] (overshoot), `bounce`/`elastic`/`wobble` keyframes, `animate-bounce` | `--ease-emphasized` (exponential ease-out) or `--ease-standard` |
| `slop-hard-offset-shadow` | Zero-blur block shadows with ≥2px offset (`4px 4px 0`, the "pressed 3D button") | An offset plus a soft blur (`0 8px 20px -6px …`). 1px zero-blur hairlines are fine |
| `slop-glow-halo` | Zero-offset colored glows (`0 0 12px var(--color-accent)`), pulsing glow keyframes | No glow. State goes in color or a static mark |
| `slop-decorative-glass` | `backdrop-filter: blur()` on content surfaces (cards, tiles, sections) | Opaque surfaces. Blur is allowed only on chrome over moving content: nav, palette, overlays, modals, menus, the timeline pill, `card-glass-mode` |
| `slop-ai-palette` | The indigo→violet→fuchsia SaaS gradient (`#667eea → #764ba2`, `from-purple-500`, …) | Theme tokens. The daily theme owns color |
| `slop-extreme-tracking` | `letter-spacing` below `-0.04em` | `-0.02em` to `-0.03em` for display type |
| `slop-kicker` | An eyebrow/kicker label (`.text-eyebrow`, `*__eyebrow`, `kicker`, `overline`) directly above a heading | Delete it. Fold real information into the heading or lede. **Exempt:** `.text-eyebrow--link` breadcrumb back-links (navigation). `.text-eyebrow` *on* a heading element is fine: that's a small heading, not a kicker |
| `slop-emoji-icon` | Pictographic emoji (✨ 🚀 ✅ ⚡) as UI iconography in components | An SVG icon. Typographic arrows (`↗` `→` `↵`) are fine |

**Escape hatch:** if a flagged pattern is genuinely the right call, add a comment on that line or the line above: `/* slop-ok: slop-side-stripe — reason */`. A suppression without a reason should fail review.

## Judgment (review by eye)

- **Identical card grids as page structure.** Icon + heading + two lines, repeated, is the lazy container. Vary the rhythm or use a list. Never nest cards.
- **Hero-metric template.** Big number, small label, three supporting stats. Don't do it unless the numbers *are* the story.
- **Numbered section markers** (01 / 02 / 03) unless the order carries meaning.
- **One entrance animation on every section.** One authored motion moment per page, not a fade-up on everything.
- **Monospace as "technical" costume.** Mono is for code, data, and measurements.
- **Gray text on colored surfaces.** Tint secondary text from the surface hue or the foreground.
- **Copy theater.** "Unlock", "seamless", "supercharge", "elevate", aphoristic triplets. Write the way David writes.
- **Browser surfaces.** Selection color, caret, scrollbar, and focus ring should come from the palette, not browser defaults.

## Adding a rule

Follow `scripts/design-audit/README.md` § Adding a rule. Slop rules live in `scripts/design-audit/rules/slop.mjs`, and each one needs a fixture test in `tests/designCompliance.test.ts` that proves it fires.
