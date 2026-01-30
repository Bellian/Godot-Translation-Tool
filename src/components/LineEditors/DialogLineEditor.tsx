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

type Props = {
  line: DialogLine
  editedLine: DialogLine
  entry: TranslationEntry | undefined
  projectLanguages: Language[]
  selectedLanguageId: number | null
  projectId: number
  dialogGroupId: number | undefined
  onChange: (line: DialogLine) => void
  onCreateEntry: () => void
  onRefresh: () => void
}

export default function DialogLineEditor({
  line,
  editedLine,
  entry,
  projectLanguages,
  selectedLanguageId,
  projectId,
  dialogGroupId,
  onChange,
  onCreateEntry,
  onRefresh,
}: Props) {
  // Get the translation for the selected language
  const selectedTranslation = entry?.translations.find(
    (t) => t.languageId === selectedLanguageId
  )
  
  const [localText, setLocalText] = useState(selectedTranslation?.text || '')
  const textTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update local text when the entry changes (e.g., after refresh or language change)
  useEffect(() => {
    setLocalText(selectedTranslation?.text || '')
  }, [selectedTranslation])

  const handleTextChange = (newText: string) => {
    setLocalText(newText)
    
    // Clear existing timeout
    if (textTimeoutRef.current) {
      clearTimeout(textTimeoutRef.current)
    }

    // Set new timeout for debounced save
    textTimeoutRef.current = setTimeout(async () => {
      if (!selectedLanguageId || !dialogGroupId) return

      // If no entry exists, create one with a UUID key
      if (!entry) {
        const uuid = crypto.randomUUID()
        
        // Create the entry
        const entryRes = await fetch(`/api/projects/${projectId}/groups/${dialogGroupId}/entries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: uuid, comment: 'Dialog line' }),
        })

        if (entryRes.ok) {
          const newEntry = await entryRes.json()
          
          // Create the initial translation
          if (newText.trim()) {
            await fetch(`/api/projects/${projectId}/groups/${dialogGroupId}/entries/${newEntry.id}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ languageId: selectedLanguageId, text: newText }),
            })
          }

          // Update the line to reference this entry
          onChange({ ...editedLine, textKey: uuid })
          // Only refresh when creating new entry to get the entry data
          onRefresh()
        }
      } else {
        // Entry exists, update the translation
        await fetch(`/api/projects/${projectId}/groups/${dialogGroupId}/entries/${entry.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ languageId: selectedLanguageId, text: newText }),
        })
        // Don't refresh on every translation update to avoid constant reloads
      }
    }, 800) // 800ms debounce
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (textTimeoutRef.current) {
        clearTimeout(textTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="grid grid-cols-[200px_1fr] gap-2">
      <div>
        <label className="block text-xs font-medium mb-0.5">Speaker</label>
        <input
          type="text"
          value={editedLine.speaker || ''}
          onChange={(e) => onChange({ ...editedLine, speaker: e.target.value })}
          className="w-full px-1.5 py-0.5 border rounded"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-0.5">
          Dialog Text {selectedLanguageId && (
            <span className="text-xs text-gray-500">
              ({projectLanguages.find(l => l.id === selectedLanguageId)?.name})
            </span>
          )}
        </label>
        <textarea
          value={localText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Enter dialog text..."
          className="w-full px-1.5 py-0.5 border rounded min-h-[40px]"
        />
      </div>
    </div>
  )
}
