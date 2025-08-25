"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProjectForm() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function submit(e: React.FormEvent) {
        e.preventDefault()
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
                const data = await res.json()
                setError(data?.error || 'Failed to create')
            } else {
                setName('')
                setDescription('')
                // refresh server components / page data
                try { router.refresh() } catch { /* noop */ }
            }
        } catch {
            setError('Network error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={submit} className="mb-6 bg-white p-4 rounded shadow">
            <h3 className="text-lg font-medium mb-2">Add new project</h3>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                    <label className="block text-sm text-gray-700">Name</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 w-full border rounded px-2 py-1"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-700">Description</label>
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-1 w-full border rounded px-2 py-1"
                    />
                </div>
            </div>

            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}

            <div className="mt-3">
                <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60"
                    disabled={loading}
                >
                    {loading ? 'Creating...' : 'Create project'}
                </button>
            </div>
        </form>
    )
}
