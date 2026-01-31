'use client'

import { useState, useEffect, useRef } from 'react'

type Language = {
  id: number
  code: string
  name: string
}

type Translation = {
  id: number
  languageId: number
  text: string
}

type TranslationEntry = {
  id: number
  key: string
  comment?: string | null
  copied: boolean
  translations: Translation[]
}

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

type OptionData = {
  condition?: {
    type: string
    value: string
  }
  text: string
  nextSection: string
}

type Props = {
  editedLine: DialogLine
  entries: TranslationEntry[]
  projectLanguages: Language[]
  selectedLanguageId: number | null
  projectId: number
  dialogGroupId: number | undefined
  sections: { id: string }[]
  onChange: (line: DialogLine) => void
  onRefresh: () => void
}

export default function OptionsLineEditor({
  editedLine,
  entries,
  projectLanguages,
  selectedLanguageId,
  projectId,
  dialogGroupId,
  sections,
  onChange,
  onRefresh,
}: Props) {
  const parseOptions = (): OptionData[] => {
    try {
      const parsed = JSON.parse(editedLine.data || '{}')
      return parsed.options || []
    } catch {
      return []
    }
  }

  const [options, setOptions] = useState<OptionData[]>(parseOptions())

  useEffect(() => {
    setOptions(parseOptions())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedLine.data])

  const updateOptions = (newOptions: OptionData[]) => {
    setOptions(newOptions)
    const newData = JSON.stringify({ options: newOptions })
    onChange({ ...editedLine, data: newData })
  }

  const addOption = () => {
    updateOptions([...options, { text: '', nextSection: sections[0]?.id || '' }])
  }

  const removeOption = (index: number) => {
    updateOptions(options.filter((_, i) => i !== index))
  }

  const updateOption = (index: number, updates: Partial<OptionData>) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], ...updates }
    updateOptions(newOptions)
  }

  const updateCondition = (index: number, field: 'type' | 'value', value: string) => {
    const newOptions = [...options]
    if (!newOptions[index].condition) {
      newOptions[index].condition = { type: '', value: '' }
    }
    newOptions[index].condition![field] = value
    updateOptions(newOptions)
  }

  const removeCondition = (index: number) => {
    const newOptions = [...options]
    delete newOptions[index].condition
    updateOptions(newOptions)
  }

  const moveOptionUp = (index: number) => {
    if (index === 0) return
    const newOptions = [...options]
    ;[newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]]
    updateOptions(newOptions)
  }

  const moveOptionDown = (index: number) => {
    if (index === options.length - 1) return
    const newOptions = [...options]
    ;[newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]]
    updateOptions(newOptions)
  }

  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <OptionEditor
          key={index}
          option={option}
          entry={entries.find((e) => e.key === option.text)}
          projectLanguages={projectLanguages}
          selectedLanguageId={selectedLanguageId}
          projectId={projectId}
          dialogGroupId={dialogGroupId}
          sections={sections}
          onUpdate={(updates) => updateOption(index, updates)}
          onUpdateCondition={(field, value) => updateCondition(index, field, value)}
          onRemoveCondition={() => removeCondition(index)}
          onRemove={() => removeOption(index)}
          onMoveUp={() => moveOptionUp(index)}
          onMoveDown={() => moveOptionDown(index)}
          canMoveUp={index > 0}
          canMoveDown={index < options.length - 1}
          onRefresh={onRefresh}
        />
      ))}
      <button
        onClick={addOption}
        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
      >
        Add Option
      </button>
    </div>
  )
}

type OptionEditorProps = {
  option: OptionData
  entry: TranslationEntry | undefined
  projectLanguages: Language[]
  selectedLanguageId: number | null
  projectId: number
  dialogGroupId: number | undefined
  sections: { id: string }[]
  onUpdate: (updates: Partial<OptionData>) => void
  onUpdateCondition: (field: 'type' | 'value', value: string) => void
  onRemoveCondition: () => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  onRefresh: () => void
}

function OptionEditor({
  option,
  entry,
  projectLanguages,
  selectedLanguageId,
  projectId,
  dialogGroupId,
  sections,
  onUpdate,
  onUpdateCondition,
  onRemoveCondition,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onRefresh,
}: OptionEditorProps) {
  const selectedTranslation = entry?.translations.find(
    (t) => t.languageId === selectedLanguageId
  )
  
  const [localText, setLocalText] = useState(selectedTranslation?.text || '')
  const textTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setLocalText(selectedTranslation?.text || '')
  }, [selectedTranslation])

  const handleTextChange = (newText: string) => {
    setLocalText(newText)
    
    if (textTimeoutRef.current) {
      clearTimeout(textTimeoutRef.current)
    }

    textTimeoutRef.current = setTimeout(async () => {
      if (!selectedLanguageId || !dialogGroupId) return

      if (!entry) {
        const uuid = crypto.randomUUID()
        
        const entryRes = await fetch(`/api/projects/${projectId}/groups/${dialogGroupId}/entries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: uuid, comment: 'Option text' }),
        })

        if (entryRes.ok) {
          const newEntry = await entryRes.json()
          
          if (newText.trim()) {
            await fetch(`/api/projects/${projectId}/groups/${dialogGroupId}/entries/${newEntry.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ languageId: selectedLanguageId, text: newText }),
            })
          }

          onUpdate({ text: uuid })
          onRefresh()
        }
      } else {
        await fetch(`/api/projects/${projectId}/groups/${dialogGroupId}/entries/${entry.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ languageId: selectedLanguageId, text: newText }),
        })
      }
    }, 800)
  }

  useEffect(() => {
    return () => {
      if (textTimeoutRef.current) {
        clearTimeout(textTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="border rounded p-3 bg-gray-50">
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-1">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            title="Move down"
          >
            ↓
          </button>
        </div>
        <button
          onClick={onRemove}
          className="px-2 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600"
        >
          Remove
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium mb-0.5">
            Option Text {selectedLanguageId && (
              <span className="text-xs text-gray-500">
                ({projectLanguages.find(l => l.id === selectedLanguageId)?.name})
              </span>
            )}
          </label>
          <textarea
            value={localText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Enter option text..."
            className="w-full px-1.5 py-0.5 border rounded min-h-[40px]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-0.5">Next Section</label>
          <select
            value={option.nextSection}
            onChange={(e) => onUpdate({ nextSection: e.target.value })}
            className="w-full px-1.5 py-0.5 border rounded"
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.id}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t pt-2">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-medium">Condition (Optional)</label>
            {option.condition ? (
              <button
                onClick={onRemoveCondition}
                className="px-2 py-0.5 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Remove Condition
              </button>
            ) : (
              <button
                onClick={() => onUpdateCondition('type', '')}
                className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Condition
              </button>
            )}
          </div>

          {option.condition && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-0.5">Type</label>
                <input
                  type="text"
                  value={option.condition.type}
                  onChange={(e) => onUpdateCondition('type', e.target.value)}
                  placeholder="e.g., hasEmotion"
                  className="w-full px-1.5 py-0.5 border rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-0.5">Value</label>
                <input
                  type="text"
                  value={option.condition.value}
                  onChange={(e) => onUpdateCondition('value', e.target.value)}
                  placeholder="e.g., happy"
                  className="w-full px-1.5 py-0.5 border rounded"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
