import { c as createComponent, r as renderTemplate, m as maybeRenderHead, b as addAttribute, f as renderHead, a as renderComponent, e as renderSlot, d as createAstro } from './astro/server_D6iAjd13.mjs';
import 'kleur/colors';
/* empty css                          */
import 'clsx';

const $$Navigation = createComponent(($$result, $$props, $$slots) => {
  const navItems = [
    { path: "/about", label: "About" },
    { path: "/writing", label: "Writing" },
    { path: "/featured", label: "Featured" },
    { path: "/subscribe", label: "Subscribe" }
  ];
  return renderTemplate`${maybeRenderHead()}<nav data-astro-cid-pux6a34n> <div class="container nav-container" data-astro-cid-pux6a34n> <a href="/" class="logo" data-astro-cid-pux6a34n>DH</a> <ul class="nav-links" data-astro-cid-pux6a34n> ${navItems.map((item) => renderTemplate`<li data-astro-cid-pux6a34n> <a${addAttribute(item.path, "href")} data-astro-cid-pux6a34n>${item.label}</a> </li>`)} </ul> </div> </nav> `;
}, "/Users/dh/Development/davidhoang-dot-com/src/components/Navigation.astro", void 0);

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  return renderTemplate`${maybeRenderHead()}<footer data-astro-cid-sz7xmlte> <div class="container" data-astro-cid-sz7xmlte> <section class="footer-section-email" data-astro-cid-sz7xmlte> <a href="mailto:david[at]davidhoang.com" data-astro-cid-sz7xmlte>david[at]davidhoang.com</a> </section> <section data-astro-cid-sz7xmlte> <div class="footer-grid" data-astro-cid-sz7xmlte> <div class="footer-col" data-astro-cid-sz7xmlte> <h4 data-astro-cid-sz7xmlte>Connect</h4> <ul data-astro-cid-sz7xmlte> <li data-astro-cid-sz7xmlte><a href="https://twitter.com/davidhoang" target="_blank" data-astro-cid-sz7xmlte>Twitter</a></li> <li data-astro-cid-sz7xmlte><a href="https://github.com/davidhoang" target="_blank" data-astro-cid-sz7xmlte>Mastodon</a></li> <li data-astro-cid-sz7xmlte><a href="https://linkedin.com/in/davidhoang" target="_blank" data-astro-cid-sz7xmlte>Letterboxd</a></li> </ul> </div> <div class="footer-col" data-astro-cid-sz7xmlte> <h4 data-astro-cid-sz7xmlte>Content</h4> <ul data-astro-cid-sz7xmlte> <li data-astro-cid-sz7xmlte><a href="http://blog.davidhoang.com" target="_blank" data-astro-cid-sz7xmlte>PersonalBlog</a></li> <li data-astro-cid-sz7xmlte><a href="/rss.xml" data-astro-cid-sz7xmlte>RSS</a></li> <li data-astro-cid-sz7xmlte><a href="https://www.proofofconcept.pub" target="_blank" data-astro-cid-sz7xmlte>Newsletter</a></li> </ul> </div> <div class="footer-col" data-astro-cid-sz7xmlte> <h4 data-astro-cid-sz7xmlte>Resources</h4> <ul data-astro-cid-sz7xmlte> <li data-astro-cid-sz7xmlte><a href="/about" data-astro-cid-sz7xmlte>About</a></li> <li data-astro-cid-sz7xmlte><a href="/now" data-astro-cid-sz7xmlte>Now</a></li> </ul> </div> </div>  </section> <section class="footer-section-copyright" data-astro-cid-sz7xmlte>
&copy; 2002-${currentYear} David Hoang. All rights reserved. "Sometimes to create, one must first destroy." —David, Prometheus
</section> </div> </footer>`;
}, "/Users/dh/Development/davidhoang-dot-com/src/components/Footer.astro", void 0);

const $$Astro = createAstro();
const $$MainLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$MainLayout;
  const {
    title,
    description = "Default site description",
    ogImage = "/public/default-og-image.jpg"
  } = Astro2.props;
  const canonicalURL = new URL(Astro2.url.pathname, Astro2.site);
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><!-- Primary Meta Tags --><title>${title}</title><meta name="title"${addAttribute(title, "content")}><meta name="description"${addAttribute(description, "content")}><!-- Open Graph / Facebook --><meta property="og:type" content="website"><meta property="og:url"${addAttribute(canonicalURL, "content")}><meta property="og:title"${addAttribute(title, "content")}><meta property="og:description"${addAttribute(description, "content")}><meta property="og:image"${addAttribute(ogImage, "content")}><!-- Twitter --><meta property="twitter:card" content="summary_large_image"><meta property="twitter:url"${addAttribute(canonicalURL, "content")}><meta property="twitter:title"${addAttribute(title, "content")}><meta property="twitter:description"${addAttribute(description, "content")}><meta property="twitter:image"${addAttribute(ogImage, "content")}><meta name="generator"${addAttribute(Astro2.generator, "content")}><link rel="preload" href="https://fonts.vercel.com/geist/font.woff2" as="font" type="font/woff2" crossorigin="anonymous">${renderHead()}</head> <body> ${renderComponent($$result, "Navigation", $$Navigation, {})} <main class="container"> ${renderSlot($$result, $$slots["default"])} </main> ${renderComponent($$result, "Footer", $$Footer, {})} </body></html>`;
}, "/Users/dh/Development/davidhoang-dot-com/src/layouts/MainLayout.astro", void 0);

export { $$MainLayout as $ };
