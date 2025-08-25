"use client"

import { useEffect, useState, useRef } from 'react'
import { buildExportedKey } from '../lib/buildExportedKey'
import EntryRow from './EntryRow'
import EmptyEntryRow from './EmptyEntryRow'

type Language = { id: number; code: string; name: string }
type Translation = { id: number; languageId: number; text: string }
type Entry = { id: number; key: string; translations: Translation[]; copied?: boolean }

type Props = { projectId: number; groupId: number; projectName: string; groupName: string; languages: Language[]; initialEntries: Entry[] }

export default function EntryManager({ projectId, groupId, projectName, groupName, languages, initialEntries }: Props) {
    const [entries, setEntries] = useState<Entry[]>(initialEntries)
    const [copiedId, setCopiedId] = useState<number | null>(null)
    const [emptyKey, setEmptyKey] = useState('')
    const [creating, setCreating] = useState(false)
    const [emptyKeyError, setEmptyKeyError] = useState<string | null>(null)

    useEffect(() => setEntries([...initialEntries].slice().sort((a, b) => a.id - b.id)), [initialEntries])

    // timers for debouncing translation POST requests: key is `${entryId}:${languageId}`
    // use a loose any type for timer ids to be compatible across environments
    const timersRef = useRef<Record<string, NodeJS.Timeout | number>>({})
    useEffect(() => {
        return () => {
            // clear any pending timers on unmount
            Object.values(timersRef.current).forEach((t) => clearTimeout(t))
            timersRef.current = {}
        }
    }, [])

    async function updateTranslation(entryId: number, languageId: number, text: string) {
        // optimistic update
        const prev = entries
        setEntries((s) =>
            s.map((e) =>
                e.id === entryId
                    ? {
                        ...e,
                        translations: ((): Translation[] => {
                            const found = e.translations.find((t) => t.languageId === languageId)
                            if (!text || text.trim() === '') {
                                // remove translation optimistically when emptied
                                return e.translations.filter((t) => t.languageId !== languageId)
                            }
                            if (found) return e.translations.map((t) => (t.languageId === languageId ? { ...t, text } : t))
                            return [...e.translations, { id: Date.now() * -1, languageId, text }]
                        })(),
                    }
                    : e,
            ),
        )

        // debounce the POST per entryId+languageId to avoid rapid requests while typing
        const key = `${entryId}:${languageId}`
        if (timersRef.current[key]) clearTimeout(timersRef.current[key])
        timersRef.current[key] = setTimeout(async () => {
            try {
                await fetch(`/api/projects/${projectId}/groups/${groupId}/entries/${entryId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ languageId, text }),
                })
            } catch (err) {
                // revert optimistic update on failure
                setEntries(prev)
                console.error(err)
            } finally {
                // clear the timer entry
                delete timersRef.current[key]
            }
        }, 500)
    }

    // delegated to lib/buildExportedKey.ts

    const copyExportedKey = async (entryId: number, entryKey: string, currentCopied?: boolean) => {
        const text = buildExportedKey(projectName, groupName, entryKey)
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text)
                setCopiedId(entryId)
                setTimeout(() => setCopiedId(null), 1500)

                // if already copied on server, nothing to persist
                if (currentCopied) return

                // optimistic mark as copied locally
                setEntries((s) => s.map((e) => (e.id === entryId ? { ...e, copied: true } : e)))

                // persist to server
                await fetch(`/api/projects/${projectId}/groups/${groupId}/entries/${entryId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ copied: true }),
                })
            } catch (err) {
                // on error, revert optimistic change
                setEntries((s) => s.map((e) => (e.id === entryId ? { ...e, copied: false } : e)))
                console.error(err)
            }
        }
    }

    const createFromEmpty = async (keyRaw?: string, focusFirst: boolean = false) => {
        const key = (keyRaw ?? emptyKey).trim()
        if (!key) return
        setCreating(true)
        // check for duplicate keys in the current group's entries (trim + case-insensitive)
        const normalized = key.toLowerCase()
        if (entries.some((e) => e.key.trim().toLowerCase() === normalized)) {
            setCreating(false)
            // surface validation error instead of alert to avoid focus/blur loops
            setEmptyKeyError('An entry with this key already exists in this group.')
            return
        }
        // use positive temp id so optimistic item sorts to bottom
        const tempId = Date.now() + Math.floor(Math.random() * 1000)
        const newEntry: Entry = { id: tempId, key, translations: [] }
        setEntries((s) => [...s, newEntry])
        setEmptyKey('')
        // if requested, focus the first translation textarea for the new optimistic row
        if (focusFirst) {
            // wait for DOM to render the optimistic row
            requestAnimationFrame(() => {
                const el = document.querySelector(`tr[data-entry-id="${tempId}"] textarea`)
                if (el instanceof HTMLElement) el.focus()
            })
        }
        try {
            const res = await fetch(`/api/projects/${projectId}/groups/${groupId}/entries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key }),
            })
            if (!res.ok) throw new Error('Create failed')
            const created = await res.json()
            setEntries((s) => s.map((e) => (e.id === tempId ? { ...e, id: created.id } : e)).sort((a, b) => a.id - b.id))
            // ensure focus moves to the real created row if requested
            if (focusFirst) {
                requestAnimationFrame(() => {
                    const el = document.querySelector(`tr[data-entry-id="${created.id}"] textarea`)
                    if (el instanceof HTMLElement) el.focus()
                })
            }
        } catch (err) {
            setEntries((s) => s.filter((e) => e.id !== tempId))
            console.error(err)
        } finally {
            setCreating(false)
            // clear empty-key error on completion (success or failure)
            setEmptyKeyError(null)
        }
    }

    async function removeEntry(entryId: number) {
        if (!confirm('Remove this entry?')) return
        const prev = entries
        setEntries((s) => s.filter((e) => e.id !== entryId))
        try {
            await fetch(`/api/projects/${projectId}/groups/${groupId}/entries`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entryId }),
            })
        } catch (err) {
            setEntries(prev)
            console.error(err)
        }
    }

    return (
        <div className="mb-6">
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left">
                            <th className="px-2 py-1">Key</th>
                            {languages.map((l) => (
                                <th key={l.id} className="px-2 py-1">{l.code}</th>
                            ))}
                            <th className="px-2 py-1"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((e) => (
                            <EntryRow
                                key={e.id}
                                entry={e}
                                languages={languages}
                                onRemove={removeEntry}
                                onUpdateEntry={(id, key) => {
                                    // also clear copied when key changes
                                    setEntries((s) => s.map((x) => (x.id === id ? { ...x, key, copied: false } : x)))
                                    fetch(`/api/projects/${projectId}/groups/${groupId}/entries/${id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ key }),
                                    }).catch((err) => console.error(err))
                                }}
                                onUpdateTranslation={updateTranslation}
                                onCopy={copyExportedKey}
                                copiedId={copiedId}
                                exportedKey={buildExportedKey(projectName, groupName, e.key)}
                            />
                        ))}

                        <EmptyEntryRow
                            languages={languages}
                            emptyKey={emptyKey}
                            setEmptyKey={setEmptyKey}
                            createFromEmpty={createFromEmpty}
                            creating={creating}
                            emptyKeyError={emptyKeyError}
                            setEmptyKeyError={setEmptyKeyError}
                        />
                    </tbody>
                </table>
            </div>
        </div>
    )
}
