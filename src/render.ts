// Canvas rendering for memes: text is wrapped and shrunk to fit its box, so a template
// only has to declare roughly where the words belong.

import type {
  Align,
  Anchor,
  Drawable,
  LayoutName,
  MemeFormat,
  Settings,
  TextArea,
  Texts,
  TextStyleName,
} from './types.ts'

export const FONT_STACK = `Impact, Anton, "Arial Narrow", "Helvetica Neue", Arial, sans-serif`

interface TextStyle {
  fill: string
  stroke: string | null
  align: Align
  anchor: Anchor
  lineHeight: number
  /** Inset from the box edge, as a fraction of the box's shorter side. */
  padding: number
  /** Ceiling on the font size, as a fraction of the image height. */
  maxFont: number
}

export const TEXT_STYLES: Record<TextStyleName, TextStyle> = {
  // Text sitting on top of the picture: the classic white-on-black-outline meme face.
  impact: {
    fill: '#ffffff',
    stroke: '#000000',
    align: 'center',
    anchor: 'center',
    lineHeight: 1.1,
    padding: 0.03,
    maxFont: 0.14,
  },
  // Text in a blank caption area of a multi-panel format.
  panel: {
    fill: '#111111',
    stroke: null,
    align: 'center',
    anchor: 'center',
    lineHeight: 1.2,
    padding: 0.07,
    maxFont: 0.1,
  },
}

/** Text areas for the plain "words over the picture" formats. */
const CAPTION_TOP: TextArea = {
  id: 'top',
  label: 'Top text',
  box: [0.04, 0.02, 0.92, 0.3],
  style: 'impact',
  anchor: 'top',
}
const CAPTION_BOTTOM: TextArea = {
  id: 'bottom',
  label: 'Bottom text',
  box: [0.04, 0.68, 0.92, 0.3],
  style: 'impact',
  anchor: 'bottom',
}

export const LAYOUTS: Record<LayoutName, TextArea[]> = {
  caption: [CAPTION_TOP, CAPTION_BOTTOM],
  top: [CAPTION_TOP],
  bottom: [CAPTION_BOTTOM],
}

/** Resolve a format's `textAreas` / `layout` into a concrete list of areas. */
export function resolveTextAreas(format: MemeFormat): TextArea[] {
  if (format.textAreas?.length) return format.textAreas
  return (format.layout && LAYOUTS[format.layout]) || LAYOUTS.caption
}

function wrapParagraph(
  ctx: CanvasRenderingContext2D,
  paragraph: string,
  maxWidth: number,
  allowBreak: boolean,
): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of paragraph.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate
      continue
    }
    if (line) lines.push(line)
    if (!allowBreak || ctx.measureText(word).width <= maxWidth) {
      // Overlong on its own: leave it, and let the caller's width check reject this size.
      line = word
      continue
    }
    // Last resort at the smallest font: break the word between characters.
    let chunk = ''
    for (const char of word) {
      if (chunk && ctx.measureText(chunk + char).width > maxWidth) {
        lines.push(chunk)
        chunk = char
      } else {
        chunk += char
      }
    }
    line = chunk
  }
  if (line) lines.push(line)
  return lines
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  allowBreak: boolean,
): string[] {
  return text
    .split('\n')
    .flatMap((paragraph) =>
      paragraph.trim() ? wrapParagraph(ctx, paragraph, maxWidth, allowBreak) : [''],
    )
}

interface Fitted {
  size: number
  lines: string[]
}

/** Largest integer font size (<= maxFont) at which the wrapped text still fits the box. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  lineHeight: number,
  maxFont: number,
): Fitted {
  const measure = (size: number, allowBreak: boolean) => {
    ctx.font = `${size}px ${FONT_STACK}`
    const lines = wrap(ctx, text, maxWidth, allowBreak)
    const width = lines.reduce((widest, line) => Math.max(widest, ctx.measureText(line).width), 0)
    return { lines, width, height: lines.length * size * lineHeight }
  }

  const search = (allowBreak: boolean): Fitted | null => {
    let low = 6
    let high = Math.max(6, Math.floor(maxFont))
    let best: Fitted | null = null
    while (low <= high) {
      const size = (low + high) >> 1
      const laid = measure(size, allowBreak)
      if (laid.height <= maxHeight && laid.width <= maxWidth) {
        best = { size, lines: laid.lines }
        low = size + 1
      } else {
        high = size - 1
      }
    }
    return best
  }

  // Prefer a size where every word survives intact; only chop words when nothing fits.
  return search(false) ?? search(true) ?? { size: 6, lines: measure(6, true).lines }
}

interface Laid extends Fitted {
  area: TextArea
  style: TextStyle
  box: { x: number; y: number; w: number; h: number }
}

/** Work out where an area's text goes and how big it can be, without drawing it. */
function layoutArea(
  ctx: CanvasRenderingContext2D,
  area: TextArea,
  text: string,
  imageWidth: number,
  imageHeight: number,
  settings: Settings,
  sizeCap: number,
): Laid {
  const preset = TEXT_STYLES[area.style ?? 'impact'] ?? TEXT_STYLES.impact
  const style: TextStyle = {
    ...preset,
    ...(area.align ? { align: area.align } : {}),
    ...(area.anchor ? { anchor: area.anchor } : {}),
  }
  const content = settings.uppercase ? text.toUpperCase() : text

  const [fx, fy, fw, fh] = area.box
  const pad = style.padding * Math.min(fw * imageWidth, fh * imageHeight)
  const box = {
    x: fx * imageWidth + pad,
    y: fy * imageHeight + pad,
    w: fw * imageWidth - pad * 2,
    h: fh * imageHeight - pad * 2,
  }

  const maxFont = Math.min(style.maxFont * imageHeight * settings.fontScale, box.h, sizeCap)
  const fitted = fitText(ctx, content, box.w, box.h, style.lineHeight, maxFont)
  return { area, style, box, ...fitted }
}

function paintArea(ctx: CanvasRenderingContext2D, { style, box, size, lines }: Laid, settings: Settings) {
  const lineStep = size * style.lineHeight
  const blockHeight = lines.length * lineStep
  const startY =
    style.anchor === 'top'
      ? box.y
      : style.anchor === 'bottom'
        ? box.y + box.h - blockHeight
        : box.y + (box.h - blockHeight) / 2
  const x =
    style.align === 'left' ? box.x : style.align === 'right' ? box.x + box.w : box.x + box.w / 2

  ctx.save()
  ctx.font = `${size}px ${FONT_STACK}`
  ctx.textAlign = style.align
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  ctx.fillStyle = style.fill
  ctx.strokeStyle = style.stroke ?? 'transparent'
  ctx.lineWidth = size / 7

  lines.forEach((line, index) => {
    const y = startY + index * lineStep + lineStep / 2
    if (style.stroke && settings.outline) ctx.strokeText(line, x, y)
    ctx.fillText(line, x, y)
  })
  ctx.restore()
}

/**
 * Draw `image` plus the format's text onto `canvas`, resizing the canvas to match.
 * `texts` maps a text area's id to its string.
 */
export function drawMeme(
  canvas: HTMLCanvasElement,
  image: Drawable,
  format: MemeFormat,
  texts: Texts,
  settings: Settings,
) {
  const width = ('naturalWidth' in image && image.naturalWidth) || image.width
  const height = ('naturalHeight' in image && image.naturalHeight) || image.height
  if (!width || !height) return

  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(image, 0, 0, width, height)

  const filled = resolveTextAreas(format)
    .map((area) => [area, (texts[area.id] ?? '').trim()] as const)
    .filter(([, text]) => text)

  let laid = filled.map(([area, text]) =>
    layoutArea(ctx, area, text, width, height, settings, Infinity),
  )

  // Panels of one format should read as a set, so areas sharing a `sizeGroup` all drop
  // to the smallest size any of them needed.
  const caps = new Map<string, number>()
  for (const { area, size } of laid) {
    if (!area.sizeGroup) continue
    caps.set(area.sizeGroup, Math.min(caps.get(area.sizeGroup) ?? Infinity, size))
  }
  if (caps.size) {
    laid = laid.map((item, index) => {
      const cap = item.area.sizeGroup === undefined ? undefined : caps.get(item.area.sizeGroup)
      if (cap === undefined || cap >= item.size) return item
      return layoutArea(ctx, item.area, filled[index][1], width, height, settings, cap)
    })
  }

  for (const item of laid) paintArea(ctx, item, settings)
}
