"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
    projectId: number
    initialName: string
    initialDescription?: string | null
    // do not accept callbacks from server components (will cause runtime error)
}
export default function ProjectEditor({ projectId, initialName, initialDescription }: Props) {
    const [name, setName] = useState(initialName)
    const [description, setDescription] = useState(initialDescription ?? '')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const changed = name.trim() !== initialName || description !== (initialDescription ?? '')

    async function save(e?: React.FormEvent) {
        e?.preventDefault()
        setError(null)
        if (!name.trim()) {
            setError('Name is required')
            return
        }
        setSaving(true)
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body?.error || 'Failed to save')
            }
            // const data = await res.json()
            setSaving(false)
            // refresh server data so the page notices changes
            router.refresh()
        } catch (err: unknown) {
            setSaving(false)
            const message = err instanceof Error ? err.message : String(err)
            setError(message || 'Save failed')
        }
    }

    return (
        <form onSubmit={save} className="mb-4 bg-white p-4 rounded shadow">
            <div className="mb-2">
                <label className="text-sm font-medium">Title</label>
                <input
                    className="mt-1 w-full border rounded px-2 py-1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="mb-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                    className="mt-1 w-full border rounded px-2 py-1"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

            <div className="flex items-center gap-2">
                <button
                    type="submit"
                    disabled={!changed || saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60"
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setName(initialName)
                        setDescription(initialDescription ?? '')
                        setError(null)
                    }}
                    className="px-3 py-2 border rounded"
                    disabled={saving}
                >
                    Reset
                </button>
            </div>
        </form>
    )
}
