# Graphic renderer authoring

Examples use `<graphic>` and File Asset hashes returned by `list_assets` or `get_asset`.
Read the [XML reference](xml.md) first.

See the bundled [XML reference](xml.md) for
subtree replacement, input declarations, clips, and animation syntax. This
reference covers JavaScript inside a
Graphic's `<script>` element and the current drawing runtime.

Read the existing Graphic XML before replacing it. Preserve inputs, asset
references, and animations outside the requested change, and save through
`write_xml` with the target subtree's ETag.

## Module and lifecycle

Scripts are JavaScript ES modules evaluated by the browser inside an isolated
iframe. Export `defineRenderer(factory)` as the default; `defineRenderer` is the
only provided global. Scripts are not transpiled from TypeScript or JSX.

```js
export default defineRenderer((graphic) => {
  // Runs once per mount. Acquire the drawing context here.
  const context = graphic.canvas.getContext("2d");
  if (context === null) throw new Error("Canvas 2D is unavailable");
  return {
    render() {
      // Draw one complete frame from input values and graphic.size.
    },
    dispose() {
      // Optional: release resources the factory created.
    },
  };
});
```

The factory runs once per mount and returns `{ render, dispose? }`. The factory,
`render`, and `dispose` may be asynchronous and are awaited. Keep expensive
resources such as contexts, GPU objects, parsed models, and caches in the
factory's closure; there is no separate `setup` or `state` argument. The
retired object form `defineRenderer({ setup, render, dispose })` is rejected.

The factory must acquire a context from `graphic.canvas` before it returns,
either directly or through a library such as Three.js. A canvas is locked to
the first context kind requested, and the host never calls `getContext` for
you; it records the kind the script asked for. A factory that returns without a
context fails the mount with a visible diagnostic.

`graphic` is one stable, read-only view of the Graphic:

| Property     | Meaning                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------- |
| `name`       | The Graphic node's name.                                                                      |
| `size`       | Logical `{ width, height }`, the unit Canvas 2D scripts draw in.                              |
| `pixelRatio` | Physical pixels per logical unit for this render; differs between preview and export.         |
| `canvas`     | An `OffscreenCanvas` sized to `max(1, round(size * pixelRatio))`; the physical backing store. |
| `inputs`     | One stable handle per declared input; see below.                                              |

The host refreshes `size`, `pixelRatio`, the backing dimensions, and each scalar
input's `value` before each render and keeps them fixed until the call settles.
Read them inside `render`; do not copy them out of the factory. Input handles
themselves stay the same for the whole mount, so the factory may keep them.

Native browser APIs such as `atob`, `btoa`, `document`, `window`,
`navigator.gpu`, WebAssembly, dynamic code generation, and timers are available.
Browser support and permission rules still apply. The iframe has an opaque
origin: application DOM, cookies, storage, Node.js APIs, and MCP/desktop bridges
are inaccessible.

Draw all visible output into `graphic.canvas`. HTML/CSS and DOM output are not
rendered. Browser DOM APIs remain available for libraries that need them.
Do not use experimental `requestPaint`, `drawElementImage`, or `layoutsubtree` APIs.

The host recreates the instance after script edits or asset reference, content,
or availability changes, including a missing asset becoming available, and may
recreate it for resource management or GPU context loss. Ordinary scalar input
changes only update each handle's `value`. Do not depend on module re-evaluation for
animation state. Release GPU devices, listeners, timers, and other resources in
`dispose`; if the factory throws before returning, clean up what it already
acquired. Disposal is not guaranteed to finish on failure, and iframe recovery
cannot reliably interrupt an infinite loop.

## Drawing and seeking

Treat the visible frame as a pure function of input values, referenced
assets, and `graphic.size`. The closure may hold rendering resources or caches,
but rendering the same values must produce the same result regardless of prior
calls. Read editable values in `render`; do not advance a private animation loop
or simulation between frames. Let XML keyframes supply changing values.

The host hides the density transform. For a Canvas 2D context it resets the
context state, clears the surface, and sets the transform to `pixelRatio`
before every render, so scripts draw a complete frame in logical units from
`graphic.size` and must not reset the transform, clear, or scale by
`pixelRatio` themselves. For `webgl`, `webgl2`, and `webgpu` the host only sizes
the backing store: set the viewport from `graphic.canvas.width` and
`graphic.canvas.height` and clear the relevant buffers yourself. Equal inputs at
different ratios must produce the same image at different resolutions.

`graphic.pixelRatio` stays readable for output-density decisions: rasterizing
SVG inputs at output resolution, pixel snapping, and GPU render-target sizes.
Do not multiply the backing dimensions by another device pixel ratio, and do
not read `canvas.style`; the surface is an `OffscreenCanvas`.

Draw the complete frame on every render: presenting the bitmap to the host
clears the drawing buffer. Balance save/restore calls. Let the host present the
surface; do not transfer it or call `transferToImageBitmap()` yourself.

The host controls playback. There is no `time`, `progress`, `dt`, or duration
argument. Declare a number input and animate it in XML when needed; even an
input called `time` has no special behavior. Outside a composition, inputs keep
their stored values and their animations are dormant.

## Inputs

Every key of `graphic.inputs` is a frozen handle with `kind`, the declared
type, and `label`. Narrow on `kind` when a helper accepts several handles.
Scalar handles expose the sampled value as `value`, a property, not a method:

| Kind      | `value`                                  | Other metadata       |
| --------- | ---------------------------------------- | -------------------- |
| `number`  | A number                                 | `min`, `max`, `step` |
| `color`   | Frozen `{ r, g, b, a }`, channels `0..1` |                      |
| `string`  | A string                                 |                      |
| `boolean` | A boolean                                |                      |
| `select`  | One of `options`                         | `options`            |

Metadata absent from the declaration is `undefined`. Convert colors to CSS
strings for Canvas 2D styles.

```js
export default defineRenderer((graphic) => {
  const context = graphic.canvas.getContext("2d");
  const { speed, tint, title } = graphic.inputs; // Handles are safe to keep.
  return {
    render() {
      const { r, g, b, a } = tint.value;
      context.fillStyle = `rgb(${r * 255} ${g * 255} ${b * 255} / ${a})`;
      context.rotate(speed.value);
      context.fillText(title.value, 0, 0);
    },
  };
});
```

A handle is never the value itself: `speed * 2` is `NaN`, `title` in a template
is `[object Object]`, and every handle is truthy. A write rejects scripts that
use a scalar handle as a value, for example in arithmetic, comparisons,
conditions, templates, property assignments, or browser API arguments. Read
`.value` instead. Reading an undeclared key from `graphic.inputs` throws;
`graphic.inputs` is read-only. Repeated values and backward seeks must produce the same frame.
Avoid accumulated animation progress, wall clocks, and unseeded randomness.
Complete asynchronous drawing before the render promise resolves.

## Imports, fonts, and external resources

Use browser-compatible libraries with pinned, fully resolved HTTPS module URLs,
such as `import * as THREE from "https://esm.sh/three@0.170.0"`. Put imports at
the top of the script. Static and dynamic imports, fonts, images, and fetch
requests are restricted by CSP to exactly two origins:

- `https://esm.sh`
- `https://cdn.jsdelivr.net`

No other origin is permitted, including unpkg, threejs.org, and Google Fonts.
Dependencies and redirected requests must also comply with CSP and CORS. Bare
package imports and Node.js built-ins are unavailable.

There is no `loadFont` global. To let users pick a typeface, declare a font
input (see [Font inputs](#font-inputs)). To hard-code a font from an allowed
origin, use the browser's own API inside the factory, then use the family in
canvas text:

```js
const face = new FontFace(
  "Inter",
  "url(https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-400-normal.woff2)",
);
document.fonts.add(await face.load());
```

Font URLs are external resources, not File assets.

## Font inputs

Declare a user-selectable Google font face as
`<input key="heading" type="font" font="Inter" font-weight="700" font-style="italic" />`.
`font` is a Google Fonts family name; `font-weight` defaults to `400` and
`font-style` (`normal` or `italic`) to `normal`. Font inputs cannot be animated;
a different face remounts the Graphic, so its handle is fixed for the mount and
the face can be loaded once in the factory.

`graphic.inputs.heading` is never `null`. It carries `kind: "font"`, `label`,
`family`, `weight`, `style`, and `mime: "font/woff2"`, and loads the face's
single WOFF2 file on demand:

- `await handle.load()` adds the face to `document.fonts` and returns a CSS
  font family for Canvas 2D, such as `` context.font = `48px ${family}` ``. The
  family names exactly this face, so the font shorthand needs no weight or style.
- `await handle.arrayBuffer()` returns a fresh WOFF2 copy the script owns, for
  libraries that parse font files.

```js
export default defineRenderer(async (graphic) => {
  const context = graphic.canvas.getContext("2d");
  const family = await graphic.inputs.heading.load();
  return {
    render() {
      context.font = `48px ${family}`;
      context.fillText(graphic.inputs.title.value, 24, 72);
    },
  };
});
```

Like asset operations, both methods resolve `null` outside an active factory or
render call and reject when the face is unknown or its file fails to load.

## Asset inputs

Declare the File Assets a script reads as typed inputs:
`<input key="logo" type="image" ref="example-asset-hash" />`. The `type` is
`image`, `video`, or `model`, and `ref` is a `hash` from
`list_assets` or `get_asset` for the same File. Omit `ref` to declare an unset input; a missing
asset also resolves to `null` with a visible diagnostic. Asset inputs use
`ref`, never `value`, and cannot be animated. XML cannot upload an asset or
turn a URL into one. The former `<asset-bindings>` element and `assets.get()`
no longer exist.

`graphic.inputs.logo` synchronously returns a kind-specific handle or `null`.
Asset handles have no `value`; they load media through their methods.
Reading a handle performs no network I/O or decoding; media loads only when a
handle method runs. Declare an input for every asset any code branch can use.
A declared kind that does not match the referenced asset fails the mount. Reuse
handles for the whole mount, but request frames or bytes in the current call.

| Kind    | Handle metadata                                   | Operation                                                          |
| ------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| `image` | `id`, `name`, `hash`, `mime`, `width`, `height`   | `await handle.frame()` or `await handle.frame({ width, height })`  |
| `video` | image metadata plus source `duration` in seconds  | `await handle.frame({ time })` with explicit finite source seconds |
| `model` | `id`, `name`, `hash`, `mime: "model/gltf-binary"` | `await handle.arrayBuffer()`                                       |

Every asset handle also carries `kind` and `label`.

For SVG images, request the pixel dimensions you will draw at output density:

```js
const frame = await graphic.inputs.logo.frame({
  width: Math.max(1, Math.ceil(96 * graphic.pixelRatio)),
  height: Math.max(1, Math.ceil(96 * graphic.pixelRatio)),
});
context.drawImage(frame.bitmap, 24, 24, 96, 96); // still logical units
```

Both dimensions must be positive integers. SVGs rasterize directly at that
size; different sizes have independent cached frames. Omitting the size retains
the image's intrinsic resolution. Raster images can be resized but gain no new
detail.

Image and video frames contain `kind`, `width`, `height`, `frameKey`, and
`bitmap`; video frames also contain `timestamp` and `duration` for the selected
frame in source seconds. Times outside the source clamp to its first or last
frame. The bitmap is borrowed only until the active factory or render call
settles. Never close or transfer it, or retain it, including inside a texture
or material, for later calls. To keep pixels across calls, copy them into a
source you own, such as `createImageBitmap(frame.bitmap)` or an
`OffscreenCanvas`, and dispose that copy yourself; `frameKey` identifies decoded
content for caching. Model bytes are a fresh owned `ArrayBuffer` on every call;
parse once in the factory and retain the parsed resources in the closure.

Asset operations outside an active factory or render call, including during
`dispose`, resolve `null`. Loading and decoding failures reject rather than
substituting a different frame. Videos never infer a clock: use a declared
number input, for example `clip.frame({ time: graphic.inputs.sourceTime.value })`.
Several source moments may be requested in one render.

## Check rendering

A successful XML write validates content but does not prove that imports load or
that a script renders correctly. When `open_stewdio` is available, supply `fileId`
and the Graphic or containing Composition's `nodeId` for a read-only preview.
For animation, check the beginning, middle, and later frames, then revisit an
earlier time when playback is available. To adjust exposed controls in the
editor, call `open_stewdio` with only `fileId`.
Report visual verification as incomplete until checked. Clients without MCP Apps
do not receive `open_stewdio`; users can inspect playback in Stewdio's editor.
The MCP tools do not capture Compositions.

## Example: a custom radial image reveal

For ordinary image display, use a native layer:

```xml
<image name="Logo" asset="example-asset-hash" size="640 360" />
```

Use Graphic here for a custom radial clipping effect. The `reveal` control sets
the visible fraction of a clockwise sweep; it can be keyframed when the Graphic
is inside a composition. Layer movement and opacity can use native field tracks.
Replace the example ref with an image `hash` from `list_assets` before
creating either node. On an existing Graphic, preserve the inputs and animations
you want to keep when replacing its XML.

```xml
<graphic name="Logo reveal" size="640 360">
  <input key="logo" type="image" label="Logo" ref="example-asset-hash" />
  <input key="reveal" type="number" label="Reveal" value="0.75" min="0" max="1" step="0.01" />
  <script><![CDATA[export default defineRenderer((graphic) => {
  const context = graphic.canvas.getContext("2d");
  if (context === null) throw new Error("Canvas 2D is unavailable");
  return {
    async render() {
      const { size, inputs } = graphic;
      const reveal = Math.max(0, Math.min(1, inputs.reveal.value));
      if (reveal === 0 || inputs.logo === null) return;
      const frame = await inputs.logo.frame();
      if (frame === null) return;
      const scale = Math.min(size.width / frame.width, size.height / frame.height);
      const drawWidth = frame.width * scale;
      const drawHeight = frame.height * scale;
      context.save();
      context.beginPath();
      context.moveTo(size.width / 2, size.height / 2);
      context.arc(size.width / 2, size.height / 2, Math.hypot(size.width, size.height) / 2,
        -Math.PI / 2, -Math.PI / 2 + reveal * 2 * Math.PI);
      context.closePath();
      context.clip();
      context.drawImage(frame.bitmap, (size.width - drawWidth) / 2,
        (size.height - drawHeight) / 2, drawWidth, drawHeight);
      context.restore();
    },
  };
});]]></script>
</graphic>
```
