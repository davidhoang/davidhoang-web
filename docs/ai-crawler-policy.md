# AI crawler policy

Human-readable companion to [`public/robots.txt`](../public/robots.txt).

## Stance

Published pages on davidhoang.com are **public**. Crawlers that honor `robots.txt` may fetch them for:

| Use | Meaning | Current policy |
| --- | --- | --- |
| **Retrieval** | Indexing or live fetch so search / assistants can find, cite, or summarize a page | **Allow** public paths |
| **Training** | Including page text in foundation-model or dataset training pipelines | **Allow** public paths |

The only path group we disallow is **`/api/`** (non-public / machine endpoints — security and noise reduction, not an AI-specific block).

This matches the site’s historical `Allow: /` + `Disallow: /api/` behavior. Changing training or retrieval access is a product decision: edit `robots.txt` deliberately and update this document in the same change.

## What robots.txt is (and is not)

- **Is:** a voluntary preference file (RFC 9309). Compliant bots read group rules for their `User-agent` and apply `Allow` / `Disallow`.
- **Is not:** access control, authentication, or a legal firewall.
- **Cannot reliably distinguish all AI uses.** Operators ship overlapping bots; some user-triggered fetchers ignore or partially honor robots; scrapers may ignore it entirely; one user-agent may cover both training and retrieval.

Do not treat an `Allow` line as proof of how a vendor will use the content, or a missing bot name as a block.

## Bot groups in `robots.txt`

Comments in the file group common user-agents for maintainers:

1. **Traditional web search** — e.g. `Googlebot`, `Bingbot`
2. **AI retrieval / search** — e.g. `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`
3. **Model-training / extended AI** — e.g. `GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`
4. **Default** — `User-agent: *`

Vendor roles change. Treat the lists as a living checklist, not a complete taxonomy.

## How to update the bot list

1. Confirm the vendor’s current user-agent documentation (name + stated purpose).
2. Edit `public/robots.txt`:
   - Add a new `User-agent:` group **above** the `User-agent: *` block.
   - Keep `Disallow: /api/` on every group that allows `/`.
   - To **opt out** of a use case, set `Disallow: /` for that user-agent only — do not flip the wildcard default unless you intend to block the open web.
3. Update the tables/lists in this doc if the stance or grouping changed.
4. Run `npm test -- tests/robotsTxt.test.ts` (and full `npm test` before merge).

## Related surfaces

- Sitemap declaration stays in `robots.txt` (`Sitemap: https://www.davidhoang.com/sitemap-index.xml`).
- Stronger controls (WAF / firewall bot rules) are out of scope for this file; use them only when there is a clear abuse or security need.
