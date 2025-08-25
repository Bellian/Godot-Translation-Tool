"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProjectsManager() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function submit(e?: React.FormEvent) {
        e?.preventDefault()
        setError(null)
        if (!name.trim()) return setError('Name is required')
        setLoading(true)
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                setError(data?.error || 'Failed to create')
            } else {
                setName('')
                setDescription('')
                setOpen(false)
                router.refresh()
            }
        } catch {
            setError('Network error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-lg font-medium">Projects</h3>
                    <p className="text-sm text-gray-500">Create a new project</p>
                </div>
                <button onClick={() => setOpen(true)} className="px-3 py-1 bg-indigo-600 text-white rounded">New project</button>
            </div>

            {open && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40">
                    <form onSubmit={submit} className="bg-white p-4 rounded shadow w-full max-w-md">
                        <h4 className="text-lg font-medium mb-2">Add project</h4>
                        <div className="mb-2">
                            <label className="text-sm">Name</label>
                            <input className="mt-1 w-full border rounded px-2 py-1" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="mb-2">
                            <label className="text-sm">Description</label>
                            <input className="mt-1 w-full border rounded px-2 py-1" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        {error && <div className="text-red-600 mb-2">{error}</div>}
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setOpen(false)} className="px-3 py-1 border rounded">Cancel</button>
                            <button type="submit" disabled={loading} className="px-3 py-1 bg-indigo-600 text-white rounded">{loading ? 'Creating...' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
