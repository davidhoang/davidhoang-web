# Proof of Concept Ventures

Public front door for the fund. Canonical page: [`/fund`](https://www.davidhoang.com/fund). Markdown: [`/poc-ventures.md`](https://www.davidhoang.com/poc-ventures.md).

This is **not** a fundraising page. It is a simple inquiry site in the spirit of [The Phamily Office](https://thephamilyoffice.com): name, mission, selected companies, a way to reach David.

---

## Purpose

- Give founders (and anyone else) a quiet place to understand the fund and get in touch.
- Keep the personal site (`/investing`) as the longer angel/advisory list; this page is the fund door.
- Stay usable if a SquareSpace-registered domain later points here.

---

## Include (public)

| Field | Copy |
| --- | --- |
| Name | Proof of Concept Ventures |
| Tagline | A front door for founders. |
| Mission | Investing in pre-seed and seed companies building tools that revolutionize the internet — and in founders looking for the winning interaction layer in the paradigm shift of AI. |
| Mission detail | The fund exists to seed the next generation of software builders, especially teams working on design and developer tools, empowering products, computer vision, and AI-first applications. |
| GP | David Hoang |
| Inquire | [david@davidhoang.com](mailto:david@davidhoang.com) · [@davidhoang](https://x.com/davidhoang) on X |
| Selected investments | Names only, no dates. Link when a public site is known. |

### Selected investments

- Proto
- [Fuser Studio](https://fuser.studio/)
- [Paper](https://paper.design/)
- [Sunflower](https://sunflower.me/)
- [Turf Sports](https://turfsports.com/)
- [Flint](https://www.tryflint.com/)
- [Visual Electric](https://visualelectric.com/)
- [Ozu](https://ozu.ai)
- [Liveblocks](https://liveblocks.io/)
- [Daydream](https://www.withdaydream.com/)
- [Ditto](https://www.dittowords.com/)
- [Opal Camera](https://opalcamera.com/)
- [Texts.com](https://texts.com/)
- [Galileo](https://www.usegalileo.ai/explore)
- [Eraser](https://www.eraser.io/)
- [Passionfroot](https://www.passionfroot.me/)
- [Open Sauced](https://opensauced.pizza/)
- [Muse](https://museapp.com/)
- [Theatre.js](https://www.theatrejs.com/)
- Startupy
- [Cycle](https://www.cycle.app/)
- [Carrd](https://carrd.co/)

---

## Do not include (confidential / fundraising)

Never publish on `/fund`, this markdown file, OG text, search index blurbs, or a custom-domain homepage:

- Fund size, check size, number of deals, reserve percentage, or investment period
- Limited-partner names, commitments, or mechanics (carry, fees, call schedule, GP contribution)
- Any allocate / subscribe / raise CTA, deck links, or “invest here” language
- Deal-source lists framed as proprietary access, or anything marked private in the working notes

The working notes live in a private Google Doc. Treat that doc as **source for humans**, not as copy-paste for the site.

---

## Voice and layout

Match a family-office / micro-fund homepage, not a pitch deck:

- Short paragraphs. No hero metrics. No charts.
- Selected investments as a simple bullet list of names (links optional).
- One inquire action (`mailto:`). X is a secondary reach-out, not a feed embed.
- No limited-partner portal, no password, no waitlist-to-allocate language.
- On davidhoang.com, use existing tokens and `.content-page*` primitives. Do not invent a second visual system. Do not put this in the top nav — footer + command palette + `/investing` cross-link is enough.

---

## Implementation map

| Concern | Where |
| --- | --- |
| This contract | `poc-ventures.md` (repo root) |
| Typed copy for the page | `src/data/pocVentures.ts` |
| HTML page | `src/pages/fund.astro` |
| Markdown route | `src/pages/poc-ventures.md.ts` → `/poc-ventures.md` |
| Discovery | `src/data/navigation.ts` (footer, mobile secondary, command palette) |

If you change public copy, update **both** `poc-ventures.md` and `src/data/pocVentures.ts`. Tests fail if forbidden fundraising/LP strings appear in either file or the page.

---

## SquareSpace domain → this page

Buy or move the domain in SquareSpace, then point it at this Astro/Vercel app. Two supported setups:

### Option A — URL forward (fastest)

In SquareSpace Domains, forward the apex and `www` to:

`https://www.davidhoang.com/fund`

Use a 301 if SquareSpace offers it. This is enough for a front door. Visitors always land on the fund page on the personal site.

### Option B — Domain on Vercel (the domain *is* the site)

1. In **Vercel** → this project → **Settings → Domains**, add `example.com` and `www.example.com`.
2. In **SquareSpace → DNS**, use the records Vercel shows (typically apex `A` records to Vercel IPs, `www` `CNAME` to `cname.vercel-dns.com`). Do not keep SquareSpace parking/forwarding records at the same time.
3. Add a host-conditioned rewrite in `vercel.json` so the custom domain always serves the fund page, not the personal homepage:

```json
{
  "source": "/:path*",
  "has": [{ "type": "host", "value": "www.example.com" }],
  "destination": "/fund"
}
```

Repeat the `has` block for the apex host if needed. Do this **only after** the real domain is known — do not guess a domain in git.

Until that rewrite exists, visiting the connected domain’s `/` will show davidhoang.com’s home page. `/fund` will still work on both hosts.

---

## Related public pages

- Personal investing list: `/investing`
- Newsletter (different property): [proofofconcept.pub](https://www.proofofconcept.pub)
- Inquire: [david@davidhoang.com](mailto:david@davidhoang.com)
