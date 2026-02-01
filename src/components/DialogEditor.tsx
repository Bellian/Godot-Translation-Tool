'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LineEditor from './LineEditor'
import DialogVisualization from './DialogVisualization'

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

export type DialogSection = {
  id: number
  sectionId: string
  order: number
  lines: DialogLine[]
}

type Dialog = {
  id: string
  name: string
  projectId: number
  startSection?: string | null
  sections: DialogSection[]
}

type Props = {
  dialog: Dialog
  dialogGroup: TranslationGroup | null
  speakersGroup: TranslationGroup | null
  projectName: string
  projectLanguages: Language[]
  allDialogSections: string[]
}

export default function DialogEditor({ dialog, dialogGroup, speakersGroup, projectName, projectLanguages, allDialogSections }: Props) {
  const router = useRouter()
  const [sections, setSections] = useState<DialogSection[]>(dialog.sections)
  const [startSection, setStartSection] = useState(dialog.startSection || '')
  const [dialogName, setDialogName] = useState(dialog.name)
  const [dialogId, setDialogId] = useState(dialog.id)
  const [expandedSection, setExpandedSection] = useState<number | null>(null)
  const [draggedLine, setDraggedLine] = useState<{ sectionId: number; lineId: number } | null>(null)

  // Default language for viewing translations
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null)

  // Sync local sections state with dialog prop changes (from router.refresh())
  useEffect(() => {
    setSections(dialog.sections)
    setStartSection(dialog.startSection || '')
    setDialogName(dialog.name)
    setDialogId(dialog.id)
  }, [dialog])

  // Load saved language preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('defaultDialogLanguage')
    if (saved) {
      const langId = parseInt(saved, 10)
      if (projectLanguages.some((l) => l.id === langId)) {
        setSelectedLanguageId(langId)
      } else if (projectLanguages.length > 0) {
        setSelectedLanguageId(projectLanguages[0].id)
      }
    } else if (projectLanguages.length > 0) {
      setSelectedLanguageId(projectLanguages[0].id)
    }
  }, [projectLanguages])

  // Save language preference to localStorage
  const handleLanguageChange = (langId: number) => {
    setSelectedLanguageId(langId)
    localStorage.setItem('defaultDialogLanguage', langId.toString())
  }

  // Section management
  const [creatingSection, setCreatingSection] = useState(false)
  const [newSectionId, setNewSectionId] = useState('')

  const handleUpdateDialog = async () => {
    if (!dialogName.trim()) {
      alert('Dialog name cannot be empty')
      return
    }

    if (!dialogId.trim()) {
      alert('Dialog ID cannot be empty')
      return
    }

    const res = await fetch(`/api/dialogs/${dialog.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: dialogName.trim(),
        id: dialogId.trim(),
        startSection: startSection || null
      }),
    })

    if (res.ok) {
      alert('Dialog updated successfully')
      // If the ID changed, redirect to the new URL
      if (dialogId !== dialog.id) {
        router.push(`/dialog/${dialogId}`)
      } else {
        router.refresh()
      }
    } else {
      const error = await res.json()
      alert(`Error: ${error.error || 'Failed to update dialog'}`)
    }
  }

  const handleUpdateStartSection = async () => {
    const res = await fetch(`/api/dialogs/${dialog.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startSection: startSection || null }),
    })

    if (res.ok) {
      alert('Start section updated')
      router.refresh()
    }
  }

  const handleCreateSection = async () => {
    if (!newSectionId.trim()) return

    const res = await fetch(`/api/dialogs/${dialog.id}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectionId: newSectionId.trim(),
        order: sections.length,
      }),
    })

    if (res.ok) {
      const section = await res.json()
      setSections([...sections, { ...section, lines: [] }])
      setNewSectionId('')
      setCreatingSection(false)
      router.refresh()
    }
  }

  const handleDeleteSection = async (sectionDbId: number) => {
    if (!confirm('Delete this section and all its lines?')) return

    const res = await fetch(`/api/dialogs/${dialog.id}/sections/${sectionDbId}`, { method: 'DELETE' })
    if (res.ok) {
      setSections(sections.filter((s) => s.id !== sectionDbId))
      router.refresh()
    }
  }

  const handleAddLine = async (sectionDbId: number, type: string) => {
    const section = sections.find((s) => s.id === sectionDbId)
    if (!section) return

    const res = await fetch(`/api/dialogs/${dialog.id}/sections/${sectionDbId}/lines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        order: section.lines.length,
      }),
    })

    if (res.ok) {
      const newLine = await res.json()
      setSections(sections.map((s) =>
        s.id === sectionDbId
          ? { ...s, lines: [...s.lines, newLine] }
          : s
      ))
      router.refresh()
    }
  }

  const handleDeleteLine = async (sectionDbId: number, lineId: number) => {
    if (!confirm('Delete this line?')) return

    const res = await fetch(`/api/dialogs/${dialog.id}/sections/${sectionDbId}/lines/${lineId}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      setSections(sections.map((s) =>
        s.id === sectionDbId
          ? { ...s, lines: s.lines.filter((l) => l.id !== lineId) }
          : s
      ))
      router.refresh()
    }
  }

  const handleExport = async () => {
    window.location.href = `/api/dialogs/${dialog.id}/export`
  }

  const handleCopyToClipboard = async () => {
    try {
      const res = await fetch(`/api/dialogs/${dialog.id}/export`)
      if (res.ok) {
        const jsonData = await res.text()
        await navigator.clipboard.writeText(jsonData)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleDragStart = (sectionId: number, lineId: number) => {
    setDraggedLine({ sectionId, lineId })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetSectionId: number, targetLineId: number) => {
    if (!draggedLine || (draggedLine.sectionId === targetSectionId && draggedLine.lineId === targetLineId)) {
      setDraggedLine(null)
      return
    }

    const sourceSection = sections.find(s => s.id === draggedLine.sectionId)
    const targetSection = sections.find(s => s.id === targetSectionId)

    if (!sourceSection || !targetSection) {
      setDraggedLine(null)
      return
    }

    const sourceLine = sourceSection.lines.find(l => l.id === draggedLine.lineId)
    if (!sourceLine) {
      setDraggedLine(null)
      return
    }

    // If moving within the same section
    if (draggedLine.sectionId === targetSectionId) {
      const newLines = [...sourceSection.lines]
      const sourceIndex = newLines.findIndex(l => l.id === draggedLine.lineId)
      const targetIndex = newLines.findIndex(l => l.id === targetLineId)

      newLines.splice(sourceIndex, 1)
      newLines.splice(targetIndex, 0, sourceLine)

      // Update orders
      const updatedLines = newLines.map((line, index) => ({ ...line, order: index }))

      setSections(sections.map(s =>
        s.id === targetSectionId ? { ...s, lines: updatedLines } : s
      ))

      // Save to backend
      await fetch(`/api/dialogs/${dialog.id}/sections/${targetSectionId}/lines/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineIds: updatedLines.map(l => l.id) }),
      })
    }

    setDraggedLine(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Start Section Config */}
      <section className="bg-white p-4 rounded shadow">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Dialog Settings</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCopyToClipboard}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Copy JSON
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export Dialog JSON
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-2">
          <div>
            <label className="block text-sm font-medium mb-1">Dialog Name</label>
            <input
              type="text"
              value={dialogName}
              onChange={(e) => setDialogName(e.target.value)}
              className="w-full px-3 py-1.5 border rounded text-sm"
              placeholder="Enter dialog name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dialog ID</label>
            <input
              type="text"
              value={dialogId}
              onChange={(e) => setDialogId(e.target.value)}
              className="w-full px-3 py-1.5 border rounded text-sm"
              placeholder="Enter dialog ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Default Display Language</label>
            <select
              value={selectedLanguageId || ''}
              onChange={(e) => handleLanguageChange(parseInt(e.target.value, 10))}
              className="w-full px-3 py-1.5 border rounded text-sm"
            >
              {projectLanguages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name} ({lang.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Start Section</label>
            <select
              value={startSection}
              onChange={(e) => setStartSection(e.target.value)}
              className="w-full px-3 py-1.5 border rounded text-sm"
            >
              <option value="">-- Select a section --</option>
              {sections.map((section) => (
                <option key={section.id} value={section.sectionId}>
                  {section.sectionId}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleUpdateDialog}
          className="w-full px-4 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
        >
          Save Dialog Settings
        </button>
      </section>

      {/* Sections */}
      <section className="bg-white p-6 rounded shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sections</h2>
          {!creatingSection && (
            <button
              onClick={() => setCreatingSection(true)}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              + Add Section
            </button>
          )}
        </div>

        {creatingSection && (
          <div className="mb-4 p-4 border rounded bg-gray-50">
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Section ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newSectionId}
                onChange={(e) => setNewSectionId(e.target.value)}
                placeholder="e.g. entry, prologue, ending"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateSection}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setCreatingSection(false)
                  setNewSectionId('')
                }}
                className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {sections.length === 0 && <p className="text-gray-500">No sections yet.</p>}

        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.id} className="">
              <div className="flex items-center justify-between p-3 bg-gray-50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                    className="text-lg font-mono"
                  >
                    {expandedSection === section.id ? '▼' : '▶'}
                  </button>
                  <span className="font-medium font-mono">{section.sectionId}</span>
                  <span className="text-sm text-gray-500">({section.lines.length} lines)</span>
                </div>
                <button
                  onClick={() => handleDeleteSection(section.id)}
                  className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>

              {expandedSection === section.id && (
                <div className="p-3 space-y-2">
                  {/* Lines */}
                  {section.lines.length === 0 && (
                    <p className="text-gray-400 text-sm mb-3">No lines. Add one below.</p>
                  )}

                  {section.lines.map((line) => (
                    <div
                      key={line.id}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(section.id, line.id)}
                      className="flex gap-2"
                    >
                      <div
                        draggable
                        onDragStart={() => handleDragStart(section.id, line.id)}
                        className="flex items-center cursor-move hover:bg-gray-200 px-1 rounded"
                        title="Drag to reorder"
                      >
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 8h16M4 16h16"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <LineEditor
                          line={line}
                          sectionDbId={section.id}
                          dialogId={dialog.id}
                          projectId={dialog.projectId}
                          dialogGroup={dialogGroup}
                          speakersGroup={speakersGroup}
                          projectName={projectName}
                          projectLanguages={projectLanguages}
                          selectedLanguageId={selectedLanguageId}
                          sections={sections}
                          allDialogSections={allDialogSections}
                          onDelete={() => handleDeleteLine(section.id, line.id)}
                          onRefresh={() => router.refresh()}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Add Line Buttons */}
                  <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t">
                    <button
                      onClick={() => handleAddLine(section.id, 'dialog')}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      + Dialog
                    </button>
                    <button
                      onClick={() => handleAddLine(section.id, 'options')}
                      className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                      + Options
                    </button>
                    <button
                      onClick={() => handleAddLine(section.id, 'event')}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      + Event
                    </button>
                    <button
                      onClick={() => handleAddLine(section.id, 'showBackground')}
                      className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      + Background
                    </button>
                    <button
                      onClick={() => handleAddLine(section.id, 'switch')}
                      className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                    >
                      + Switch
                    </button>
                    <button
                      onClick={() => handleAddLine(section.id, 'nextSection')}
                      className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      + Next Section
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Dialog Visualization */}
      <DialogVisualization sections={sections} startSection={startSection} />
    </div>
  )
}
