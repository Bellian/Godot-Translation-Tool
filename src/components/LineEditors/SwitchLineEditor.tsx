'use client'

import { possibleConditions } from '@/app/data/dataSelects'

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

type SwitchData = {
  condition: {
    type: string
    value: string
  }
  nextSection: string
}

type Props = {
  editedLine: DialogLine
  sections: Section[]
  allDialogSections: string[]
  onChange: (line: DialogLine) => void
}

export default function SwitchLineEditor({
  editedLine,
  sections,
  allDialogSections,
  onChange,
}: Props) {
  // Parse the data field which contains the switch info
  let switchData: SwitchData = {
    condition: { type: '', value: '' },
    nextSection: ''
  }

  try {
    const parsed = JSON.parse(editedLine.data || '{}')
    switchData = {
      condition: parsed.condition || { type: '', value: '' },
      nextSection: parsed.nextSection || ''
    }
  } catch {
    // Invalid JSON, keep defaults
  }

  const updateSwitch = (updates: Partial<SwitchData>) => {
    const newData = JSON.stringify({ ...switchData, ...updates })
    onChange({ ...editedLine, data: newData })
  }

  const updateCondition = (field: 'type' | 'value', value: string) => {
    const newCondition = { ...switchData.condition, [field]: value }
    if (field === 'type') {
      // Clear value when type changes
      newCondition.value = ''
    }
    updateSwitch({ condition: newCondition })
  }

  let conditionOptions = switchData.condition.type
    ? possibleConditions[switchData.condition.type as keyof typeof possibleConditions]
    : null
  // Use allDialogSections for didDialog condition
  if (switchData.condition.type === 'didDialog') {
    conditionOptions = allDialogSections
  }
  return (
    <div className="space-y-2">
      <div className="border rounded p-2 bg-gray-50">
        <div className="text-xs font-medium mb-1 text-gray-700">Condition</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium mb-0.5">Type</label>
            <select
              value={switchData.condition.type}
              onChange={(e) => updateCondition('type', e.target.value)}
              className="w-full px-1.5 py-0.5 border rounded text-sm"
            >
              <option value="">Select type...</option>
              {Object.keys(possibleConditions).map((condType) => (
                <option key={condType} value={condType}>
                  {condType}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-0.5">Value</label>
            {conditionOptions ? (
              <select
                value={switchData.condition.value}
                onChange={(e) => updateCondition('value', e.target.value)}
                className="w-full px-1.5 py-0.5 border rounded text-sm"
              >
                <option value="">Select value...</option>
                {conditionOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={switchData.condition.value}
                onChange={(e) => updateCondition('value', e.target.value)}
                placeholder="e.g., dialog1.prologue"
                className="w-full px-1.5 py-0.5 border rounded text-sm"
              />
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-0.5">Next Section (if condition is true)</label>
        <select
          value={switchData.nextSection}
          onChange={(e) => updateSwitch({ nextSection: e.target.value })}
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
    </div>
  )
}
