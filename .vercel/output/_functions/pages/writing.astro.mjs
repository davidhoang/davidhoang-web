import { c as createComponent, r as renderTemplate, a as renderComponent, m as maybeRenderHead, b as addAttribute } from '../chunks/astro/server_D6iAjd13.mjs';
import 'kleur/colors';
import { $ as $$MainLayout } from '../chunks/MainLayout_BEGbyjIa.mjs';
import { g as getCollection, $ as $$SidebarWriting } from '../chunks/SidebarWriting_Dg2p-G6j.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const posts = await getCollection("writing");
  console.log("Posts:", posts);
  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "Writing | David Hoang", "data-astro-cid-cp3zdscb": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="container" data-astro-cid-cp3zdscb> <div class="hero-title" data-astro-cid-cp3zdscb> <h1 data-astro-cid-cp3zdscb>Writing</h1> </div> <div class="content-grid" data-astro-cid-cp3zdscb> <div class="posts-list" data-astro-cid-cp3zdscb> <ul class="posts-list" data-astro-cid-cp3zdscb> ${posts.map((post) => renderTemplate`<li data-astro-cid-cp3zdscb> <a${addAttribute(`/writing/${post.slug}`, "href")} data-astro-cid-cp3zdscb> <div class="post-row" style="display: flex; justify-content: space-between; align-items: center;" data-astro-cid-cp3zdscb> ${post.data.title} <time${addAttribute(post.data.pubDate, "datetime")} data-astro-cid-cp3zdscb> ${new Date(post.data.pubDate).toLocaleDateString()} </time> </div> </a> </li>`)} </ul> </div> ${renderComponent($$result2, "SidebarWriting", $$SidebarWriting, { "data-astro-cid-cp3zdscb": true })} </div> </div> ` })} `;
}, "/Users/dh/Development/davidhoang-dot-com/src/pages/writing/index.astro", void 0);

const $$file = "/Users/dh/Development/davidhoang-dot-com/src/pages/writing/index.astro";
const $$url = "/writing";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
