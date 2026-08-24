---
title: "Optimizing a Personal Website for AI Agents"
pubDate: 2026-08-11
description: "Treating agent experience as a first-class design surface — what I found, what I changed, and what I deliberately chose not to do."
tags: ["ai", "agents", "web"]
relatedWriting: ["the-formlessness-of-ai-agents"]
---

For most of the web's life, the question behind "who is my site for?" had one answer: people, and the search crawlers that help people find it. That's changing. A growing share of visits now come from AI agents — answer engines summarizing a page, assistants fetching a bio, retrieval bots gathering context for a model. They don't scroll, they don't hover, and they don't care about a hero animation. They want structure, stable endpoints, and clear permissions.

I recently went through davidhoang.com and treated "agent experience" as a first-class design surface, the same way I'd treat mobile or accessibility. This post is a tour of what I found, what I changed, and — just as importantly — what I deliberately chose *not* to do.

## The mental model: discovery, comprehension, action

Before touching any code, it helped to split "agent experience" into three needs:

1. **Discovery** — can an agent find what exists on the site without scraping every page?
2. **Comprehension** — once it has a page, can it extract meaning reliably instead of guessing from markup?
3. **Action** — if it wants to *do* something (search, subscribe), can it do so safely and predictably?

Almost every improvement below maps to one of those three. The site already had a strong classic-web foundation — a permissive `robots.txt`, an auto-generated sitemap, full-text RSS, semantic `<article>` markup, canonical URLs, and some JSON-LD. That's great for search engines and RSS readers. It's only *implicitly* good for agents. The goal was to make the implicit explicit.

## Discovery

### A generated `llms.txt`

`llms.txt` is an emerging convention: a plain-text, Markdown-flavored manifest at `/llms.txt` that tells language models what a site is about and where its important content lives. Think of it as a curated "start here" rather than a full crawl.

The key decision was to **generate it from the site's own content collections and navigation data** rather than hand-maintaining a file that silently rots. It lists the site identity, primary pages, published writing and notes, the RSS feeds, the sitemap, and the search index — and it excludes drafts automatically, because it's built from the same source of truth the rest of the site uses.

A caveat worth stating plainly: `llms.txt` is a *convention*, not a guaranteed ranking or ingestion mechanism. I treat it as low-cost, high-clarity signaling, not a magic funnel.

### A machine-readable discovery contract

Separately from `llms.txt`, I published a small versioned document at `/.well-known/agent.json`. Where `llms.txt` is prose for a model to read, this is structured JSON for a program to parse. It declares:

- site identity and canonical origin
- the discovery resources that already exist (sitemap, RSS feeds, search index, robots)
- the human-facing actions available (subscribe, read, etc.)
- attribution expectations
- an explicit version number

The rule I held myself to: **never advertise an endpoint that doesn't exist.** A discovery contract that lies is worse than none at all, so it only points at things that are actually live.

### A deliberate crawler policy

The site's existing stance was already permissive — allow public content, disallow `/api/`. Rather than change behavior, I made the stance *explicit and documented*. The `robots.txt` now spells out how it treats search, retrieval, and training crawlers, and there's a short policy doc explaining the retrieval-vs-training distinction and how to update the bot list over time.

The honest limitation here: `robots.txt` cannot actually distinguish "retrieve to answer a question" from "retrieve to train a model." Pretending otherwise would be theater. So the policy documents intent and known gaps instead of implying control it doesn't have.

## Comprehension

### Richer structured data

I strengthened the Schema.org JSON-LD across the site: writing posts are now `BlogPosting`, notes are modeled as `CreativeWork` (they're garden notes, not articles, and it felt wrong to overclaim), and both link back to a stable `Person`/`WebSite` graph with consistent entity IDs. Publication and modification dates, language, and keywords are included where the underlying data actually supports them — and *only* where it does. I didn't want to invent a "last modified" date just to look fresh.

### An enriched search index — without breaking anything

The site already exposed `/search-index.json` to power the ⌘K palette. I enriched each entry with canonical URLs, excerpts, dates, tags, and note stages, and made sure the index covers the discoverable static pages rather than silently omitting destinations that are in the sitemap.

This one had a subtle trap. The obvious move was to wrap the array in a versioned envelope (`{ schemaVersion, items }`). But that endpoint is *already public*, and an unknown consumer could be relying on the bare-array shape. So instead of a breaking change, the response stays a bare array and the schema version is advertised through an `X-Search-Index-Schema-Version` header. The command palette tolerates both shapes. Backward compatibility for an endpoint you don't control the consumers of is worth a little inelegance.

### Clean Markdown representations

Rendered HTML is noisy for a machine: navigation, theme toggles, shader backgrounds, and view-transition wrappers all surround a few hundred words of actual prose. So every published writing post and note now has a Markdown twin at `/{slug}.md`, serving the original body with its front matter and a canonical link back to the HTML page. Drafts and internal-only fields never leak. HTML pages advertise the Markdown alternative via `<link rel="alternate" type="text/markdown">`.

The nice property here is that an agent can grab the *content* without parsing the *chrome*.

## Action

### Experimental WebMCP tools

WebMCP is a much newer, browser-native idea: a page can register callable "tools" through `navigator.modelContext`, so an in-browser agent can invoke a real function instead of simulating clicks. It's early — an evolving spec with preview-level browser support — so I treated it as strictly progressive enhancement:

- **feature-detected**, so it's a complete no-op in browsers that don't expose the API
- **no mandatory dependency or polyfill**
- tools are **registered and cleaned up across view transitions** so they don't leak
- read-only tools (site search, indexed navigation) are clearly separated from anything with side effects

The most important guardrail: the newsletter tool **fills and focuses the form but never submits it**. An agent can help a person get to the point of subscribing; it cannot subscribe them. Side effects stay behind an explicit human action.

### Measuring whether any of this matters

Finally, instrumentation — because optimizing for agents without measuring outcomes is just vibes. I added privacy-conscious analytics that classify known answer-engine referrals and record whether search and newsletter interactions succeed. Crucially, it never sends query text, email addresses, page content, or personal data, and query strings are stripped from analytics payloads.

There's a limitation I wrote down rather than hid: browser analytics fundamentally can't see server-side crawler traffic. Bots don't run your client JS. So the measurement doc is explicit that crawler and citation volume has to be read from server-side logs (Vercel's firewall/analytics), not the browser layer. Measuring the wrong thing confidently is worse than admitting the gap.

## What I chose *not* to do

A few deliberate non-goals, because scope discipline is part of the design:

- **No full MCP server.** This is an editorial site, not an app with an API surface worth operating and securing. A lightweight machine-readable layer beats a server I'd have to babysit.
- **No unauthenticated content API that could burn quota.** The existing static JSON and RSS cover the read cases without opening a new abuse vector.
- **No pretending emerging standards are settled.** `llms.txt` and WebMCP are both promising and both early. I shipped them as clearly-scoped, low-risk enhancements, not load-bearing infrastructure.

## Takeaways

If you want to make your own site friendlier to agents, a reasonable order of operations:

1. Publish a generated `llms.txt` and a `/.well-known/agent.json` contract — cheap, honest signaling.
2. Enrich the structured data you already have, without overclaiming facts you don't have.
3. Offer clean content representations (Markdown or documented JSON) so agents skip the chrome.
4. Make your crawler policy explicit, including its limitations.
5. Only then experiment with interactive standards like WebMCP — feature-detected and side-effect-safe.
6. Measure outcomes, and be honest about what your measurement can and can't see.

The throughline across all of it: **be explicit, be honest about limits, and never let an agent take an action a human didn't ask for.** Good agent experience turns out to look a lot like good API design and good accessibility — clarity, structure, and respect for the consumer on the other end.
