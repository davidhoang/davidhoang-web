# Two homes on /now

`/now` shows Palm Springs (with Kai) and San Francisco's Clocktower as automatically interactive clay miniatures. Desktop uses a wide two-column layout, mobile stacks the homes. Only the city names appear below the models. Drag orbits; Shift/right-drag pans; wheel zooms. Touch supports one-finger orbit and two-finger pan/zoom. Focused canvases accept arrow-key pan and + / − zoom. Each scene has a refresh icon at its top-right corner to restore the initial view. Gesture directions remain available to screen readers.

The Palm Springs vignette includes layered clay mountain ridges. The San Francisco vignette includes bay water, small sailboats and a suspension bridge. This scenic context is part of the GLB, so it rotates and pans with the home. It is deliberately compressed in scale and location for the composition.

## Source and exports

The editable source is the separately delivered `greco-diorama` Blender kit: `greco-court.blend`, `clocktower.blend`, and `diorama-template.blend`. Keep `.blend` as the master. Collection **07 · Scenery** contains the editable backdrops; `add_scenery.py` regenerates that collection while preserving the houses and Kai. Its `export_web.py` evaluates modifiers into temporary copies; `render_posters.py` renders the exported geometry. Running `npm run assets` in the kit compresses the models with Meshopt and prepares transparent WebP posters.

Copy the generated assets into this repository:

| Kit file | Site destination |
| --- | --- |
| `astro/public/models/house.glb` | `public/models/homes/greco-court.glb` |
| `astro/public/models/clocktower.glb` | `public/models/homes/clocktower.glb` |
| `astro/public/house-render.webp` | `src/assets/images/homes/greco-court.webp` |
| `astro/public/clocktower-render.webp` | `src/assets/images/homes/clocktower.webp` |

`public/images` is generated from `src/assets/images` by the existing image sync. Do not edit generated posters in `public/images`.

`src/components/homes/HomeViewer.tsx` is the server-safe poster and controls. `HomeScene.tsx` owns model loading, studio lights and camera framing. Keep semantic mesh names, particularly `Kai`, when optimizing exports. `tests/homeDioramas.test.ts` checks standalone GLBs, compression, geometry/size ceilings and Kai's vertex colors.

## Loading and budget

The production Content Security Policy in `vercel.json` must allow `'wasm-unsafe-eval'` in `script-src` for the bundled Meshopt WebAssembly decoder. This permission does not enable JavaScript `eval`. Astro's local server does not apply the Vercel response headers, so verify actual 3D interaction on a deployed preview as well as locally. A regression check in `tests/homeDioramas.test.ts` protects this requirement. See [MDN's WebAssembly CSP guidance](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src#unsafe_webassembly_execution).

Astro hydrates the homes 300 px before they enter the viewport, then automatically imports the 3D renderer. It has its own `homes-3d` chunk; no other page imports this island. The existing core JS budget remains 260 KiB gzip. The optional 3D renderer has a 280 KiB gzip / 1050 KiB raw ceiling. Each model is under 1 MB and 100,000 triangles. The Meshopt decoder ships inside the bundle; there is no decoder CDN dependency.

The canvas renders on demand, caps pixel density at 1.5, and uses static contact shadows. Reduced-motion users receive undamped controls. A failed model or WebGL initialization falls back to the poster. Posters include the site's `loaded` class from server render so its lazy-image observer does not introduce a hydration mismatch.

The new R3F JSX types require the generative UI registry's dynamic heading tag to use its actual `h2 | h3 | h4` union instead of all JSX intrinsic elements.

## Model references

- Palm Springs: owner-provided [Redfin listing](https://www.redfin.com/CA/Palm-Springs/2863-Greco-Ct-92264/home/6675284), plus Kai's owner-provided reference photo.
- Clocktower: [David Baker Architects](https://www.dbarchitect.com/projects/clock-tower-lofts), exterior photographs and site plan.

These are stylized exterior studies with approximate dimensions and interpreted unseen details. The buildings are framed independently, not displayed at a common scale.
