# Authoring Stewdio File XML

Use `list_files` to find a File, or `create_file({ name })` to create one with an
empty canvas. Each File is one canvas with no page nodes or File background property. File tools use `fileId`; creation and listing return it as `id`.
Files are private to their creator. Creation and writes enforce the creator's plan
and File/composition limits.
No open editor or desktop application is required.

## Read, create, and update

- `read_xml({ fileId, nodeId?, depth? })` returns `{ xml, etag }`. Omit `nodeId`
  for the whole File. `depth` is a nonnegative integer; omit it for all descendants.
  Whole-File reads contain top-level nodes directly inside `<file>`. At whole-File `depth: 0`, these nodes are collapsed; each additional depth expands another level. Use `list_assets` and `get_asset` for asset metadata.
- Read a known target directly with `read_xml({ fileId, nodeId })` to get its full
  subtree. For discovery in a large File, use a limited `depth` for an overview,
  then read the relevant node without `depth`. A collapsed node's ID can be used
  immediately; there is no need to expand each intermediate level. Omit both
  `nodeId` and `depth` when the task needs the complete File.
- `write_xml({ fileId, mutationId, xml, parentId?, ifMatch? })` accepts exactly one section,
  composition, graphic, image, or video subtree. `<file>` is inspection-only. `<page>`, `<pages>`, and File Asset records are not supported. There is no standalone animation write.
- To create, omit the root `id`. New nodes go under `parentId`; omit it or use `null` to create at the File root. Omit IDs
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
- `mutationId` is a new UUID for each edit. After losing a write response, retry
  the same XML with the same `mutationId`: an edit that was already saved returns
  its result, including the created `nodeId`, without applying again. A new
  `mutationId` is a new edit, so a repeated creation would create a duplicate.

## Replacement semantics

An update describes the complete children and animations of each expanded node.
Omitted descendants and animation tracks are removed. XML child order determines
sibling order. On an expanded Graphic, the `<input>` elements replace its entire
input map, so omitted inputs are removed too.

Omitted scalar/box attributes on existing nodes keep their values. Omitting a
Graphic's `<script>` preserves its script. Asset references live on `<input>`
elements, so an expanded Graphic's inputs carry every reference it keeps. New
nodes use editor defaults for omitted properties; a new Graphic has no inputs
and a script that clears its drawing surface.

Depth-limited reads emit self-closing nodes with `id` and `collapsed="true"`.
Keep that flag to retain all hidden descendants, inputs, and animations while
applying any supplied attributes. A collapsed node must already exist within the
edited subtree and cannot contain child elements. Read it at greater depth before
editing or moving anything inside it.

To move a descendant between containers, replace their common ancestor and
include the descendant's ID under its new parent. Local transforms are retained;
adjust them if its canvas position should stay fixed. To delete a descendant, omit
it from its parent's replacement. XML cannot move nodes across top-level subtrees
or delete/reorder top-level nodes because the whole-File root is not writable.

## Elements and attributes

Names are case-sensitive; unknown elements and attributes are rejected. Nesting
establishes parentage; do not supply `parentId`, `type`, or `indexKey` as XML attributes.

| Element          | Attributes                                                  | Children                                      |
| ---------------- | ----------------------------------------------------------- | --------------------------------------------- |
| `section`        | `id`, `name`, `background`, box                             | section, composition, graphic, image, video   |
| `composition`    | `id`, `name`, `background`, `duration`, box, clip           | animation, composition, graphic, image, video |
| `graphic`        | `id`, `name`, box, clip                                     | script, input, animation                      |
| `image`, `video` | `id`, `name`, `asset`, box, clip                            | animation                                     |
| `script`         | none                                                        | JavaScript text, preferably CDATA             |
| `input`          | `key`, `type`, optional `label`, type-specific values below | text or option elements                       |
| `option`         | none                                                        | text                                          |
| `animation`      | exactly one of `field`, `input`                             | one or more keyframe elements                 |
| `keyframe`       | `time`, `value`, optional `easing`                          | none                                          |

All five writable node elements also accept `collapsed="true"` with the constraints above.
Sections cannot be placed inside compositions. Graphics, images, and videos have
no child nodes. A composition crops its descendants to its bounds and has a
positive `duration` in seconds; a section has no timeline.

Box attributes are `position="x y"`, `size="width height"`, `scale="x y"`,
`anchor="x y"`, `rotation`, and `opacity`. Pairs use whitespace, not commas.
Position and size are in the parent's local coordinate system; scale is a
multiplier, anchor is a fraction of the node's size, rotation is in degrees,
and opacity is in `0..1`. Defaults are position `0 0`, size `100 100`, scale
`1 1`, anchor `0.5 0.5`, rotation `0`, opacity `1`. Supply image/video `size` from the File Asset
media dimensions; XML cannot infer geometry from external metadata. Default composition duration is 5 seconds.

Colors accept `#RRGGBB`, `#RRGGBBAA`, or four whitespace-separated RGBA numbers
in `0..1`, such as `0.5 0.25 0 1`. Use these for `background`, color inputs, and
color keyframes. CSS color names, short hex, and `rgba(...)` are not XML colors.

Node IDs include their canonical type prefix and eight lowercase alphanumeric characters,
such as `graphic:a1b2c3d4`. Use IDs from reads when editing. New image/video
layers require `asset` set to the hash of a File Asset of the matching kind in the
same File. Existing layers may omit `asset` to retain it.

File Assets are separate from File XML. Use `list_assets` and
`get_asset` with the File ID, then use the returned
`hash` in an image/video `asset` attribute or a Graphic asset input's `ref`.
Use `create_asset_upload`, upload the bytes when requested, and
`create_assets` before placing media. An Asset's `hash` is the SHA-256 of its bytes and is the same
in every File, but the destination File needs its own File Asset first; add one from another File
with `create_assets` and `source: { fileId, hash }`.

Renaming a File Asset is separate from node XML and node undo. File Assets remain
in their File when nodes are removed. See [Graphic scripts](graphic.md) for asset inputs.

## Clips and animations

Use field keyframes for a layer's position, scale, rotation, and opacity so these
remain editable in the timeline. Use input keyframes for custom Graphic effects,
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
targets a declared Graphic input of type `number` or `color`. Each target has at
most one animation, with no XML ID. Keyframe times are nonnegative local seconds,
strictly increasing; their values match the target's number, pair, or color type.
Before/after the track, the first/last value is held. Easing describes the transition
to the next keyframe: `linear` (default), `hold`, `bezier(x1 y1 x2 y2)`, or
`spring(bounce)`. Bezier x values and spring bounce are in `0..1`.

Animations on a layer outside a composition are dormant. Remove an input and its
animation together, or remove the animation first. A Graphic has no automatic
time argument: animate a numeric input and read its sampled value in the script.

## Graphic scripts and inputs

Read the bundled [Graphic reference](graphic.md)
before authoring a script. Scripts
use `export default defineRenderer((graphic) => ({ render() {...} }))` in an
isolated browser iframe; HTML/CSS and DOM rendering are unsupported.

Put JavaScript inside `<script><![CDATA[...]]></script>`. CDATA preserves script
text; split a literal `]]>` into `]]]]><![CDATA[>`. Escape XML special characters
in ordinary text and attributes, including `&amp;`, `&lt;`, and `&quot;` as needed.

Each input requires `key` and `type`; keys match `[a-z][a-zA-Z0-9]*`. Optional
`label` must be nonempty. At runtime each input is a handle: scalar handles read
the sampled value as `.value`, and asset and font handles load files through methods.

| Type      | Value                              | Additional syntax                                        |
| --------- | ---------------------------------- | -------------------------------------------------------- |
| `string`  | element text, including empty text | no `value` attribute; CDATA or escaped text              |
| `number`  | numeric `value`                    | optional `min`, `max`, positive `step`                   |
| `color`   | color `value`                      | normalized RGBA `.value` at runtime                      |
| `boolean` | `value="true"` or `value="false"`  | no child elements                                        |
| `select`  | `value` matching an option         | one or more `<option>text</option>` children             |
| `image`   | optional `ref` to an image asset   | no `value`; `ImageInput` handle or `null`                |
| `video`   | optional `ref` to a video asset    | no `value`; `VideoInput` handle or `null`                |
| `model`   | optional `ref` to a model asset    | no `value`; `ModelInput` handle or `null`                |
| `font`    | required `font` family             | optional `font-weight`, `font-style`; `FontInput` handle |

Asset inputs reference File Assets by `hash`; omit `ref` to declare
an unset input that the script reads as `null`. Use a `hash` from `list_assets`
or `get_asset` for the same File as the `ref`. Asset inputs cannot have animation tracks.

### Input authoring best practices

- Expose controls for edits the user is likely to make: copy, colors, layout
  choices, and motion parameters. Also consider what gives this particular
  creation its character: a pattern might offer density and spacing, while a
  curved motif might offer bend and spread. Choose controls that produce useful
  variations and let users shape the result without editing code. Keep
  implementation constants in the script and derive related values from shared
  controls and Graphic dimensions. Avoid separate inputs for values that should
  always change together.
- Use stable, descriptive camelCase keys such as `title`, `accentColor`, and
  `fontSize`. Give controls readable labels; include units where helpful, such as
  `Font size (px)` or `Source time (s)`. Renaming a key requires updating its script
  references and any `<animation input="...">` target in the same edit.
- Choose the type that fits the control: `string` for editable copy, `color` for
  colors, `boolean` for toggles, `select` for a finite set of supported choices,
  and `number` for quantities. Prefer a select over free text when only certain
  values are valid. Use `image`, `video`, and `model` inputs for File Assets so
  users can swap them in the editor; declare one input per selectable asset.
- Set initial values that produce the intended design before any animation runs.
  Give numbers meaningful `min`, `max`, and `step` values where appropriate;
  for example, `0..1` with step `0.01` for normalized progress, or step `1` for
  counts. Keep initial values and authored keyframes within the intended range.
  Handle any bounds needed for valid rendering in the script rather than relying
  on control metadata to protect calculations.
- Read editable values as `graphic.inputs.key.value` in `render`, so changes
  affect the next frame. Do not hardcode a second copy of those values or cache
  a `.value` in the factory; keeping the handle itself is safe. Handle valid edge values, such as empty copy or a zero count, without
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

Create this subtree with `write_xml` at the File root. It declares all five
scalar input types and animates a number input and a box field. Read the returned
`nodeId` before updating it. Users can inspect playback, including backward seeks,
in Stewdio's editor.

```xml
<composition name="Intro" duration="4" size="800 450" background="#172033">
  <graphic name="Title" position="80 150" size="640 150" clip-start="0" clip-duration="4" clip-trim="0">
    <script><![CDATA[export default defineRenderer((graphic) => {
  const context = graphic.canvas.getContext("2d");
  if (context === null) throw new Error("Canvas 2D is unavailable");
  return {
    render() {
      // The host has already reset, cleared, and density-scaled this surface.
      const { size, inputs } = graphic;
      const color = inputs.tint.value;
      const align = inputs.align.value;
      context.fillStyle = `rgba(${color.r * 255},${color.g * 255},${color.b * 255},${color.a})`;
      context.font = (inputs.bold.value ? "700 " : "400 ") + inputs.fontSize.value + "px sans-serif";
      context.textAlign = align;
      context.textBaseline = "middle";
      const x = align === "center" ? size.width / 2 : 20;
      context.fillText(inputs.title.value, x, size.height / 2, size.width - 80);
    },
  };
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
  </graphic>
</composition>
```
