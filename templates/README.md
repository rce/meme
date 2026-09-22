# Template registry

Every template is a hardcoded `(picture, format)` pair: an image file in this folder plus
an entry in [`templates.json`](./templates.json) that says where the text goes.

## Adding a template

1. Drop the image in this folder (`.jpg`, `.jpeg`, `.png`, `.webp` or `.gif`).
2. Add an object to `templates.json`.

The image is picked up by filename, so nothing else needs touching.

## Entry fields

| Field       | Required | Meaning                                                              |
| ----------- | -------- | -------------------------------------------------------------------- |
| `id`        | yes      | Unique, stable slug. Used in the export filename.                     |
| `name`      | yes      | Label shown in the picker.                                            |
| `image`     | yes      | Filename in this folder.                                              |
| `layout`    | no       | A named preset: `caption` (default), `top`, `bottom`.                 |
| `textAreas` | no       | Explicit boxes. Overrides `layout` when present.                      |

### Named layouts

For the plain "text over the picture" formats you only need `layout`:

```json
{ "id": "grumpy-cat", "name": "Grumpy Cat", "image": "grumpy.jpg", "layout": "caption" }
```

- `caption` — white Impact text with a black outline, one box at the top and one at the bottom.
- `top` / `bottom` — the same, but only one box.

### Explicit text areas

Multi-panel formats (Drake, Distracted Boyfriend, expanding brain…) list their boxes:

```json
{
  "id": "reject",
  "label": "Drake says no to…",
  "box": [0.5, 0.0, 0.5, 0.5],
  "style": "panel",
  "sizeGroup": "panels",
  "align": "center",
  "anchor": "center"
}
```

- `box` is `[x, y, width, height]` as **fractions of the image**, so it survives resizing.
  `[0.5, 0.0, 0.5, 0.5]` is the top-right quarter.
- `style` is `impact` (white fill, black outline — for text *on* the picture) or `panel`
  (dark text, no outline — for the blank caption areas of a multi-panel format).
- `sizeGroup` ties areas together: every area with the same group renders at the smallest
  size any of them needed, so the panels of one meme read as a set instead of each picking
  its own size.
- `align` (`left` | `center` | `right`) and `anchor` (`top` | `center` | `bottom`) are
  optional; they default to whatever the style uses.

Text is wrapped and shrunk automatically to fit its box, so the boxes only need to be
roughly right. Words are never broken mid-word unless a single word cannot fit at any size.
