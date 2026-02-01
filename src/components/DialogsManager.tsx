'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Dialog = {
  id: string
  projectId: number
  name: string
  description?: string | null
}

type Props = {
  projectId: number
  initialDialogs: Dialog[]
}

export default function DialogsManager({ projectId, initialDialogs }: Props) {
  const router = useRouter()
  const [dialogs, setDialogs] = useState<Dialog[]>(initialDialogs)
  const [creating, setCreating] = useState(false)
  const [newDialogId, setNewDialogId] = useState('')
  const [newDialogName, setNewDialogName] = useState('')
  const [newDialogDesc, setNewDialogDesc] = useState('')
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!newDialogId.trim() || !newDialogName.trim()) {
      setError('Dialog ID and name are required')
      return
    }

    const res = await fetch('/api/dialogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newDialogId.trim(),
        projectId,
        name: newDialogName.trim(),
        description: newDialogDesc.trim() || null,
      }),
    })

    if (res.ok) {
      const dialog = await res.json()
      setDialogs([...dialogs, dialog])
      setNewDialogId('')
      setNewDialogName('')
      setNewDialogDesc('')
      setCreating(false)
      setError('')
    } else {
      const err = await res.json()
      setError(err.error || 'Failed to create dialog')
    }
  }

  const handleDelete = async (dialogId: string) => {
    if (!confirm(`Delete dialog "${dialogId}"? This will also delete its translation group.`)) {
      return
    }

    const res = await fetch(`/api/dialogs/${dialogId}`, { method: 'DELETE' })
    if (res.ok) {
      setDialogs(dialogs.filter((d) => d.id !== dialogId))
      router.refresh()
    }
  }

  const handleExportDialog = (dialogId: string) => {
    window.location.href = `/api/dialogs/${dialogId}/export`
  }

  const handleExportAll = () => {
    window.location.href = `/api/projects/${projectId}/dialogs/export`
  }

  return (
    <section className="bg-white p-6 rounded shadow mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Dialogs</h2>
        <div className="flex gap-2">
          {dialogs.length > 0 && (
            <button
              onClick={handleExportAll}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export All Dialogs (ZIP)
            </button>
          )}
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              + Add Dialog
            </button>
          )}
        </div>
      </div>

      {creating && (
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Dialog ID (unique) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newDialogId}
              onChange={(e) => setNewDialogId(e.target.value)}
              placeholder="e.g. dialog1"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newDialogName}
              onChange={(e) => setNewDialogName(e.target.value)}
              placeholder="Dialog name"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={newDialogDesc}
              onChange={(e) => setNewDialogDesc(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-2 border rounded"
              rows={2}
            />
          </div>

          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create
            </button>
            <button
              onClick={() => {
                setCreating(false)
                setNewDialogId('')
                setNewDialogName('')
                setNewDialogDesc('')
                setError('')
              }}
              className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {dialogs.length === 0 && !creating && (
        <p className="text-gray-500">No dialogs yet. Add one to get started.</p>
      )}

      {dialogs.length > 0 && (
        <ul className="space-y-2">
          {[...dialogs].sort((a, b) => a.name.localeCompare(b.name)).map((dialog) => (
            <li key={dialog.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{dialog.name}</span>
                  <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {dialog.id}
                  </span>
                </div>
                {dialog.description && <p className="text-sm text-gray-600 mt-1">{dialog.description}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/dialog/${dialog.id}`)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleExportDialog(dialog.id)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Export
                </button>
                <button
                  onClick={() => handleDelete(dialog.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
