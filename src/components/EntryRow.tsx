"use client"

import AutoGrowTextarea from './AutoGrowTextarea'
import FormControl from './FormControl'
import { useState } from 'react'
import { useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faRobot } from '@fortawesome/free-solid-svg-icons'

type Language = { id: number; code: string; name: string }
type Translation = { id: number; languageId: number; text: string }
type Entry = { id: number; key: string; translations: Translation[]; copied?: boolean }

type Props = {
    entry: Entry
    languages: Language[]
    onRemove: (id: number) => void
    onUpdateEntry: (id: number, key: string) => void
    onUpdateTranslation: (entryId: number, languageId: number, text: string) => void
    onCopy: (entryId: number, entryKey: string, currentCopied?: boolean) => void
    copiedId: number | null
    exportedKey: string
    aiEnabled: boolean
}

export default function EntryRow({ entry, languages, onRemove, onUpdateEntry, onUpdateTranslation, onCopy, copiedId, exportedKey, aiEnabled }: Props) {
    const [localKey, setLocalKey] = useState(entry.key)
    const [translating, setTranslating] = useState(false)

    const autocompleteAI = async () => {
        // translate using server-side route
        try {
            setTranslating(true)
            const payload = {
                key: entry.key,
                exportedKey,
                translations: entry.translations.map((t) => {
                    const lang = languages.find((l) => l.id === t.languageId)
                    return { languageCode: lang?.code ?? String(t.languageId), text: t.text }
                }),
                // include all project languages (codes)
                availableLanguages: languages.map((l) => ({ id: l.id, code: l.code })),
            }

            const res = await fetch('/api/translate-entry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) throw new Error('Translation request failed')
            const body = await res.json()

            // body.translations is expected to be a mapping { languageCode: text }
            if (body?.translations && typeof body.translations === 'object') {
                for (const [code, text] of Object.entries(body.translations)) {
                    const lang = languages.find((l) => l.code === code)
                    if (lang) {
                        onUpdateTranslation(entry.id, lang.id, String(text ?? ''))
                    }
                }
            }
        } catch (err) {
            console.error('Translate failed', err)
        } finally {
            setTranslating(false)
        }
    }

    return (
        <tr className="align-top border border-gray-400 bg-white" data-entry-id={String(entry.id)}>
            <td className="px-0 py-0 align-top w-64">
                <div>
                    <input
                        className={`w-full px-2 py-1`}
                        value={localKey}
                        onChange={(ev) => setLocalKey(ev.target.value)}
                        onBlur={() => onUpdateEntry(entry.id, localKey)}
                    />
                    <FormControl
                        help={
                            <button
                                onClick={() => onCopy(entry.id, entry.key, entry.copied)}
                                type="button"
                                tabIndex={-1}
                                className={`cursor-pointer hover:underline text-left ${copiedId === entry.id ? 'text-green-600' : (entry.copied === false ? 'text-red-600' : 'text-gray-500')}`}
                            >
                                {exportedKey}
                            </button>
                        }
                    >
                        <></>
                    </FormControl>
                </div>
            </td>

            {languages.map((l) => {
                const t = entry.translations.find((tr) => tr.languageId === l.id)
                return (
                    <td key={l.id} className="px-0 py-0 align-top border-s border-gray-400">
                        <AutoGrowTextarea
                            className="w-full  px-2 py-1"
                            placeholder={`— ${l.code} —`}
                            value={t?.text ?? ''}
                            onChange={(v) => onUpdateTranslation(entry.id, l.id, v)}
                            disabled={false}
                        />
                    </td>
                )
            })}

            <td className="px-0 py-0 border-s border-gray-400 w-0">
                <div className="flex items-center gap-2 px-2 py-1">
                    <button
                        disabled={aiEnabled === false}
                        onClick={autocompleteAI}
                        aria-label="Translate entry"
                        title="Translate"
                        className={`text-sm text-indigo-600 cursor-pointer leading-none ${aiEnabled === false ? 'opacity-40 cursor-not-allowed' : ''}`}
                        tabIndex={-1}
                    >
                        <FontAwesomeIcon icon={faRobot} className={translating ? 'animate-spin' : ''} />
                    </button>

                    <button
                        onClick={() => onRemove(entry.id)}
                        aria-label="Delete entry"
                        title="Delete"
                        className="text-sm text-red-600 cursor-pointer leading-none ms-2"
                        tabIndex={-1}
                    >
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                </div>
            </td>
        </tr>
    )
}
