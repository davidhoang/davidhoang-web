# Agent design evals

Fixtures for measuring whether coding agents follow `design.md` when building UI. Based on the workflow described in [Teaching agents product design at Vercel](https://vercel.com/blog/teaching-agents-product-design-at-vercel).

## Stack

| Layer | This repo |
|-------|-----------|
| Design contract | `design.md` + `src/design-guide.md` |
| Canonical skill | `.agents/skills/product-design/` |
| Cursor entry | `.cursor/skills/product-design/`, `.cursor/rules/design-system.mdc` |
| Lint rules | `npm run audit:design:check` (CI) · `npm run audit:ui:changed -- --check` (cloud agents) |
| Theme contrast | `npm run audit-contrast:check` · `evals/theme-contrast/` |
| Automated tests | `tests/designCompliance.test.ts` + `evals/**/EVAL.ts` (vitest) |
| Agent evals | This folder + optional `@vercel/agent-eval` |

## Running vitest checks

```bash
npm run audit:design   # lint design.md rules
npm run audit-contrast:check  # WCAG AA gate on daily-themes.json
npm test               # includes designCompliance + evals/**/EVAL.ts
```

### Theme contrast regression (`evals/theme-contrast/`)

Protects accessibility as daily themes change. Fixtures lock the contract:

- `fixtures/passing-theme.json` must audit clean
- `fixtures/failing-theme.json` must surface contrast failures
- Ranking treats `contrast:*` issues as hard safety (same tier as viewport overflow)
- `scripts/generate-daily-theme.mjs` re-enforces contrast after surface harmony and refuses to save a failing winner

## Running full agent evals (optional)

Requires `AI_GATEWAY_API_KEY` and `VERCEL_TOKEN` in `.env`.

```bash
npx @vercel/agent-eval init davidhoang-ui-evals   # one-time scaffold (separate dir)
# Copy evals/card-component/ from this repo into the scaffold's evals/ folder
npx @vercel/agent-eval --dry                      # preview
npx @vercel/agent-eval                          # run
```

Each eval folder needs:

- `PROMPT.md` — task for the agent (must reference design.md and `.agents/skills/product-design/`)
- `EVAL.ts` — vitest assertions on generated output
- `package.json` — project deps for the sandbox

## Human-led update loop

When an eval or PR review reveals repeated agent mistakes:

1. Log in `.agents/skills/product-design/references/coverage-gaps.md`
2. Add a concrete rule or example to `design.md`
3. If nav-specific, update `.cursor/rules/site-nav-css.mdc` or `references/surfaces-nav.md`
4. If checkable mechanically, add a rule to `scripts/design-audit/rules/`
5. Add or extend an eval fixture under `evals/`
6. Re-run `npm run audit:design` and the eval

Future: before/after fixtures under `evals/<name>/before|after/` when running evals in CI regularly.
