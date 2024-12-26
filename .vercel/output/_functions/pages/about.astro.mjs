import { c as createComponent, r as renderTemplate, a as renderComponent, m as maybeRenderHead } from '../chunks/astro/server_I8Ip0lRh.mjs';
import 'kleur/colors';
import { $ as $$MainLayout } from '../chunks/MainLayout_C6V99_L1.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$About = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": "About", "data-astro-cid-kh7btl4r": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="container" data-astro-cid-kh7btl4r> <div class="hero-title" data-astro-cid-kh7btl4r> <h1 data-astro-cid-kh7btl4r>About</h1> </div> <div class="hero-grid" data-astro-cid-kh7btl4r> <div data-astro-cid-kh7btl4r> <p data-astro-cid-kh7btl4r>I'm David—known as DH in the workplace because the abundant colleagues with the same first name. I'm early in my career with 20 years experience in the industry. The love for design and software started when I graduated from college with my BFA in Drawing and Painting. My studies encouraged multi-disciplinary studies and led to me taking electives in Computer Science, Art History,  and the Humanities. Upon matriculation, I took what's now called a gap year to prepare for my MFA. I never did, and instead started designing app interfaces for a new device called the iPhone.</p> <p data-astro-cid-kh7btl4r>Fast forward to today, I'm investing and building tools that revolutionize the internet. I'm currently VP- Head of Design, AI at Atlassian, independent angel investor, and advisor for startups. Previously I was VP of Marketing and Design at Replit and the first Head of Design at One Medical and <a href="https://webflow.com" target="_blank" data-astro-cid-kh7btl4r>Webflow</a>.</p> <p data-astro-cid-kh7btl4r>I grew up in the Pacific Northwest and now call California home in Palm Springs and San Francisco.</p> </div> <div data-astro-cid-kh7btl4r> <!-- You can add an image here --> <img src="/images/img-dh.png" alt="Photo of David" width="500" data-astro-cid-kh7btl4r> </div> </div> </div> ` })} `;
}, "/Users/dh/Development/davidhoang-dot-com/src/pages/about.astro", void 0);

const $$file = "/Users/dh/Development/davidhoang-dot-com/src/pages/about.astro";
const $$url = "/about";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$About,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
