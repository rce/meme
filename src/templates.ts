import registry from '../templates/templates.json'
import type { RegistryEntry, Template } from './types.ts'

// Vite hashes and emits every image in templates/, so dropping a file in that folder and
// naming it in templates.json is all it takes to add a format.
const images = import.meta.glob<string>('../templates/*.{jpg,jpeg,png,webp,gif}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const byFilename = new Map(
  Object.entries(images).map(([path, url]) => [path.split('/').pop() as string, url]),
)

export const templates: Template[] = (registry as RegistryEntry[]).flatMap((entry) => {
  const src = byFilename.get(entry.image)
  if (!src) {
    console.warn(`Template "${entry.id}" refers to templates/${entry.image}, which is missing.`)
    return []
  }
  const { image: _image, ...rest } = entry
  return [{ ...rest, src }]
})
