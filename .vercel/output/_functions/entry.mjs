import { renderers } from './renderers.mjs';
import { c as createExports } from './chunks/entrypoint_UcYCMYZl.mjs';
import { manifest } from './manifest_CwvMR43p.mjs';

const serverIslandMap = new Map([
]);;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/featured.astro.mjs');
const _page3 = () => import('./pages/now.astro.mjs');
const _page4 = () => import('./pages/subscribe.astro.mjs');
const _page5 = () => import('./pages/writing.astro.mjs');
const _page6 = () => import('./pages/writing/_---slug_.astro.mjs');
const _page7 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/about.astro", _page1],
    ["src/pages/featured.astro", _page2],
    ["src/pages/now.astro", _page3],
    ["src/pages/subscribe.astro", _page4],
    ["src/pages/writing/index.astro", _page5],
    ["src/pages/writing/[...slug].astro", _page6],
    ["src/pages/index.astro", _page7]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "48f3cea2-d515-45b9-b075-1f53d42ef226",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;

export { __astrojsSsrVirtualEntry as default, pageMap };
