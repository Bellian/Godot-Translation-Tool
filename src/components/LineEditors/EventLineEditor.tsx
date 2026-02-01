import { possibleEvents } from '@/app/data/dataSelects'

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
  const eventOptions = editedLine.eventName ? possibleEvents[editedLine.eventName as keyof typeof possibleEvents] : null

  return (
    <div className="grid grid-cols-[200px_1fr] gap-2">
      <div>
        <label className="block text-xs font-medium mb-0.5">Event Name</label>
        <select
          value={editedLine.eventName || ''}
          onChange={(e) => onChange({ ...editedLine, eventName: e.target.value, eventValue: '' })}
          className="w-full px-1.5 py-0.5 border rounded"
        >
          <option value="">Select event...</option>
          {Object.keys(possibleEvents).map((eventName) => (
            <option key={eventName} value={eventName}>
              {eventName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-0.5">Event Value</label>
        {eventOptions ? (
          <select
            value={editedLine.eventValue || ''}
            onChange={(e) => onChange({ ...editedLine, eventValue: e.target.value })}
            className="w-full px-1.5 py-0.5 border rounded"
          >
            <option value="">Select value...</option>
            {eventOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={editedLine.eventValue || ''}
            onChange={(e) => onChange({ ...editedLine, eventValue: e.target.value })}
            placeholder="Enter value..."
            className="w-full px-1.5 py-0.5 border rounded"
          />
        )}
      </div>
    </div>
  )
}
