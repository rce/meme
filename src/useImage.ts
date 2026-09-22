import { useEffect, useState } from 'react'
import type { Drawable } from './types.ts'

// Phone cameras hand us 4000px originals; nobody needs a meme that big, and the
// per-keystroke redraw gets sluggish.
const MAX_DIMENSION = 2000

function downscale(img: HTMLImageElement): Drawable {
  const longest = Math.max(img.naturalWidth, img.naturalHeight)
  if (longest <= MAX_DIMENSION) return img

  const scale = MAX_DIMENSION / longest
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}

interface ImageState {
  image: Drawable | null
  error: string | null
  loading: boolean
}

/** Load `src` into something drawable, capped to a sane size. */
export function useImage(src: string | null): ImageState {
  const [state, setState] = useState<ImageState>({
    image: null,
    error: null,
    loading: Boolean(src),
  })

  useEffect(() => {
    if (!src) {
      setState({ image: null, error: null, loading: false })
      return
    }

    let alive = true
    setState({ image: null, error: null, loading: true })

    const img = new Image()
    img.onload = () => {
      if (alive) setState({ image: downscale(img), error: null, loading: false })
    }
    img.onerror = () => {
      if (alive) setState({ image: null, error: 'That image could not be loaded.', loading: false })
    }
    img.src = src

    return () => {
      alive = false
    }
  }, [src])

  return state
}
