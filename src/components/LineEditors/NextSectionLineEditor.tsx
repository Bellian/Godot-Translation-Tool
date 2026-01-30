'use client'

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

type Section = {
  sectionId: string
}

type Props = {
  line: DialogLine
  editedLine: DialogLine
  sections: Section[]
  onChange: (line: DialogLine) => void
}

export default function NextSectionLineEditor({
  line,
  editedLine,
  sections,
  onChange,
}: Props) {
  // Parse the data field which contains the nextSection info
  let nextSection = ''
  try {
    const parsed = JSON.parse(editedLine.data || '{}')
    nextSection = parsed.nextSection || ''
  } catch (e) {
    // Invalid JSON, keep empty
  }

  const handleNextSectionChange = (newNextSection: string) => {
    const newData = JSON.stringify({ nextSection: newNextSection })
    onChange({ ...editedLine, data: newData })
  }

  return (
    <div>
      <label className="block text-xs font-medium mb-0.5">Next Section</label>
      <select
        value={nextSection}
        onChange={(e) => handleNextSectionChange(e.target.value)}
        className="w-full px-1.5 py-0.5 border rounded"
      >
        <option value="">Select a section...</option>
        {sections.map((section) => (
          <option key={section.sectionId} value={section.sectionId}>
            {section.sectionId}
          </option>
        ))}
      </select>
    </div>
  )
}
