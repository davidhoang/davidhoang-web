import { c as createComponent, r as renderTemplate, a as renderComponent, d as createAstro, m as maybeRenderHead, b as addAttribute, e as renderSlot } from '../../chunks/astro/server_I8Ip0lRh.mjs';
import 'kleur/colors';
import { $ as $$SidebarWriting, g as getCollection } from '../../chunks/SidebarWriting_nPTbrexD.mjs';
import { $ as $$MainLayout } from '../../chunks/MainLayout_C6V99_L1.mjs';
/* empty css                                     */
export { renderers } from '../../renderers.mjs';

const $$Astro$1 = createAstro();
const $$BlogPost = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$BlogPost;
  const { data, render } = Astro2.props;
  const { title, description, pubDate } = data;
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": title, "data-astro-cid-bvzihdzo": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<article class="blog-post" data-astro-cid-bvzihdzo> <div class="container" data-astro-cid-bvzihdzo> <div class="content-grid" data-astro-cid-bvzihdzo> <div class="main-content" data-astro-cid-bvzihdzo> <h1 data-astro-cid-bvzihdzo>${title}</h1> <time${addAttribute(pubDate, "datetime")} data-astro-cid-bvzihdzo> ${new Date(pubDate).toLocaleDateString()} </time> <div class="prose-content" data-astro-cid-bvzihdzo> ${renderSlot($$result2, $$slots["default"])} </div> </div> ${renderComponent($$result2, "SidebarWriting", $$SidebarWriting, { "data-astro-cid-bvzihdzo": true })} </div> </div> </article> ` })} `;
}, "/Users/dh/Development/davidhoang-dot-com/src/layouts/BlogPost.astro", void 0);

const $$Astro = createAstro();
async function getStaticPaths() {
  const posts = await getCollection("writing");
  return posts.map((post) => {
    console.log("Post in getStaticPaths:", post);
    return {
      params: { slug: post.slug },
      props: { post }
    };
  });
}
const $$ = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$;
  console.log("Astro.props:", Astro2.props);
  const { post } = Astro2.props;
  if (!post) {
    throw new Error("Post is undefined");
  }
  const { Content } = await post.render();
  return renderTemplate`${renderComponent($$result, "BlogPost", $$BlogPost, { "data": post.data }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Content", Content, {})} ` })}`;
}, "/Users/dh/Development/davidhoang-dot-com/src/pages/writing/[...slug].astro", void 0);

const $$file = "/Users/dh/Development/davidhoang-dot-com/src/pages/writing/[...slug].astro";
const $$url = "/writing/[...slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
