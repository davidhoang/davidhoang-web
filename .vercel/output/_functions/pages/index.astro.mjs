import { c as createComponent, r as renderTemplate, a as renderComponent, m as maybeRenderHead } from '../chunks/astro/server_I8Ip0lRh.mjs';
import 'kleur/colors';
import { $ as $$MainLayout } from '../chunks/MainLayout_C6V99_L1.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "David Hoang", "data-astro-cid-j7pv25f6": true }, { "default": ($$result2) => renderTemplate`  ${maybeRenderHead()}<section class="hero-grid" data-astro-cid-j7pv25f6> <div class="hero-content" data-astro-cid-j7pv25f6> <h1 data-astro-cid-j7pv25f6>Investing and building tools that revolutionize the internet.</h1> <p data-astro-cid-j7pv25f6>I'm David (DH). I'm an investor, advisor, and designer.</p> <p data-astro-cid-j7pv25f6>Getting started:</p> <ul data-astro-cid-j7pv25f6> <li data-astro-cid-j7pv25f6>Subscribe to <a href="https://www.proofofconcept.pub" target="_blank" data-astro-cid-j7pv25f6>Proof of Concept</a>, my Newsletter</li> <li data-astro-cid-j7pv25f6>Buy the zine, <a href="#" data-astro-cid-j7pv25f6>Proof of Concept: The 000 Series</a></li> <li data-astro-cid-j7pv25f6><a href="https://github.com/davidhoang" data-astro-cid-j7pv25f6>Follow me on GitHub</a></li> <li data-astro-cid-j7pv25f6><a href="#" data-astro-cid-j7pv25f6>Watch my talk from Config 2021</a></li> <li data-astro-cid-j7pv25f6><a href="#" data-astro-cid-j7pv25f6>Listen to my interview on Dive Club</a></li> </ul> </div> <div class="hero-image" data-astro-cid-j7pv25f6> <img src="/images/img-dh.png" alt="Photo of David" width="400" data-astro-cid-j7pv25f6> </div> </section>  <section class="newsletter-section" data-astro-cid-j7pv25f6> <h2 data-astro-cid-j7pv25f6>Subscribe to my newsletter</h2> <div class="newsletter-embed" data-astro-cid-j7pv25f6> <iframe src="https://www.proofofconcept.pub/embed" width="100%" height="150" frameborder="0" scrolling="no" data-astro-cid-j7pv25f6></iframe> </div> </section>  ` })}`;
}, "/Users/dh/Development/davidhoang-dot-com/src/pages/index.astro", void 0);

const $$file = "/Users/dh/Development/davidhoang-dot-com/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
