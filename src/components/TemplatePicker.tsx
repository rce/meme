import type { Template } from '../types.ts'

interface Props {
  choices: Template[]
  current: Template | null
  onSelect: (choice: Template) => void
  onUpload: (file: File) => void
}

export default function TemplatePicker({ choices, current, onSelect, onUpload }: Props) {
  return (
    <div className="picker">
      {choices.map((choice) => (
        <button
          key={choice.id}
          type="button"
          className="picker__item"
          aria-pressed={choice.id === current?.id}
          onClick={() => onSelect(choice)}
        >
          <img src={choice.src} alt="" loading="lazy" />
          <span>{choice.name}</span>
        </button>
      ))}

      <label className="picker__item picker__upload">
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onUpload(file)
            // Let the same file be picked again after a reset.
            event.target.value = ''
          }}
        />
        <span aria-hidden="true">+</span>
        <span>Your own picture</span>
      </label>
    </div>
  )
}
