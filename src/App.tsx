import { useEffect, useMemo, useRef, useState } from 'react'
import { templates } from './templates.ts'
import { LAYOUTS, resolveTextAreas } from './render.ts'
import { useImage } from './useImage.ts'
import MemeCanvas from './components/MemeCanvas.tsx'
import TemplatePicker from './components/TemplatePicker.tsx'
import type { LayoutName, Settings, Template, Texts } from './types.ts'

const DEFAULT_SETTINGS: Settings = { uppercase: true, outline: true, fontScale: 1 }

const LAYOUT_LABELS: Record<LayoutName, string> = {
  caption: 'Top and bottom',
  top: 'Top only',
  bottom: 'Bottom only',
}

export default function App() {
  const [template, setTemplate] = useState<Template | null>(templates[0] ?? null)
  const [layout, setLayout] = useState<LayoutName>(templates[0]?.layout ?? 'caption')
  const [texts, setTexts] = useState<Texts>({})
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [upload, setUpload] = useState<Template | null>(null)
  const [fontsReady, setFontsReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Canvas measures text against the real font, so hold the first draw until Anton
  // (our Impact stand-in) has actually arrived.
  useEffect(() => {
    let alive = true
    const done = () => {
      if (alive) setFontsReady(true)
    }
    if (document.fonts?.load) document.fonts.load('16px Anton').then(done, done)
    else done()
    return () => {
      alive = false
    }
  }, [])

  // An uploaded picture lives on an object URL that has to outlive the render but not
  // the next upload.
  useEffect(() => {
    if (!upload) return
    return () => URL.revokeObjectURL(upload.src)
  }, [upload])

  const choices = useMemo(() => (upload ? [...templates, upload] : templates), [upload])

  // Templates with a named layout let you switch between top/bottom framings; the ones
  // with explicit boxes (Drake and friends) are fixed.
  const hasFixedAreas = Boolean(template?.textAreas?.length)
  const format = useMemo(
    () => (!template || hasFixedAreas ? template : { ...template, layout }),
    [template, hasFixedAreas, layout],
  )
  const areas = useMemo(() => (format ? resolveTextAreas(format) : []), [format])

  const { image, error, loading } = useImage(template?.src ?? null)

  const selectTemplate = (choice: Template) => {
    setTemplate(choice)
    setLayout(choice.layout ?? 'caption')
    setTexts({})
  }

  const handleUpload = (file: File) => {
    const next: Template = {
      id: 'upload',
      name: file.name.replace(/\.[^.]+$/, '') || 'Your picture',
      src: URL.createObjectURL(file),
      layout: 'caption',
    }
    setUpload(next)
    selectTemplate(next)
  }

  const withBlob = (use: (blob: Blob) => void) => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    canvas.toBlob((blob) => blob && use(blob), 'image/png')
  }

  const download = () =>
    withBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${template?.id ?? 'meme'}-meme.png`
      link.click()
      URL.revokeObjectURL(url)
    })

  const canCopy = typeof ClipboardItem !== 'undefined' && Boolean(navigator.clipboard?.write)
  const copy = () =>
    withBlob(async (blob) => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // Clipboard access can be denied; the download button still works.
      }
    })

  return (
    <div className="app">
      <header className="app__header">
        <h1>Meme Machine</h1>
        <p>Pick a picture, type the words, save the PNG.</p>
      </header>

      <main className="app__body">
        <section className="panel" aria-labelledby="picture-heading">
          <h2 id="picture-heading">Picture</h2>
          <TemplatePicker
            choices={choices}
            current={template}
            onSelect={selectTemplate}
            onUpload={handleUpload}
          />

          {template && !hasFixedAreas && (
            <fieldset className="field">
              <legend>Layout</legend>
              <div className="field__row">
                {(Object.keys(LAYOUTS) as LayoutName[]).map((name) => (
                  <label key={name} className="chip">
                    <input
                      type="radio"
                      name="layout"
                      value={name}
                      checked={layout === name}
                      onChange={() => setLayout(name)}
                    />
                    {LAYOUT_LABELS[name]}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <h2>Text</h2>
          {areas.map((area) => (
            <label key={area.id} className="field">
              <span>{area.label}</span>
              <textarea
                rows={2}
                value={texts[area.id] ?? ''}
                placeholder={area.label}
                onChange={(event) =>
                  setTexts((previous) => ({ ...previous, [area.id]: event.target.value }))
                }
              />
            </label>
          ))}

          <h2>Style</h2>
          <label className="field field--inline">
            <input
              type="checkbox"
              checked={settings.uppercase}
              onChange={(event) =>
                setSettings((previous) => ({ ...previous, uppercase: event.target.checked }))
              }
            />
            <span>ALL CAPS</span>
          </label>
          <label className="field field--inline">
            <input
              type="checkbox"
              checked={settings.outline}
              onChange={(event) =>
                setSettings((previous) => ({ ...previous, outline: event.target.checked }))
              }
            />
            <span>Black outline</span>
          </label>
          <label className="field">
            <span>Text size</span>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={settings.fontScale}
              onChange={(event) =>
                setSettings((previous) => ({ ...previous, fontScale: Number(event.target.value) }))
              }
            />
          </label>
        </section>

        <section className="panel panel--preview" aria-labelledby="preview-heading">
          <h2 id="preview-heading">Preview</h2>
          {loading && <p className="note">Loading picture…</p>}
          {error && <p className="note note--error">{error}</p>}
          <MemeCanvas
            canvasRef={canvasRef}
            image={image}
            format={format}
            texts={texts}
            settings={settings}
            ready={fontsReady}
          />
          <div className="actions">
            <button type="button" onClick={download} disabled={!image}>
              Download PNG
            </button>
            {canCopy && (
              <button type="button" className="secondary" onClick={copy} disabled={!image}>
                {copied ? 'Copied!' : 'Copy image'}
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
