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

export default function DataLineEditor({ line, editedLine, onChange }: Props) {
  return (
    <div>
      <label className="block text-xs font-medium mb-0.5">Data (JSON)</label>
      <textarea
        value={editedLine.data || ''}
        onChange={(e) => onChange({ ...editedLine, data: e.target.value })}
        className="w-full px-1.5 py-0.5 border rounded font-mono"
        rows={4}
      />
    </div>
  )
}
