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
  editedLine: DialogLine
  onChange: (line: DialogLine) => void
}

export default function EventLineEditor({ editedLine, onChange }: Props) {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-2">
      <div>
        <label className="block text-xs font-medium mb-0.5">Event Name</label>
        <input
          type="text"
          value={editedLine.eventName || ''}
          onChange={(e) => onChange({ ...editedLine, eventName: e.target.value })}
          className="w-full px-1.5 py-0.5 border rounded"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-0.5">Event Value</label>
        <input
          type="text"
          value={editedLine.eventValue || ''}
          onChange={(e) => onChange({ ...editedLine, eventValue: e.target.value })}
          className="w-full px-1.5 py-0.5 border rounded"
        />
      </div>
    </div>
  )
}
