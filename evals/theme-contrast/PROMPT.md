# Eval: theme-gen contrast regression gate

Read `design.md` (§ Theme generator) and `.agents/skills/product-design/SKILL.md` before changing theme tooling.

## Goal

A generated daily theme with WCAG AA contrast failures must not ship. Theme generation is gated on passing contrast checks.

## Requirements

1. Keep `scripts/lib/contrast.mjs` as the source of truth for pair checks (`CONTRAST_PAIRS`).
2. Expose a **non-mutating** audit (`auditThemeContrast`) for regression / `--check` mode.
3. Expose an **enforce** path that auto-fixes then hard-fails if any pair still misses 4.5:1.
4. `scripts/generate-daily-theme.mjs` must re-check after surface hue realignment and refuse to save a failing winner.
5. `scripts/audit-theme-contrast.mjs --check` must exit `1` when any theme in `daily-themes.json` fails.
6. Fixtures under `evals/theme-contrast/fixtures/` must keep regressing:
   - `passing-theme.json` → zero failures
   - `failing-theme.json` → one or more failures (and ranking must treat those as hard safety issues)

Do not weaken thresholds below WCAG AA for body text (4.5:1). Do not remove the generation gate.
