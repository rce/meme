import { useEffect } from 'react'
import type { RefObject } from 'react'
import { drawMeme } from '../render.ts'
import type { Drawable, MemeFormat, Settings, Texts } from '../types.ts'

interface Props {
  canvasRef: RefObject<HTMLCanvasElement | null>
  image: Drawable | null
  format: MemeFormat | null
  texts: Texts
  settings: Settings
  /** Held false until the meme font has loaded, since canvas measures against it. */
  ready: boolean
}

export default function MemeCanvas({ canvasRef, image, format, texts, settings, ready }: Props) {
  useEffect(() => {
    if (image && format && ready && canvasRef.current) {
      drawMeme(canvasRef.current, image, format, texts, settings)
    }
  }, [canvasRef, image, format, texts, settings, ready])

  return (
    <div className="preview">
      <canvas ref={canvasRef} className="preview__canvas" hidden={!image} />
      {!image && <p className="preview__placeholder">Pick a picture to get started.</p>}
    </div>
  )
}
