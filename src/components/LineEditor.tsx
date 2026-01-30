'use client'

import { useState, useEffect, useRef } from 'react'
import DialogLineEditor from './LineEditors/DialogLineEditor'
import BackgroundLineEditor from './LineEditors/BackgroundLineEditor'
import EventLineEditor from './LineEditors/EventLineEditor'
import DataLineEditor from './LineEditors/DataLineEditor'
import OptionsLineEditor from './LineEditors/OptionsLineEditor'
import NextSectionLineEditor from './LineEditors/NextSectionLineEditor'
import SwitchLineEditor from './LineEditors/SwitchLineEditor'
import { DialogSection } from './DialogEditor'

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

type TranslationGroup = {
  id: number
  name: string
  entries: TranslationEntry[]
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
  sectionDbId: number
  dialogId: string
  projectId: number
  dialogGroup: TranslationGroup | null
  projectLanguages: Language[]
  selectedLanguageId: number | null
  sections: DialogSection[]
  onDelete: () => void
  onCreateEntry: () => void
  onRefresh: () => void
}

export default function LineEditor({
  line,
  sectionDbId,
  dialogId,
  projectId,
  dialogGroup,
  projectLanguages,
  selectedLanguageId,
  sections,
  onDelete,
  onCreateEntry,
  onRefresh,
}: Props) {
  const [editedLine, setEditedLine] = useState(line)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousSpeakerRef = useRef<string | null | undefined>(line.speaker)

  // Update editedLine when line prop changes from external refresh
  useEffect(() => {
    setEditedLine(line)
    previousSpeakerRef.current = line.speaker
  }, [line])

  // Auto-save for dialog lines when speaker changes
  useEffect(() => {
    // Only save if speaker actually changed from what we last saved
    if (line.type === 'dialog' && 
        editedLine.speaker !== previousSpeakerRef.current) {
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        await fetch(`/api/dialogs/${dialogId}/sections/${sectionDbId}/lines/${line.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ speaker: editedLine.speaker }),
        })
        previousSpeakerRef.current = editedLine.speaker
        // Don't call onRefresh to avoid infinite loop
      }, 800)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [editedLine.speaker, line.type, line.id, dialogId, sectionDbId])

  // Auto-save for dialog lines when textKey changes (set by translation creation)
  useEffect(() => {
    if (line.type === 'dialog' && editedLine.textKey !== line.textKey && editedLine.textKey) {
      const saveTextKey = async () => {
        await fetch(`/api/dialogs/${dialogId}/sections/${sectionDbId}/lines/${line.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ textKey: editedLine.textKey }),
        })
        // Don't call onRefresh here as it's already called in DialogLineEditor
      }
      saveTextKey()
    }
  }, [editedLine.textKey, line.type, line.textKey, line.id, dialogId, sectionDbId])

  // Auto-save for all other line types when their specific fields change
  useEffect(() => {
    if (line.type === 'showBackground' && editedLine.background !== line.background) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        await fetch(`/api/dialogs/${dialogId}/sections/${sectionDbId}/lines/${line.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ background: editedLine.background }),
        })
      }, 800)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [editedLine.background, line.type, line.background, line.id, dialogId, sectionDbId])

  useEffect(() => {
    if (line.type === 'event' && 
        (editedLine.eventName !== line.eventName || editedLine.eventValue !== line.eventValue)) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        await fetch(`/api/dialogs/${dialogId}/sections/${sectionDbId}/lines/${line.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventName: editedLine.eventName, eventValue: editedLine.eventValue }),
        })
      }, 800)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [editedLine.eventName, editedLine.eventValue, line.type, line.eventName, line.eventValue, line.id, dialogId, sectionDbId])

  useEffect(() => {
    if ((line.type === 'switch' || line.type === 'nextSection' || line.type === 'options') && 
        editedLine.data !== line.data) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        await fetch(`/api/dialogs/${dialogId}/sections/${sectionDbId}/lines/${line.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: editedLine.data }),
        })
      }, 800)
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [editedLine.data, line.type, line.data, line.id, dialogId, sectionDbId])

  const entry = dialogGroup?.entries.find((e) => e.key === line.textKey)

  return (
    <div className="border rounded p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600 uppercase">{line.type}</span>
        <button
          onClick={onDelete}
          className="px-2 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600"
        >
          Delete
        </button>
      </div>

      <div className="text-sm space-y-1">
        {line.type === 'dialog' && (
          <DialogLineEditor
            line={line}
            editedLine={editedLine}
            entry={entry}
            projectLanguages={projectLanguages}
            selectedLanguageId={selectedLanguageId}
            projectId={projectId}
            dialogGroupId={dialogGroup?.id}
            onChange={setEditedLine}
            onCreateEntry={onCreateEntry}
            onRefresh={onRefresh}
          />
        )}
        {line.type === 'showBackground' && (
          <BackgroundLineEditor
            line={line}
            editedLine={editedLine}
            onChange={setEditedLine}
          />
        )}
        {line.type === 'event' && (
          <EventLineEditor
            line={line}
            editedLine={editedLine}
            onChange={setEditedLine}
          />
        )}
        {line.type === 'options' && (
          <OptionsLineEditor
            line={line}
            editedLine={editedLine}
            entries={dialogGroup?.entries || []}
            projectLanguages={projectLanguages}
            selectedLanguageId={selectedLanguageId}
            projectId={projectId}
            dialogGroupId={dialogGroup?.id}
            sections={sections.map(s => ({ id: s.sectionId }))}
            onChange={setEditedLine}
            onRefresh={onRefresh}
          />
        )}
        {line.type === 'nextSection' && (
          <NextSectionLineEditor
            line={line}
            editedLine={editedLine}
            sections={sections.map(s => ({ sectionId: s.sectionId }))}
            onChange={setEditedLine}
          />
        )}
        {line.type === 'switch' && (
          <SwitchLineEditor
            line={line}
            editedLine={editedLine}
            sections={sections.map(s => ({ sectionId: s.sectionId }))}
            onChange={setEditedLine}
          />
        )}
      </div>
    </div>
  )
}
