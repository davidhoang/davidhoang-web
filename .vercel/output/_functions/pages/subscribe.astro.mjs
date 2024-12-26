import { c as createComponent, r as renderTemplate, a as renderComponent, m as maybeRenderHead } from '../chunks/astro/server_D6iAjd13.mjs';
import 'kleur/colors';
import { $ as $$MainLayout } from '../chunks/MainLayout_BEGbyjIa.mjs';
/* empty css                                     */
export { renderers } from '../renderers.mjs';

const $$Subscribe = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "Subscribe", "data-astro-cid-ajzedo7x": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="container" data-astro-cid-ajzedo7x> <section class="hero-title" data-astro-cid-ajzedo7x> <h1 data-astro-cid-ajzedo7x>Proof of Concept</h1> </section> <section data-astro-cid-ajzedo7x> <p data-astro-cid-ajzedo7x>Proof of Concept is digital newsletter publication that explores experimentation and maximizing your creative output. You'll receive a free issue every Sunday. I appreciate your readership!</p><p data-astro-cid-ajzedo7x></p></section> <section class="newsletter-section" data-astro-cid-ajzedo7x> <h2 data-astro-cid-ajzedo7x>Subscribe to my newsletter</h2> <div class="newsletter-embed" data-astro-cid-ajzedo7x> <iframe src="https://www.proofofconcept.pub/embed" width="100%" height="150" frameborder="0" scrolling="no" data-astro-cid-ajzedo7x></iframe> </div> </section> </div> ` })} `;
}, "/Users/dh/Development/davidhoang-dot-com/src/pages/subscribe.astro", void 0);

const $$file = "/Users/dh/Development/davidhoang-dot-com/src/pages/subscribe.astro";
const $$url = "/subscribe";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Subscribe,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
