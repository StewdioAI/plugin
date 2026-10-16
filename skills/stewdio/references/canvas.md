# Canvas renderer authoring

See the bundled [XML reference](xml.md) for
subtree replacement, input declarations, clips, and animation syntax. This
reference covers JavaScript inside a
Canvas's `<script>` element and the current drawing runtime.

Read the existing Canvas XML before replacing it. Preserve inputs, animations,
and asset bindings outside the requested change, and save through `write_xml`
with the target subtree's ETag.

## Module and lifecycle

Scripts are JavaScript ES modules evaluated by the browser inside an isolated
iframe. Export `defineRenderer({ setup, render, dispose })` as the
default; `defineRenderer` is a provided global. All three methods are required
and awaited. Scripts are not transpiled from TypeScript or JSX.

| Method    | Arguments                                                      | Responsibility                                                     |
| --------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `setup`   | `{ canvas, assets }`                                           | Create resources and return the state used by render/dispose.      |
| `render`  | `{ canvas, state, inputs, assets, width, height, pixelRatio }` | Draw a complete frame from sampled inputs, assets, and dimensions. |
| `dispose` | `{ canvas, state, assets }`                                    | Release owned resources.                                           |

`canvas` is an `OffscreenCanvas`. Use Canvas 2D, WebGL, or WebGPU when supported
by the browser. Native browser APIs such as `atob`, `btoa`, `document`, `window`,
`navigator.gpu`, WebAssembly, dynamic code generation, and timers are available.
Browser support and permission rules still apply. The iframe has an opaque
origin: application DOM, cookies, storage, Node.js APIs, and MCP/desktop bridges
are inaccessible.

Draw all visible output into the provided `canvas`. HTML/CSS and DOM output are
not rendered. Browser DOM APIs remain available for libraries that need them.
Do not use experimental `requestPaint`, `drawElementImage`, or `layoutsubtree` APIs.

Setup runs before the first frame size is assigned. Keep expensive resources
such as contexts, GPU objects, and parsed models in the returned state. Script or
binding changes can rerun setup; disposal/activation can recreate the iframe.
Do not depend on module re-evaluation for animation state. Release GPU devices,
listeners, timers, and other resources in dispose. Disposal is not guaranteed to
finish on failure. Iframe recovery cannot reliably interrupt an infinite loop.

## Drawing and seeking

Treat the visible frame as a pure function of current inputs, bound assets, and
dimensions. State may hold rendering resources or caches, but rendering the same
values must produce the same result regardless of prior calls. Read editable
values in `render`; do not advance a private animation loop or simulation between
frames. Let XML keyframes supply changing values.

Before render, `canvas.width` and `canvas.height` become
`max(1, round(logicalDimension * pixelRatio))`. The separate `width` and `height`
arguments are logical dimensions. Draw in backing pixels, or reset the context
and scale by `pixelRatio` to use logical units. Do not multiply the backing
dimensions by another device pixel ratio.

For existing scripts, `canvas.style.width` and `canvas.style.height` also expose
the logical dimensions as pixel strings (for example, `"640px"`). These are
dimension compatibility properties only; the surface is still an `OffscreenCanvas`.
Prefer the `width`, `height`, and `pixelRatio` render arguments for new scripts.

Draw the complete frame on every render: transferring the bitmap to the host
clears the drawing buffer. Resizing resets context state. Set the transform,
styles, and other state needed by each frame; balance save/restore calls. For
WebGL, update the viewport and clear the relevant buffers. Let the host present
the surface; do not transfer it or call `transferToImageBitmap()` yourself.

The host controls playback. There is no top-level `time`, `progress`, `dt`, or
duration argument. Declare a number input and animate it in XML when needed;
even an input called `time` has no special behavior. Outside a composition, inputs
keep their stored values and their animations are dormant.

`inputs` holds sampled values: `number` becomes a number; `string`/`select`
become strings; `boolean` becomes a boolean; `color` becomes `{ r, g, b, a }`
with channels in `0..1`. Convert colors to CSS strings for Canvas 2D styles.
Repeated values and backward seeks must produce the same frame. Avoid accumulated
animation progress, wall clocks, and unseeded randomness. Complete asynchronous
drawing before the render promise resolves.

## Imports and fonts

Use browser-compatible libraries with pinned, fully resolved HTTPS module URLs.
Native static/dynamic imports, fonts, and fetch requests are restricted by CSP to:
`https://esm.sh`, `https://cdn.jsdelivr.net`, `https://unpkg.com`, and
`https://threejs.org`. Dependencies and redirected requests must also comply with
CSP and CORS. Bare package imports and Node.js built-ins are unavailable.
Landing previews use a stricter policy that prohibits external resources.

Google Fonts stylesheets (`https://fonts.googleapis.com`) and font files
(`https://fonts.gstatic.com`) are also permitted for font loading, but not for
JavaScript imports.

Await `loadFont("Family", "https://allowed-origin/path/font.woff2")` in setup
before using that family in canvas text. This loads a font into the iframe's
document. URLs are external resources and do not use File asset bindings.

## Bound File assets

Every Canvas declares the File assets its script reads:
`<asset-bindings><asset name="logo" ref="asset:image:a1b2c3d4" /></asset-bindings>`.
Use actual IDs from the File's `<image-asset>`, `<video-asset>`, or `<model-asset>`
records. The XML write cannot upload an asset or turn a URL into one.

`assets.get("logo")` synchronously returns a handle or `null` for a missing asset.
`assets.get("logo", "image")` also checks its kind. Declared names and their bound
IDs resolve; undeclared lookups throw. Declare every asset that any code branch
can select. Inputs never contain assets: use a string/select of binding names
and resolve the selected name through `assets.get`.

Bindings keep names stable while copying remaps asset IDs. Omitting the bindings
element preserves an existing Canvas's bindings; `<asset-bindings />` clears them.
A new Canvas without the element binds nothing. An asset must remain in the File
while a layer or binding references it.

| Kind    | Metadata                                          | Operation                                                          |
| ------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| `image` | `id`, `name`, `hash`, `mime`, `width`, `height`   | `await handle.frame()`                                             |
| `video` | image metadata plus source `duration` in seconds  | `await handle.frame({ time })` with explicit finite source seconds |
| `model` | `id`, `name`, `hash`, `mime: "model/gltf-binary"` | `await handle.arrayBuffer()`                                       |

Image/video frames contain `kind`, `width`, `height`, `frameKey`, and `bitmap`;
video frames also contain `timestamp` and `duration`. The bitmap is borrowed only
until the active setup/render call settles. Never close or transfer it, or retain
it in state for later calls. A copied image or GPU texture is yours to manage;
`frameKey` identifies decoded content for caching. Model bytes are a fresh owned
`ArrayBuffer`; parse once in setup and retain the parsed resources in state.

Asset operations outside setup/render, including during dispose, resolve `null`.
Loading failures reject. Handles can remain in state, but request a frame in the
current lifecycle call. Videos never infer a clock: use a declared input, for
example `video.frame({ time: inputs.sourceTime })`. Two source moments may be
requested in one render.

## Check rendering

A successful XML write validates content but does not prove that imports load or
that a script renders correctly. When `view_node` is available, open the Canvas
or its containing Composition for inspection. For animation, check the beginning,
middle, and later frames, then revisit an earlier time when playback is available.
Report visual verification as incomplete until checked. Clients without MCP Apps
do not receive view tools; users can inspect playback in Stewdio's editor.
The MCP tools do not capture Compositions.

## Example: a custom radial image reveal

For ordinary image display, use a native layer:

```xml
<image name="Logo" asset="asset:image:a1b2c3d4" size="640 360" />
```

Use Canvas here for a custom radial clipping effect. The `reveal` control sets
the visible fraction of a clockwise sweep; it can be keyframed when the Canvas
is inside a composition. Layer movement and opacity can use native field tracks.
Replace the example asset IDs with an image asset ID from `read_xml` before
creating either node. On an existing Canvas, preserve the inputs and animations
you want to keep when replacing its XML.

```xml
<canvas name="Logo reveal" size="640 360">
  <asset-bindings>
    <asset name="logo" ref="asset:image:a1b2c3d4" />
  </asset-bindings>
  <script><![CDATA[export default defineRenderer({
  setup({ canvas }) {
    const context = canvas.getContext("2d");
    if (context === null) throw new Error("Canvas 2D is unavailable");
    return context;
  },
  async render({ canvas, state: context, assets, inputs, width, height, pixelRatio }) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const reveal = Math.max(0, Math.min(1, inputs.reveal));
    if (reveal === 0) return;
    const logo = assets.get("logo", "image");
    if (logo === null) throw new Error("The bound image is unavailable");
    const frame = await logo.frame();
    if (frame === null) return;
    const scale = Math.min(width / frame.width, height / frame.height);
    const drawWidth = frame.width * scale;
    const drawHeight = frame.height * scale;
    context.save();
    context.beginPath();
    context.moveTo(width / 2, height / 2);
    context.arc(width / 2, height / 2, Math.hypot(width, height) / 2,
      -Math.PI / 2, -Math.PI / 2 + reveal * 2 * Math.PI);
    context.closePath();
    context.clip();
    context.drawImage(frame.bitmap, (width - drawWidth) / 2,
      (height - drawHeight) / 2, drawWidth, drawHeight);
    context.restore();
  },
  dispose() {}
});]]></script>
  <input key="reveal" type="number" label="Reveal" value="0.75" min="0" max="1" step="0.01" />
</canvas>
```
