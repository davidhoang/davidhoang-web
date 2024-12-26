import 'cookie';
import 'kleur/colors';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_BQVHEq8-.mjs';
import 'es-module-lexer';
import { g as decodeKey } from './chunks/astro/server_I8Ip0lRh.mjs';
import 'clsx';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/dh/Development/davidhoang-dot-com/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"inline","content":"[data-astro-image]{width:100%;height:auto;object-fit:var(--fit);object-position:var(--pos);aspect-ratio:var(--w) / var(--h)}[data-astro-image=responsive]{max-width:calc(var(--w) * 1px);max-height:calc(var(--h) * 1px)}[data-astro-image=fixed]{width:calc(var(--w) * 1px);height:calc(var(--h) * 1px)}\n"}],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_slug_.ctMhzbL-.css"},{"type":"inline","content":".content-section[data-astro-cid-kh7btl4r]{margin:2rem 0}.about-image-placeholder[data-astro-cid-kh7btl4r]{width:100%;height:400px;background:#f5f5f5;border-radius:12px}\n"}],"routeData":{"route":"/about","isIndex":false,"type":"page","pattern":"^\\/about\\/?$","segments":[[{"content":"about","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/about.astro","pathname":"/about","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_slug_.ctMhzbL-.css"},{"type":"inline","content":".featured-grid[data-astro-cid-tncll5x4]{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:0rem;margin:1rem 0rem}.featured-item[data-astro-cid-tncll5x4]{overflow:hidden}.read-more[data-astro-cid-tncll5x4]{display:inline-block;margin-top:1rem;color:var(--primary-color);text-decoration:none}.read-more[data-astro-cid-tncll5x4]:hover{text-decoration:underline}\n"}],"routeData":{"route":"/featured","isIndex":false,"type":"page","pattern":"^\\/featured\\/?$","segments":[[{"content":"featured","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/featured.astro","pathname":"/featured","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_slug_.ctMhzbL-.css"},{"type":"inline","content":".now-content[data-astro-cid-lfnvi74r]{max-width:700px;margin:0 auto;padding:2rem 0}.subtitle[data-astro-cid-lfnvi74r]{color:#666;font-size:1.2rem;margin-bottom:3rem}.now-section[data-astro-cid-lfnvi74r]{margin-bottom:3rem}.now-section[data-astro-cid-lfnvi74r] h2[data-astro-cid-lfnvi74r]{font-size:1.5rem;margin-bottom:1rem;color:var(--primary-color)}.now-section[data-astro-cid-lfnvi74r] ul[data-astro-cid-lfnvi74r]{list-style-type:none;padding:0;margin:0}.now-section[data-astro-cid-lfnvi74r] li[data-astro-cid-lfnvi74r]{margin-bottom:.5rem;margin-left:2rem;font-size:1.1rem;list-style-type:disc}.now-footer[data-astro-cid-lfnvi74r]{margin-top:4rem;padding-top:2rem;border-top:1px solid #eee;font-size:.9rem;color:#666}.now-page-info[data-astro-cid-lfnvi74r]{margin-top:.5rem;font-style:italic}@media (max-width: 768px){.now-content[data-astro-cid-lfnvi74r]{padding:1rem}.subtitle[data-astro-cid-lfnvi74r]{font-size:1.1rem;margin-bottom:2rem}.now-section[data-astro-cid-lfnvi74r]{margin-bottom:2rem}}\n"}],"routeData":{"route":"/now","isIndex":false,"type":"page","pattern":"^\\/now\\/?$","segments":[[{"content":"now","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/now.astro","pathname":"/now","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_slug_.ctMhzbL-.css"},{"type":"inline","content":".subscribe-wrapper[data-astro-cid-ajzedo7x]{max-width:600px;margin:0 auto;padding:2rem}.subscribe-content[data-astro-cid-ajzedo7x]{background:#fff;padding:2rem;border-radius:12px;box-shadow:0 2px 8px #0000001a}.subscribe-form[data-astro-cid-ajzedo7x]{margin-top:2rem}.form-group[data-astro-cid-ajzedo7x]{margin-bottom:1.5rem}label[data-astro-cid-ajzedo7x]{display:block;margin-bottom:.5rem;color:var(--primary-color)}input[data-astro-cid-ajzedo7x][type=text],input[data-astro-cid-ajzedo7x][type=email]{width:100%;padding:.75rem;border:1px solid #ddd;border-radius:6px;font-size:1rem}.subscribe-button[data-astro-cid-ajzedo7x]{background:var(--primary-color);color:#fff;border:none;padding:.75rem 1.5rem;border-radius:6px;font-size:1rem;cursor:pointer;width:100%}.subscribe-button[data-astro-cid-ajzedo7x]:hover{opacity:.9}\n"}],"routeData":{"route":"/subscribe","isIndex":false,"type":"page","pattern":"^\\/subscribe\\/?$","segments":[[{"content":"subscribe","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/subscribe.astro","pathname":"/subscribe","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_slug_.ctMhzbL-.css"},{"type":"inline","content":".sidebar[data-astro-cid-rzwysiq6]{position:sticky;top:calc(var(--nav-height) + 2rem);padding:1.5rem;width:250px;background-color:#f7f7f7;border-radius:8px;height:fit-content}.sidebar-section[data-astro-cid-rzwysiq6]{margin-bottom:2rem}.sidebar-section[data-astro-cid-rzwysiq6] h2[data-astro-cid-rzwysiq6]{font-size:1.2rem;margin-bottom:.75rem}.sidebar-section[data-astro-cid-rzwysiq6] p[data-astro-cid-rzwysiq6]{font-size:.9rem;color:#666;margin-bottom:1rem}.category-list[data-astro-cid-rzwysiq6],.social-links[data-astro-cid-rzwysiq6]{list-style:none;padding:0;margin:0}.category-list[data-astro-cid-rzwysiq6] li[data-astro-cid-rzwysiq6],.social-links[data-astro-cid-rzwysiq6] li[data-astro-cid-rzwysiq6]{margin-bottom:.5rem}.category-list[data-astro-cid-rzwysiq6] a[data-astro-cid-rzwysiq6],.social-links[data-astro-cid-rzwysiq6] a[data-astro-cid-rzwysiq6]{color:var(--primary-color);text-decoration:none;font-size:.9rem}.category-list[data-astro-cid-rzwysiq6] a[data-astro-cid-rzwysiq6]:hover,.social-links[data-astro-cid-rzwysiq6] a[data-astro-cid-rzwysiq6]:hover{text-decoration:underline}.sidebar-button[data-astro-cid-rzwysiq6]{display:inline-block;padding:.5rem 1rem;background-color:var(--primary-color);color:#fff;text-decoration:none;border-radius:4px;font-size:.9rem;transition:opacity .2s}.sidebar-button[data-astro-cid-rzwysiq6]:hover{opacity:.9}@media (max-width: 768px){.sidebar[data-astro-cid-rzwysiq6]{position:static;margin-top:2rem}}\n.content-grid[data-astro-cid-cp3zdscb]{display:grid;grid-template-columns:3fr 1fr;gap:3rem}.posts-list[data-astro-cid-cp3zdscb]{list-style:none;padding:0}.posts-list[data-astro-cid-cp3zdscb] a[data-astro-cid-cp3zdscb]{text-decoration:none;color:inherit}.posts-list[data-astro-cid-cp3zdscb] h2[data-astro-cid-cp3zdscb]{font-size:1.5rem;margin-bottom:.5rem}time[data-astro-cid-cp3zdscb]{color:#444}@media (max-width: 768px){.content-grid[data-astro-cid-cp3zdscb]{grid-template-columns:1fr}}\n[data-astro-image]{width:100%;height:auto;object-fit:var(--fit);object-position:var(--pos);aspect-ratio:var(--w) / var(--h)}[data-astro-image=responsive]{max-width:calc(var(--w) * 1px);max-height:calc(var(--h) * 1px)}[data-astro-image=fixed]{width:calc(var(--w) * 1px);height:calc(var(--h) * 1px)}\n"}],"routeData":{"route":"/writing","isIndex":true,"type":"page","pattern":"^\\/writing\\/?$","segments":[[{"content":"writing","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/writing/index.astro","pathname":"/writing","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_slug_.ctMhzbL-.css"},{"type":"inline","content":".sidebar[data-astro-cid-rzwysiq6]{position:sticky;top:calc(var(--nav-height) + 2rem);padding:1.5rem;width:250px;background-color:#f7f7f7;border-radius:8px;height:fit-content}.sidebar-section[data-astro-cid-rzwysiq6]{margin-bottom:2rem}.sidebar-section[data-astro-cid-rzwysiq6] h2[data-astro-cid-rzwysiq6]{font-size:1.2rem;margin-bottom:.75rem}.sidebar-section[data-astro-cid-rzwysiq6] p[data-astro-cid-rzwysiq6]{font-size:.9rem;color:#666;margin-bottom:1rem}.category-list[data-astro-cid-rzwysiq6],.social-links[data-astro-cid-rzwysiq6]{list-style:none;padding:0;margin:0}.category-list[data-astro-cid-rzwysiq6] li[data-astro-cid-rzwysiq6],.social-links[data-astro-cid-rzwysiq6] li[data-astro-cid-rzwysiq6]{margin-bottom:.5rem}.category-list[data-astro-cid-rzwysiq6] a[data-astro-cid-rzwysiq6],.social-links[data-astro-cid-rzwysiq6] a[data-astro-cid-rzwysiq6]{color:var(--primary-color);text-decoration:none;font-size:.9rem}.category-list[data-astro-cid-rzwysiq6] a[data-astro-cid-rzwysiq6]:hover,.social-links[data-astro-cid-rzwysiq6] a[data-astro-cid-rzwysiq6]:hover{text-decoration:underline}.sidebar-button[data-astro-cid-rzwysiq6]{display:inline-block;padding:.5rem 1rem;background-color:var(--primary-color);color:#fff;text-decoration:none;border-radius:4px;font-size:.9rem;transition:opacity .2s}.sidebar-button[data-astro-cid-rzwysiq6]:hover{opacity:.9}@media (max-width: 768px){.sidebar[data-astro-cid-rzwysiq6]{position:static;margin-top:2rem}}\n.content-grid[data-astro-cid-bvzihdzo]{display:grid;grid-template-columns:3fr 1fr;gap:3rem}.post-image[data-astro-cid-bvzihdzo]{margin:2rem 0}.post-image[data-astro-cid-bvzihdzo] img[data-astro-cid-bvzihdzo]{width:100%;height:auto;border-radius:8px}time[data-astro-cid-bvzihdzo]{color:#666;font-size:.9rem;display:block;margin:1rem 0}@media (max-width: 768px){.content-grid[data-astro-cid-bvzihdzo]{grid-template-columns:1fr}}\n[data-astro-image]{width:100%;height:auto;object-fit:var(--fit);object-position:var(--pos);aspect-ratio:var(--w) / var(--h)}[data-astro-image=responsive]{max-width:calc(var(--w) * 1px);max-height:calc(var(--h) * 1px)}[data-astro-image=fixed]{width:calc(var(--w) * 1px);height:calc(var(--h) * 1px)}\n"}],"routeData":{"route":"/writing/[...slug]","isIndex":false,"type":"page","pattern":"^\\/writing(?:\\/(.*?))?\\/?$","segments":[[{"content":"writing","dynamic":false,"spread":false}],[{"content":"...slug","dynamic":true,"spread":true}]],"params":["...slug"],"component":"src/pages/writing/[...slug].astro","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_slug_.ctMhzbL-.css"},{"type":"inline","content":"a[data-astro-cid-j7pv25f6]{text-decoration:none;color:#333;position:relative;transition:color .3s ease}a[data-astro-cid-j7pv25f6]:after{content:\"\";position:absolute;width:100%;height:2px;bottom:-2px;left:0;background-color:#333;transform:scaleX(0);transform-origin:bottom right;transition:transform .3s ease}a[data-astro-cid-j7pv25f6]:hover{color:#666}a[data-astro-cid-j7pv25f6]:hover:after{transform:scaleX(1);transform-origin:bottom left}\n"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/Users/dh/Development/davidhoang-dot-com/src/pages/writing/[...slug].astro",{"propagation":"in-tree","containsHead":true}],["/Users/dh/Development/davidhoang-dot-com/src/pages/about.astro",{"propagation":"none","containsHead":true}],["/Users/dh/Development/davidhoang-dot-com/src/pages/featured.astro",{"propagation":"none","containsHead":true}],["/Users/dh/Development/davidhoang-dot-com/src/pages/index.astro",{"propagation":"none","containsHead":true}],["/Users/dh/Development/davidhoang-dot-com/src/pages/now.astro",{"propagation":"none","containsHead":true}],["/Users/dh/Development/davidhoang-dot-com/src/pages/subscribe.astro",{"propagation":"none","containsHead":true}],["/Users/dh/Development/davidhoang-dot-com/src/pages/writing/index.astro",{"propagation":"in-tree","containsHead":true}],["\u0000astro:content",{"propagation":"in-tree","containsHead":false}],["\u0000@astro-page:src/pages/writing/[...slug]@_@astro",{"propagation":"in-tree","containsHead":false}],["\u0000@astrojs-ssr-virtual-entry",{"propagation":"in-tree","containsHead":false}],["\u0000@astro-page:src/pages/writing/index@_@astro",{"propagation":"in-tree","containsHead":false}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000noop-middleware":"_noop-middleware.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:src/pages/about@_@astro":"pages/about.astro.mjs","\u0000@astro-page:src/pages/featured@_@astro":"pages/featured.astro.mjs","\u0000@astro-page:src/pages/now@_@astro":"pages/now.astro.mjs","\u0000@astro-page:src/pages/subscribe@_@astro":"pages/subscribe.astro.mjs","\u0000@astro-page:src/pages/writing/index@_@astro":"pages/writing.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astro-page:src/pages/writing/[...slug]@_@astro":"pages/writing/_---slug_.astro.mjs","/Users/dh/Development/davidhoang-dot-com/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_tAY7V46l.mjs","/Users/dh/Development/davidhoang-dot-com/.astro/content-assets.mjs":"chunks/content-assets_DleWbedO.mjs","/Users/dh/Development/davidhoang-dot-com/.astro/content-modules.mjs":"chunks/content-modules_Dz-S_Wwv.mjs","\u0000astro:data-layer-content":"chunks/_astro_data-layer-content_BKW9_sKV.mjs","\u0000@astrojs-manifest":"manifest_DEHzICuu.mjs","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/_slug_.ctMhzbL-.css","/favicon.svg","/images/img-background.jpeg","/images/img-david-now.jpeg","/images/img-dh.png","/images/blog/2024-03-design-engineering.jpeg","/images/blog/img-2021-general-magic.jpg","/images/blog/img-2021-jodorowskysbacklog-01.jpg","/images/blog/img-2021-jodorowskysbacklog-02.jpg","/images/blog/img-2022-email-update-career-advisors.webp","/images/blog/img-2023-01-05-choosing-company.jpeg"],"buildFormat":"directory","checkOrigin":true,"serverIslandNameMap":[],"key":"fUzzFKSw2Bh2tR6t7d6CuW2JUN/Rc41gZK93xqdmOaA="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
