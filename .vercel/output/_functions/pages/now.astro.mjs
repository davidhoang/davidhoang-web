import { c as createComponent, r as renderTemplate, a as renderComponent, m as maybeRenderHead } from '../chunks/astro/server_I8Ip0lRh.mjs';
import 'kleur/colors';
import { $ as $$MainLayout } from '../chunks/MainLayout_C6V99_L1.mjs';
/* empty css                               */
export { renderers } from '../renderers.mjs';

const $$Now = createComponent(($$result, $$props, $$slots) => {
  (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "Now | David Hoang", "data-astro-cid-lfnvi74r": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="container" data-astro-cid-lfnvi74r> <div class="hero-title" data-astro-cid-lfnvi74r> <h1 data-astro-cid-lfnvi74r>Now</h1> </div> <div class="now-content" data-astro-cid-lfnvi74r> <h1 data-astro-cid-lfnvi74r>Now</h1> <p data-astro-cid-lfnvi74r>Last updated: Friday, August 1, 2024. Learn more about <a href="https://nownownow.com/" target="_blank" data-astro-cid-lfnvi74r>Now pages</a></p> <div class="now-section" data-astro-cid-lfnvi74r>Add an image here</div> <div class="now-section" data-astro-cid-lfnvi74r> <h2 data-astro-cid-lfnvi74r>What I'm currently up to</h2> <ul data-astro-cid-lfnvi74r> <li data-astro-cid-lfnvi74r>I started at Atlassian as the Head of Design for AI</li> <li data-astro-cid-lfnvi74r>Writing lazy reviews on Letterboxd</li> <li data-astro-cid-lfnvi74r>Aspiring to get the Juggernaught kill streak on Call of Duty</li> <li data-astro-cid-lfnvi74r>Writing a newsletter called Proof of Concept focused on creativity and experimentation</li> <li data-astro-cid-lfnvi74r>Getting back into cycling with my Salsa bike</li> </ul> </div> </div> </div> ` })} `;
}, "/Users/dh/Development/davidhoang-dot-com/src/pages/now.astro", void 0);

const $$file = "/Users/dh/Development/davidhoang-dot-com/src/pages/now.astro";
const $$url = "/now";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Now,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
