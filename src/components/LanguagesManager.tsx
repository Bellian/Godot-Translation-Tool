"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons'

type Language = { id: number; code: string; name: string }

type Props = {
    projectId: number
    initialLanguages: Language[]
}

export default function LanguagesManager({ projectId, initialLanguages }: Props) {
    const [languages, setLanguages] = useState<Language[]>(initialLanguages)
    const [allLanguages, setAllLanguages] = useState<Language[]>([])
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<Language | null>(null)
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        // fetch all existing languages for quick attach
        fetch('/api/languages')
            .then((r) => r.json())
            .then((data) => setAllLanguages(data || []))
            .catch(() => setAllLanguages([]))
    }, [])

    // keep local state in sync when server re-renders the page and passes new props
    useEffect(() => {
        setLanguages(initialLanguages)
    }, [initialLanguages])

    function openForCreate() {
        setEditing(null)
        setCode('')
        setName('')
        setError(null)
        setOpen(true)
    }

    function openForEdit(l: Language) {
        setEditing(l)
        setCode(l.code)
        setName(l.name)
        setError(null)
        setOpen(true)
    }

    async function save(e?: React.FormEvent) {
        e?.preventDefault()
        setError(null)
        if (!code.trim() || !name.trim()) return setError('Code and name required')
        try {
            const method = editing ? 'PATCH' : 'POST'
            const url = editing ? `/api/languages/${editing.id}` : '/api/languages'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.trim(), name: name.trim() }),
            })
            if (!res.ok) throw new Error('Save failed')
            const saved = await res.json()

            // if creating, attach to project
            if (!editing) {
                await fetch(`/api/projects/${projectId}/languages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ languageId: saved.id }),
                })
            }

            setOpen(false)
            router.refresh()
        } catch (err) {
            setError((err as Error).message || 'Save failed')
        }
    }

    async function attach(languageId: number) {
        await fetch(`/api/projects/${projectId}/languages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ languageId }),
        })
        router.refresh()
    }

    async function detach(languageId: number) {
        await fetch(`/api/projects/${projectId}/languages`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ languageId }),
        })
        router.refresh()
    }

    const availableToAttach = allLanguages.filter((l) => !languages.find((s) => s.id === l.id))

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Languages</h3>
                <div className="flex gap-2">
                    <button
                        onClick={openForCreate}
                        className="px-3 py-1 bg-indigo-600 text-white rounded"
                    >
                        Add language
                    </button>
                </div>
            </div>

            <div className="mb-2">
                {languages.length === 0 && <div className="text-gray-500">No languages</div>}
                <div className="flex gap-2 flex-wrap">
                    {languages.map((l) => (
                        <div title={l.name} key={l.id} className="bg-white p-2 rounded shadow-sm flex items-center gap-2 select-none">
                            <div className="font-medium">{l.code}</div>
                            <button
                                onClick={() => openForEdit(l)}
                                className="text-sm text-indigo-600 cursor-pointer"
                                aria-label={`Edit ${l.code}`}
                                title="Edit"
                            >
                                <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => detach(l.id)}
                                className="text-sm text-red-600 cursor-pointer"
                                aria-label={`Remove ${l.code}`}
                                title="Remove"
                            >
                                <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {availableToAttach.map((l) => (
                        <div title={l.name} key={l.id} className="bg-white p-2 rounded shadow-sm flex items-center gap-2 opacity-50">
                            <div className="font-medium">{l.code}</div>
                            <button key={l.id} onClick={() => attach(l.id)} className="px-2 py-1">
                                <FontAwesomeIcon icon={faPlus} className="text-sm text-green-600 cursor-pointer" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40">
                    <form onSubmit={save} className="bg-white p-4 rounded shadow w-full max-w-md">
                        <h4 className="text-lg font-medium mb-2">{editing ? 'Edit language' : 'Add language'}</h4>
                        <div className="mb-2">
                            <label className="text-sm">Code</label>
                            <input className="mt-1 w-full border rounded px-2 py-1" value={code} onChange={(e) => setCode(e.target.value)} />
                        </div>
                        <div className="mb-2">
                            <label className="text-sm">Name</label>
                            <input className="mt-1 w-full border rounded px-2 py-1" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        {error && <div className="text-red-600 mb-2">{error}</div>}
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setOpen(false)} className="px-3 py-1 border rounded">
                                Cancel
                            </button>
                            <button type="submit" className="px-3 py-1 bg-indigo-600 text-white rounded">
                                Save
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
