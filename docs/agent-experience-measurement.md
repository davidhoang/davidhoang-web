# Agent experience measurement

Privacy-conscious signals for understanding how people (and AI answer engines) interact with davidhoang.com. This covers **roadmap item 8** only: measurable client outcomes plus how to measure crawler/citation traffic on Vercel.

## Principles

- Prefer existing Vercel Web Analytics (`@vercel/analytics`) — no custom unauthenticated ingest endpoint.
- Send **allowlisted enums only** (source ids, result types, outcomes). Never send query text, email addresses, page content, titles, or paths in custom events.
- Strip sensitive query params (`q`, `email`, `utm_term`, …) from pageview URLs via `beforeSend`.
- Browser analytics **do not see** most AI crawlers. Measure bots server-side.

## Client signals (this repo)

| Event | When | Payload |
| --- | --- | --- |
| `ai_referral` | Known AI answer-engine referrer or mapped `utm_source` | `{ source }` e.g. `chatgpt`, `perplexity` |
| `search_open` | Command palette opens | `{ trigger: keyboard \| click \| unknown }` |
| `search_select` | User chooses a result | `{ resultType: page \| writing \| note }` |
| `search_empty` | Typed query yields no matches | `{ hadQuery: "yes" }` (no query text) |
| `search_error` | Search index fails to load | `{ reason: "index_load" }` |
| `newsletter_submit` | Substack signup form submits | `{ outcome: "attempted", placement, source }` |

Implementation:

- Classification + payloads: `src/utils/agentExperienceMetrics.ts`
- Client bootstrap: `src/scripts/agent-experience.ts`
- Wired from `MainLayout.astro`, `command-palette.ts`, `SubstackSignup.astro`

Newsletter success/failure on Substack’s origin is **not** observable after the cross-origin form POST navigates away. Only the submit attempt on this site is reliable without a proxy endpoint (intentionally avoided).

### Newsletter funnel attribution

Every signup attempt includes two fixed-value dimensions:

- `placement`: `home`, `subscribe`, `writing` (including individual essays), or `other`. This describes where the form was submitted; no page slug or path is sent.
- `source`: an existing AI source ID (including `grok` for `grok.com`), `organic_search` for recognized search-engine referrer hosts, `referral` for other external referrers, `direct` when no referrer is available, or `unknown` when attribution cannot be resolved. A mapped AI `utm_source` takes precedence over referrer classification. Unrecognized AI-tagged campaigns become `other_ai`; campaign text is never sent.

The first source is captured on arrival and retained for the browser tab in memory and `sessionStorage`, under `agent-experience-acquisition`. Only the allowlisted source enum is stored, with no identifier, URL, or referrer. This preserves an AI referral when a visitor moves from an essay to `/subscribe`, including full-page navigation. Storage failures fall back to memory; after a full reload without storage, an internal referrer becomes `unknown`. The source is first-touch for the tab, not a cross-device or time-windowed attribution model.

`direct` includes visits with suppressed referrers; it does not prove that the URL was typed. Search classification uses an explicit host allowlist and cannot distinguish AI answers inside a general search engine. Neither referral events nor attempts establish a confirmed subscription or citation.

In Web Analytics, compare `newsletter_submit` counts by `source` and `placement` to see which discovery channels and signup surfaces produce attempts. Use Substack’s own confirmed subscriptions to assess downstream completion. These aggregate events do not join individual visitors across origins.

The signup integration calls `buildNewsletterSubmitEvent('attempted', getNewsletterAttribution())`. Existing calls without attribution still work and emit `placement: "other"`, `source: "unknown"`.

## Server-side: crawlers & citations (Vercel)

AI training/grounding crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.) typically fetch HTML **without executing JavaScript**. Client analytics and custom events will miss them. Do **not** invent a browser-side “bot pageview” metric.

Measure crawler / citation-adjacent traffic in the Vercel dashboard instead:

1. **Firewall → AI Bots / Bot Management**  
   Put the [AI Bots Managed Ruleset](https://vercel.com/docs/vercel-waf/managed-rulesets#configure-ai-bots-managed-ruleset) in **Log** mode to observe volume by known AI crawlers without blocking discovery traffic you want cited.

2. **Firewall observability**  
   Filter by User-Agent (e.g. `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`) and path prefixes (`/writing`, `/notes`, `/rss.xml`). Use this for crawl frequency and hot content paths.

3. **Runtime / CDN logs**  
   Export or inspect request logs for the same user agents. Useful for correlating spikes after publishing.

4. **Citations**  
   Answer-engine *citations* are not the same as crawler hits. Track human `ai_referral` events (above) for click-through from products that set a referrer/`utm_source`. For citation presence inside ChatGPT/Perplexity/etc., use vendor webmaster tools or manual sampling — not this site’s JS bundle.

5. **robots.txt**  
   Keep public writing/notes crawlable if you want grounding/citations; `/api/` remains disallowed. Bot policy changes belong in Vercel Firewall / `robots.txt`, not analytics hacks.

## Enabling analytics

1. Install is already a direct dependency: `@vercel/analytics`.
2. In the Vercel project, enable **Web Analytics** (and keep **Speed Insights** as today).
3. Deploy — custom events appear under Analytics → Events (plan-dependent).

## Privacy summary

- No first-party cookie consent wall beyond Vercel’s privacy-friendly analytics defaults.
- No PII in custom events; see `isSafeAgentEventPayload` and tests in `tests/agentExperienceMetrics.test.ts`.
- Newsletter attribution stores one allowlisted acquisition label per browser tab in `sessionStorage`; it creates no visitor identifier.
- Local theme preferences in `localStorage` (`preference-tracker`) are unrelated and stay on-device.
