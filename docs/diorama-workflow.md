# Clay-house diorama workflow

The web pipeline is:

```text
diorama-template.blend → house-specific .blend → public/models/house.glb
                                      Astro → React island → R3F useGLTF()
```

The current `house.glb` is a small, generated placeholder. It establishes the
loading and rendering contract without claiming to be a measured reconstruction
of 2863 Greco Court. Regenerate it with:

```bash
npm run generate:diorama-model
```

## Source files

- **Template source of truth:** `diorama-template.blend`
- **Editable format:** `.blend`
- **Web delivery format:** `.glb`
- **Web destination:** `public/models/house.glb`

Keep `diorama-template.blend` as the reusable master scene. It should own the
camera framing, soft key/fill lighting, pale world, clay material library,
ground, low-poly desert tree library, prop collection, render settings, and
glTF export settings. Duplicate the template before making house-specific
geometry.

The placeholder in this repository is authored by
`scripts/generate-diorama-model.mjs` so the scaffold remains reproducible before
the Blender template is checked into the art-source archive.

## Modeling guidance

1. Work in meters and keep the ground at `Y = 0`.
2. Keep the house near the scene origin, with the front facing Blender `-Y`
   (glTF viewers will remap the axes).
3. Build broad, beveled masses first: main volume, garage, parapet or low roof,
   then simplified openings.
4. Use opaque, matte materials with high roughness and no metallic response.
5. Keep landscaping and props low-poly. Prefer a few readable silhouettes over
   dense geometry.
6. Name meshes and materials semantically so they remain inspectable in
   Three.js.

Property references should guide only details that can be verified from source
material. Label studies as conceptual until dimensions, elevations, and
architectural details have been confirmed.

## Blender → web export checklist

1. Save the editable house file as `.blend`; never use the exported GLB as the
   working source.
2. Remove hidden tests, high-resolution sculpt layers, unused materials, and
   lights or cameras that the web scene does not consume.
3. Apply scale and rotation (`Ctrl+A`) and confirm the model rests on the origin
   ground plane.
4. Add a modest bevel and weighted normals where needed; avoid subdivisions
   that do not change the silhouette.
5. Pack or embed any required textures. Prefer material colors for the clay
   style to minimize download size.
6. In **File → Export → glTF 2.0**, choose:
   - Format: **glTF Binary (`.glb`)**
   - Include: **Selected Objects** when the file contains reference collections
   - Transform: **+Y Up**
   - Geometry: apply modifiers, export normals, skip unused attributes
   - Materials: export
   - Images: WebP where browser support and the Blender exporter permit it
7. Enable **Draco mesh compression** for production exports when it materially
   reduces the file. Keep quantization conservative and visually compare edges
   before shipping. A plain GLB is acceptable for small models.
8. Export to `public/models/house.glb`, preserving that filename so the React
   component needs no code change.
9. Run `npm run build`, then inspect the route at
   `/experiments/greco-diorama` on mobile and desktop.
10. Keep the shipped GLB under 1–2 MB and verify it returns `200` with the
    correct binary content.

## Optional typed component

For a model that needs per-mesh animation or material overrides, generate a
typed React component with [`gltfjsx`](https://github.com/pmndrs/gltfjsx):

```bash
npx gltfjsx public/models/house.glb --types --transform
```

Static dioramas can continue to load the whole scene with `useGLTF`, which keeps
the reusable shell independent of model internals.
