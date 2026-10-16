# Authoring Stewdio File XML

Use `list_files` to find a File, or `create_file({ name })` to create one with an
initial page. File tools use `fileId`; creation and listing return it as `id`.
Files belong to their creator within an active organization membership. Creation
and writes enforce the organization's billing and File/composition limits.
No open editor or desktop application is required.

## Read, create, and update

- `read_xml({ fileId, nodeId?, depth? })` returns `{ xml, etag }`. Omit `nodeId`
  for the whole File. `depth` is a nonnegative integer; omit it for all descendants.
  Whole-File reads include `<assets>` and `<pages>` inside `<file>`. Asset metadata
  is complete at every depth; pages are collapsed at whole-File `depth: 0`.
- Read a known target directly with `read_xml({ fileId, nodeId })` to get its full
  subtree. For discovery in a large File, use a limited `depth` for an overview,
  then read the relevant node without `depth`. A collapsed node's ID can be used
  immediately; there is no need to expand each intermediate level. Omit both
  `nodeId` and `depth` when the task needs the complete File.
- `write_xml({ fileId, xml, parentId?, ifMatch? })` accepts exactly one page, section,
  composition, canvas, image, or video subtree. `<file>`, `<assets>`, `<pages>`,
  and asset records are inspection-only. There is no standalone animation write.
- To create, omit the root `id`. A new page is a File root; omit `parentId` for it.
  Other nodes go under `parentId`, or the first page if it is omitted. Omit IDs
  throughout a copied subtree to create fresh nodes. Keep asset references.
- To update, read the target subtree first and keep its root `id` and element type.
  Supply the returned `etag` as `ifMatch`. Omit `parentId`; an existing root retains
  its parent and sibling position. Omit `ifMatch` for creation.
  Existing descendant IDs must belong to this subtree; omit IDs on new descendants.
- The ETag describes the complete read content, independent of `depth`. It is
  checked atomically with the update. Use the ETag for the same root subtree,
  not a whole-File or ancestor ETag. Changes outside that subtree do not conflict.
  Missing `ifMatch` returns `{ ok: false, code: "PRECONDITION_REQUIRED", nodeId, message }`;
  a changed or deleted subtree returns the same shape with `code: "PRECONDITION_FAILED"`.
  Read the subtree again and reapply your intended edits to the fresh XML before
  retrying. Do not reuse stale XML with a fresh ETag.
- Success returns `{ ok: true, nodeId }`, including unchanged writes. Read again
  to inspect the saved subtree and get its current ETag.
  Parser diagnostics return `{ ok: false, diagnostics }` with code, message, line,
  and column. Tool failures set `isError: true`. Rejected writes leave content
  unchanged; successful writes persist and appear in connected editors.
- After losing a write response, read the affected subtree or its parent before
  retrying: a repeated creation can create a duplicate.

## Replacement semantics

An update describes the complete children and animations of each expanded node.
Omitted descendants and animation tracks are removed. XML child order determines
sibling order. On an expanded Canvas, the `<input>` elements replace its entire
input map, so omitted inputs are removed too.

Omitted scalar/box attributes on existing nodes keep their values. Omitting a
Canvas's `<script>` preserves its script; omitting `<asset-bindings>` preserves
its bindings. `<asset-bindings />` explicitly clears them. New nodes use editor
defaults for omitted properties; a new Canvas has no inputs or bindings and a
script that clears its drawing surface.

Depth-limited reads emit self-closing nodes with `id` and `collapsed="true"`.
Keep that flag to retain all hidden descendants, inputs, and animations while
applying any supplied attributes. A collapsed node must already exist within the
edited subtree and cannot contain child elements. Read it at greater depth before
editing or moving anything inside it.

To move a descendant between containers, replace their common ancestor and
include the descendant's ID under its new parent. Local transforms are retained;
adjust them if its page position should stay fixed. To delete a descendant, omit
it from its parent's replacement. XML cannot move existing nodes between pages
or delete/reorder pages because the whole-File root is not writable.

## Elements and attributes

Names are case-sensitive; unknown elements and attributes are rejected. Nesting
establishes parentage; do not supply `parentId`, `type`, or `indexKey` as XML attributes.

| Element          | Attributes                                                  | Children                                     |
| ---------------- | ----------------------------------------------------------- | -------------------------------------------- |
| `page`           | `id`, `name`, `background`                                  | section, composition, canvas, image, video   |
| `section`        | `id`, `name`, `background`, box                             | section, composition, canvas, image, video   |
| `composition`    | `id`, `name`, `background`, `duration`, box, clip           | animation, composition, canvas, image, video |
| `canvas`         | `id`, `name`, box, clip                                     | asset-bindings, script, input, animation     |
| `image`, `video` | `id`, `name`, `asset`, box, clip                            | animation                                    |
| `asset-bindings` | none                                                        | asset                                        |
| `asset`          | `name`, `ref`                                               | none                                         |
| `script`         | none                                                        | JavaScript text, preferably CDATA            |
| `input`          | `key`, `type`, optional `label`, type-specific values below | text or option elements                      |
| `option`         | none                                                        | text                                         |
| `animation`      | exactly one of `field`, `input`                             | one or more keyframe elements                |
| `keyframe`       | `time`, `value`, optional `easing`                          | none                                         |

All six node elements also accept `collapsed="true"` with the constraints above.
Sections cannot be placed inside compositions. Canvases, images, and videos have
no child nodes. A composition crops its descendants to its bounds and has a
positive `duration` in seconds; a section has no timeline.

Box attributes are `position="x y"`, `size="width height"`, `scale="x y"`,
`anchor="x y"`, `rotation`, and `opacity`. Pairs use whitespace, not commas.
Position and size are in the parent's local coordinate system; scale is a
multiplier, anchor is a fraction of the node's size, rotation is in degrees,
and opacity is in `0..1`. Defaults are position `0 0`, size `100 100`, scale
`1 1`, anchor `0.5 0.5`, rotation `0`, opacity `1`. Image/video size defaults to
its asset's dimensions. Default composition duration is 5 seconds.

Colors accept `#RRGGBB`, `#RRGGBBAA`, or four whitespace-separated RGBA numbers
in `0..1`, such as `0.5 0.25 0 1`. Use these for `background`, color inputs, and
color keyframes. CSS color names, short hex, and `rgba(...)` are not XML colors.

Record IDs include their type prefix and eight lowercase alphanumeric characters,
such as `node:canvas:a1b2c3d4`. Use IDs from reads when editing. New image/video
layers require `asset` pointing to an existing asset of the matching kind in the
same File. Existing layers may omit `asset` to retain it.

Whole-File reads expose `<image-asset>`, `<video-asset>`, and `<model-asset>` with
`id`, `name`, `mime`, and content `hash`. Image/video assets also have pixel
`width` and `height`; videos have `duration` in seconds. These records are not
writable through XML. Users can import assets through Stewdio's fullscreen
editor. See the bundled [Canvas reference](canvas.md)
for script asset bindings.

## Clips and animations

Use field keyframes for a layer's position, scale, rotation, and opacity so these
remain editable in the timeline. Use input keyframes for custom Canvas effects,
with separate named inputs when users need independent timing or easing. A single
progress input can drive one coherent effect, such as a reveal; avoid burying
separate entrances, fades, and movements in hardcoded script timelines.

Only layers whose immediate parent is a composition have clips. Supply
`clip-start`, `clip-duration`, and `clip-trim` together, in seconds. Start may be
negative; duration and trim are nonnegative. Omit all three outside compositions.
Inside a composition, omission keeps an existing clip or gives a new layer start
`0`, trim `0`, and the parent composition's duration. When moving a layer out of a
composition, remove its clip attributes.

At parent time `t`, local time is `t - clip-start`. The visible parent interval is
`[clip-start + clip-trim, clip-start + clip-trim + clip-duration)` with an exclusive
end. Thus start `7`, trim `3`, duration `5` is visible from parent time 10 to 15,
starting at local time 3. A nested composition clamps its local time to its own
duration when evaluating children.

`<animation field="opacity">` targets any box field. `<animation input="progress">`
targets a declared Canvas input of type `number` or `color`. Each target has at
most one animation, with no XML ID. Keyframe times are nonnegative local seconds,
strictly increasing; their values match the target's number, pair, or color type.
Before/after the track, the first/last value is held. Easing describes the transition
to the next keyframe: `linear` (default), `hold`, `bezier(x1 y1 x2 y2)`, or
`spring(bounce)`. Bezier x values and spring bounce are in `0..1`.

Animations on a layer outside a composition are dormant. Remove an input and its
animation together, or remove the animation first. A Canvas has no automatic
time argument: animate a numeric input and read its sampled value in the script.

## Canvas scripts and inputs

Read the bundled [Canvas reference](canvas.md)
before authoring a script. Scripts
use `export default defineRenderer({ setup, render, dispose })` in an isolated browser iframe;
HTML/CSS and DOM rendering are unsupported.

Put JavaScript inside `<script><![CDATA[...]]></script>`. CDATA preserves script
text; split a literal `]]>` into `]]]]><![CDATA[>`. Escape XML special characters
in ordinary text and attributes, including `&amp;`, `&lt;`, and `&quot;` as needed.

Each input requires `key` and `type`; keys match `[a-z][a-zA-Z0-9]*`. Optional
`label` must be nonempty. Runtime inputs contain values, not declaration objects.

| Type      | Value                              | Additional syntax                            |
| --------- | ---------------------------------- | -------------------------------------------- |
| `string`  | element text, including empty text | no `value` attribute; CDATA or escaped text  |
| `number`  | numeric `value`                    | optional `min`, `max`, positive `step`       |
| `color`   | color `value`                      | normalized RGBA object at runtime            |
| `boolean` | `value="true"` or `value="false"`  | no child elements                            |
| `select`  | `value` matching an option         | one or more `<option>text</option>` children |

### Input authoring best practices

- Expose controls for edits the user is likely to make: copy, colors, layout
  choices, and motion parameters. Also consider what gives this particular
  creation its character: a pattern might offer density and spacing, while a
  curved motif might offer bend and spread. Choose controls that produce useful
  variations and let users shape the result without editing code. Keep
  implementation constants in the script and derive related values from shared
  controls and Canvas dimensions. Avoid separate inputs for values that should
  always change together.
- Use stable, descriptive camelCase keys such as `title`, `accentColor`, and
  `fontSize`. Give controls readable labels; include units where helpful, such as
  `Font size (px)` or `Source time (s)`. Renaming a key requires updating its script
  references and any `<animation input="...">` target in the same edit.
- Choose the type that fits the control: `string` for editable copy, `color` for
  colors, `boolean` for toggles, `select` for a finite set of supported choices,
  and `number` for quantities. Prefer a select over free text when only certain
  values are valid. For asset choices, use binding names as select values and
  declare every selectable asset in `<asset-bindings>`; inputs do not hold assets.
- Set initial values that produce the intended design before any animation runs.
  Give numbers meaningful `min`, `max`, and `step` values where appropriate;
  for example, `0..1` with step `0.01` for normalized progress, or step `1` for
  counts. Keep initial values and authored keyframes within the intended range.
  Handle any bounds needed for valid rendering in the script rather than relying
  on control metadata to protect calculations.
- Read editable values from `inputs` in `render`, so changes affect the next
  frame. Do not hardcode a second copy of those values or cache them only during
  setup. Handle valid edge values, such as empty copy or a zero count, without
  replacing them with defaults through truthiness checks.
- For custom motion, animate a meaningful input such as `reveal`, `bend`, or
  `sourceTime` in seconds through XML. Derive the frame from its sampled value so
  seeking remains deterministic; use separate tracks for independently timed
  effects. Only number and color inputs can have input animation tracks; an
  input's name does not give it a clock.
- When previewing is available, change the exposed controls and check that each
  affects the intended result. Check numeric endpoints, select choices, and
  representative text lengths; for animated controls, also revisit an earlier
  frame. A successful XML write alone does not verify the controls' behavior.

## Complete example

Create this subtree with `write_xml` under the first page. It declares all five
input types and animates a number input and a box field. Read the returned
`nodeId` before updating it. Users can inspect playback, including backward seeks,
in Stewdio's editor.

```xml
<composition name="Intro" duration="4" size="800 450" background="#172033">
  <canvas name="Title" position="80 150" size="640 150" clip-start="0" clip-duration="4" clip-trim="0">
    <asset-bindings />
    <script><![CDATA[export default defineRenderer({
  setup({ canvas }) {
    const context = canvas.getContext("2d");
    if (context === null) throw new Error("Canvas 2D is unavailable");
    return context;
  },
  render({ canvas, state: context, inputs, width, height, pixelRatio }) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const color = inputs.tint;
    context.fillStyle = `rgba(${color.r * 255},${color.g * 255},${color.b * 255},${color.a})`;
    context.font = (inputs.bold ? "700 " : "400 ") + inputs.fontSize + "px sans-serif";
    context.textAlign = inputs.align;
    context.textBaseline = "middle";
    const x = inputs.align === "center" ? width / 2 : 20;
    context.fillText(inputs.title, x, height / 2, width - 80);
  },
  dispose() {}
});]]></script>
    <input key="title" type="string" label="Title">Hello &amp; welcome</input>
    <input key="fontSize" type="number" label="Font size (px)" value="48" min="16" max="64" step="1" />
    <input key="tint" type="color" label="Text color" value="#FFCC66" />
    <input key="bold" type="boolean" label="Bold" value="true" />
    <input key="align" type="select" label="Text alignment" value="center">
      <option>left</option>
      <option>center</option>
    </input>
    <animation input="fontSize">
      <keyframe time="0" value="24" />
      <keyframe time="1" value="48" />
    </animation>
    <animation field="opacity">
      <keyframe time="0" value="0" easing="bezier(0.25 0.1 0.25 1)" />
      <keyframe time="0.5" value="1" />
    </animation>
  </canvas>
</composition>
```
