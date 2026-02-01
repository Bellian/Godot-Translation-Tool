'use client'

import { useState, useEffect, useRef } from 'react'
import { possibleConditions } from '@/app/data/dataSelects'

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
  dialogId: string
  sectionDbId: number
  dialogGroupId: number | undefined
  sections: { id: string }[]
  allDialogSections: string[]
  onChange: (line: DialogLine) => void
  onRefresh: () => void
}

export default function OptionsLineEditor({
  editedLine,
  entries,
  projectLanguages,
  selectedLanguageId,
  projectId,
  dialogId,
  sectionDbId,
  dialogGroupId,
  sections,
  allDialogSections,
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

  const addOption = async () => {
    if (!dialogGroupId) return

    // Create translation entry first
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const key = `option_${timestamp}_${randomSuffix}`

    const entryRes = await fetch(`/api/projects/${projectId}/groups/${dialogGroupId}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, comment: 'Option text' }),
    })

    if (entryRes.ok) {
      const newEntry = await entryRes.json()

      // Create empty translations for all project languages
      await Promise.all(
        projectLanguages.map((lang) =>
          fetch(`/api/projects/${projectId}/groups/${dialogGroupId}/entries/${newEntry.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ languageId: lang.id, text: '' }),
          })
        )
      )

      // Add option with the translation key
      const newOptions = [...options, { text: key, nextSection: sections[0]?.id || '' }]
      const newData = JSON.stringify({ options: newOptions })

      // Save to backend first
      await fetch(`/api/dialogs/${dialogId}/sections/${sectionDbId}/lines/${editedLine.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: newData }),
      })

      // Then update local state and refresh
      updateOptions(newOptions)
      onRefresh()
    }
  }

  const removeOption = async (index: number) => {
    const option = options[index]

    // Delete the translation entry if it exists
    if (option.text && dialogGroupId) {
      const entry = entries.find((e) => e.key === option.text)
      if (entry) {
        await fetch(`/api/projects/${projectId}/groups/${dialogGroupId}/entries`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entryId: entry.id }),
        })
      }
    }

    const newOptions = options.filter((_, i) => i !== index)
    const newData = JSON.stringify({ options: newOptions })

    // Save to backend first
    await fetch(`/api/dialogs/${dialogId}/sections/${sectionDbId}/lines/${editedLine.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: newData }),
    })

    // Then update local state and refresh
    updateOptions(newOptions)
    onRefresh()
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
          allDialogSections={allDialogSections}
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
  allDialogSections: string[]
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
  allDialogSections,
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
      if (!selectedLanguageId || !dialogGroupId || !entry) return

      // Update the translation for the selected language
      await fetch(`/api/projects/${projectId}/groups/${dialogGroupId}/entries/${entry.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languageId: selectedLanguageId, text: newText }),
      })
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

          {option.condition && (() => {
            let conditionOptions = option.condition.type
              ? possibleConditions[option.condition.type as keyof typeof possibleConditions]
              : null

            // Use allDialogSections for didDialog condition
            if (option.condition.type === 'didDialog') {
              conditionOptions = allDialogSections
            }

            return (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5">Type</label>
                  <select
                    value={option.condition.type}
                    onChange={(e) => onUpdateCondition('type', e.target.value)}
                    className="w-full px-1.5 py-0.5 border rounded"
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
                      value={option.condition.value}
                      onChange={(e) => onUpdateCondition('value', e.target.value)}
                      className="w-full px-1.5 py-0.5 border rounded"
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
                      value={option.condition.value}
                      onChange={(e) => onUpdateCondition('value', e.target.value)}
                      placeholder="e.g., dialog1.prologue"
                      className="w-full px-1.5 py-0.5 border rounded"
                    />
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
