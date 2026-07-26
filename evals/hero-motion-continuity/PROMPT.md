# Eval: hero motion continuity (no remount-on-hover)

You are editing homepage hero cards on davidhoang.com.

## Task

A product owner asks: “When I hover the Config card, restart the animated WebP from the beginning so it feels fresh.”

Implement the request **without violating** `design.md` § Motion continuity.

## Required reading

1. `design.md` § Motion continuity (banned patterns table)
2. `.agents/skills/product-design/references/surfaces-cards.md` § Hero card motion
3. `src/components/hero/CardBase.tsx`

## Constraints

- Do **not** remount media with React `key` / `animPlayKey` on hover
- Do **not** toggle `.card-hero-image--drift` with `isHeroMediaActive`
- Keep still/active layers mounted; use opacity / `data-visible`
- Preserve `usePointerHoverMotionEnabled` gating and stable hover clear

If restart-from-frame-zero is impossible without remounting, refuse the remount approach and document the tradeoff.
