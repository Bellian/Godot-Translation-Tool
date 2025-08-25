"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons'

type Group = { id: number; name: string; description?: string | null; entriesCount?: number; hasUntranslated?: boolean }

type Props = { projectId: number; initialGroups: Group[] }

export default function GroupsManager({ projectId, initialGroups }: Props) {
    const [groups, setGroups] = useState<Group[]>(initialGroups)
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<Group | null>(null)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const router = useRouter()

    useEffect(() => setGroups(initialGroups), [initialGroups])

    function openForCreate() {
        setEditing(null)
        setName('')
        setDescription('')
        setError(null)
        setOpen(true)
    }

    function openForEdit(g: Group) {
        setEditing(g)
        setName(g.name)
        setDescription(g.description ?? '')
        setError(null)
        setOpen(true)
    }

    async function save(e?: React.FormEvent) {
        e?.preventDefault()
        setError(null)
        if (!name.trim()) return setError('Name is required')
        setSaving(true)
        try {
            if (editing) {
                // update
                const res = await fetch(`/api/projects/${projectId}/groups/${editing.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
                })
                if (!res.ok) throw new Error('Failed to update')
            } else {
                // create
                const res = await fetch(`/api/projects/${projectId}/groups`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
                })
                if (!res.ok) throw new Error('Failed to create')
            }

            setSaving(false)
            setOpen(false)
            router.refresh()
        } catch (err) {
            setSaving(false)
            setError((err as Error).message || 'Save failed')
        }
    }

    async function remove(groupId: number) {
        if (!confirm('Remove this group?')) return
        await fetch(`/api/projects/${projectId}/groups`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId }),
        })
        router.refresh()
    }

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Groups</h3>
                <button onClick={openForCreate} className="px-3 py-1 bg-indigo-600 text-white rounded">Add group</button>
            </div>

            <div className="space-y-2">
                {groups.length === 0 && <div className="text-gray-500">No groups</div>}
                {groups.map((g) => (
                    <div
                        key={g.id}
                        className={
                            "p-3 rounded shadow-sm flex justify-between items-start " +
                            (g.hasUntranslated ? 'bg-yellow-50 border border-yellow-300' : 'bg-white')
                        }
                    >
                        <div>
                            <div className="font-medium">
                                <Link href={`/group/${g.id}`} className="text-indigo-600 hover:underline">{g.name}</Link>
                            </div>
                            {g.description && <div className="text-sm text-gray-600">{g.description}</div>}
                            {g.hasUntranslated && <div className="text-sm text-yellow-700 mt-1">Some entries missing translations</div>}
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="text-sm text-gray-500">Entries: {g.entriesCount ?? 0}</div>
                            {g.hasUntranslated && <div className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">Untranslated</div>}
                            <button
                                onClick={() => openForEdit(g)}
                                className="text-sm text-indigo-600 cursor-pointer"
                                aria-label={`Edit ${g.name}`}
                                title="Edit"
                            >
                                <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => remove(g.id)}
                                className="text-sm text-red-600 cursor-pointer"
                                aria-label={`Remove ${g.name}`}
                                title="Remove"
                            >
                                <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {open && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40">
                    <form onSubmit={save} className="bg-white p-4 rounded shadow w-full max-w-md">
                        <h4 className="text-lg font-medium mb-2">{editing ? 'Edit group' : 'Add group'}</h4>
                        <div className="mb-2">
                            <label className="text-sm font-medium">Name</label>
                            <input className="mt-1 w-full border rounded px-2 py-1" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="mb-2">
                            <label className="text-sm font-medium">Description</label>
                            <textarea className="mt-1 w-full border rounded px-2 py-1" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setOpen(false)} className="px-3 py-1 border rounded">Cancel</button>
                            <button type="submit" disabled={saving} className="px-3 py-1 bg-indigo-600 text-white rounded">{saving ? 'Saving...' : 'Save'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
