type DialogLine = {
  id: number
  order: number
  type: string
  speaker?: string | null
  textKey?: string | null
  background?: string | null
  eventName?: string | null
  eventValue?: string | null
  data?: string | null
}

type Props = {
  line: DialogLine
  editedLine: DialogLine
  onChange: (line: DialogLine) => void
}

export default function BackgroundLineEditor({ line, editedLine, onChange }: Props) {
  return (
    <div>
      <label className="block text-xs font-medium mb-0.5">Background</label>
      <input
        type="text"
        value={editedLine.background || ''}
        onChange={(e) => onChange({ ...editedLine, background: e.target.value })}
        className="w-full px-1.5 py-0.5 border rounded"
      />
    </div>
  )
}
