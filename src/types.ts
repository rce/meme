export type TextStyleName = 'impact' | 'panel'
export type LayoutName = 'caption' | 'top' | 'bottom'
export type Align = 'left' | 'center' | 'right'
export type Anchor = 'top' | 'center' | 'bottom'

/** `[x, y, width, height]`, as fractions of the image. */
export type Box = [number, number, number, number]

export interface TextArea {
  id: string
  label: string
  box: Box
  style?: TextStyleName
  /** Areas sharing a group render at the smallest size any of them needed. */
  sizeGroup?: string
  align?: Align
  anchor?: Anchor
}

/** Where the words go: either a named layout or explicit boxes. */
export interface MemeFormat {
  layout?: LayoutName
  textAreas?: TextArea[]
}

/** One entry of `templates/templates.json`. */
export interface RegistryEntry extends MemeFormat {
  id: string
  name: string
  image: string
}

/** A pickable picture: a registry entry with its resolved URL, or an upload. */
export interface Template extends MemeFormat {
  id: string
  name: string
  src: string
}

export type Texts = Record<string, string>

export interface Settings {
  uppercase: boolean
  outline: boolean
  fontScale: number
}

/** Anything `drawImage` accepts that also reports its own size. */
export type Drawable = HTMLImageElement | HTMLCanvasElement
