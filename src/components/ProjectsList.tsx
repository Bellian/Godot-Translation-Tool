"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Project = {
    id: number
    name: string
    description?: string | null
    projectLanguages?: { language: { code: string } }[]
    groups?: unknown[]
}

type Props = { projects: Project[] }

export default function ProjectsList({ projects }: Props) {
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<Project | null>(null)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [deletingProject, setDeletingProject] = useState<Project | null>(null)
    const [deletingLoading, setDeletingLoading] = useState(false)
    const [deletingError, setDeletingError] = useState<string | null>(null)
    const router = useRouter()

    function openCreate() {
        setEditing(null)
        setName('')
        setDescription('')
        setError(null)
        setOpen(true)
    }

    function openEdit(p: Project) {
        setEditing(p)
        setName(p.name)
        setDescription(p.description ?? '')
        setError(null)
        setOpen(true)
    }

    async function submit(e?: React.FormEvent) {
        e?.preventDefault()
        setError(null)
        if (!name.trim()) return setError('Name is required')
        setLoading(true)
        try {
            if (editing) {
                const res = await fetch(`/api/projects/${editing.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
                })
                if (!res.ok) throw new Error('Failed to update')
            } else {
                const res = await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
                })
                if (!res.ok) throw new Error('Failed to create')
            }
            setLoading(false)
            setOpen(false)
            router.refresh()
        } catch (err) {
            setLoading(false)
            setError((err as Error).message || 'Save failed')
        }
    }

    return (
        <>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold mb-1 text-gray-900">Translation projects</h1>
                    <p className="text-gray-600">Overview of all translation projects in the database.</p>
                </div>
                <div>
                    <button onClick={openCreate} className="px-3 py-1 bg-indigo-600 text-white rounded">New project</button>
                </div>
            </div>

            <div className="space-y-4">
                {projects.length === 0 && (
                    <div className="p-4 bg-white rounded shadow">No projects found.</div>
                )}

                {projects.map((p) => (
                    <section key={p.id} className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-medium">
                                    <Link href={`project/${p.id}`} className="text-indigo-600 hover:underline">
                                        {p.name}
                                    </Link>
                                </h2>
                                {p.description && <p className="text-gray-600 mt-1">{p.description}</p>}

                                <div className="mt-3 text-sm text-gray-700">
                                    <strong>Languages:</strong>{' '}
                                    {p.projectLanguages && p.projectLanguages.length > 0 ? (
                                        p.projectLanguages.map((pl) => pl.language.code).join(', ')
                                    ) : (
                                        <span className="text-gray-400">None</span>
                                    )}
                                </div>

                                <div className="mt-2 text-sm text-gray-700">
                                    <strong>Groups:</strong> {p.groups?.length ?? 0}
                                </div>
                            </div>

                            <div className="text-right text-sm text-gray-500 flex flex-col items-end">
                                <div>Project ID</div>
                                <div className="font-mono text-xs mt-1">{p.id}</div>
                                <div className="mt-3 flex gap-2">
                                    <button onClick={() => openEdit(p)} className="px-2 py-1 border rounded text-sm cursor-pointer">Edit</button>
                                    <button onClick={() => { setDeletingProject(p); setDeletingError(null) }} className="px-2 py-1 border rounded text-sm cursor-pointer text-red-600">Delete</button>
                                </div>
                            </div>
                        </div>
                    </section>
                ))}
            </div>

            {open && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40">
                    <form onSubmit={submit} className="bg-white p-4 rounded shadow w-full max-w-md">
                        <h4 className="text-lg font-medium mb-2">{editing ? 'Edit project' : 'Add project'}</h4>
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
                            <button type="submit" disabled={loading} className="px-3 py-1 bg-indigo-600 text-white rounded">{loading ? 'Saving...' : 'Save'}</button>
                        </div>
                    </form>
                </div>
            )}

            {deletingProject && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40">
                    <div className="bg-white p-4 rounded shadow w-full max-w-md">
                        <h4 className="text-lg font-medium mb-2">Delete project</h4>
                        <p className="mb-4 text-sm text-gray-700">Are you sure you want to delete the project <strong className="font-medium">{deletingProject.name}</strong>? This action cannot be undone.</p>
                        {deletingError && <div className="text-red-600 mb-2">{deletingError}</div>}
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setDeletingProject(null)} className="px-3 py-1 border rounded">Cancel</button>
                            <button
                                type="button"
                                disabled={deletingLoading}
                                onClick={async () => {
                                    setDeletingError(null)
                                    setDeletingLoading(true)
                                    try {
                                        const res = await fetch(`/api/projects/${deletingProject.id}`, { method: 'DELETE' })
                                        if (!res.ok) throw new Error('Failed to delete')
                                        setDeletingLoading(false)
                                        setDeletingProject(null)
                                        router.refresh()
                                    } catch (err) {
                                        setDeletingLoading(false)
                                        setDeletingError((err as Error).message || 'Delete failed')
                                    }
                                }}
                                className="px-3 py-1 bg-red-600 text-white rounded"
                            >
                                {deletingLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
