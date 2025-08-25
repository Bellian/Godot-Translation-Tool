"use client"

import AutoGrowTextarea from './AutoGrowTextarea'
import FormControl from './FormControl'

type Language = { id: number; code: string; name: string }

type Props = {
    languages: Language[]
    emptyKey: string
    setEmptyKey: (v: string) => void
    createFromEmpty: (keyRaw?: string, focusFirst?: boolean) => Promise<void>
    creating: boolean
    emptyKeyError: string | null
    setEmptyKeyError: (s: string | null) => void
}

export default function EmptyEntryRow({ languages, emptyKey, setEmptyKey, createFromEmpty, creating, emptyKeyError, setEmptyKeyError }: Props) {
    return (
        <tr key="__empty" className="align-top bg-white border border-gray-400">
            <td className="px-0 py-0 align-top w-64">
                <div>
                    <input
                        className="w-full px-2 py-1"
                        placeholder="New key"
                        value={emptyKey}
                        onChange={(ev) => {
                            setEmptyKey(ev.target.value)
                            if (emptyKeyError) setEmptyKeyError(null)
                        }}
                        onKeyDown={(ev) => {
                            if (ev.key === 'Enter') {
                                ev.currentTarget.blur()
                                createFromEmpty()
                            }
                            // on Tab, create and move focus to first translation
                            if (ev.key === 'Tab') {
                                // prevent default tab so we can control focus
                                ev.preventDefault()
                                createFromEmpty(undefined, true)
                            }
                        }}
                        onBlur={() => {
                            // if blur was caused by Tab keypress we already handled it
                            // otherwise create normally
                            // (ev.relatedTarget is not widely supported, so use a short timeout check)
                            setTimeout(() => {
                                const active = document.activeElement
                                // if focus moved into the table's translation textarea we did it already
                                if (active && active.tagName === 'TEXTAREA') return
                                createFromEmpty()
                            }, 0)
                        }}
                        disabled={creating}
                    />
                    <FormControl error={emptyKeyError}>{null}</FormControl>
                </div>
            </td>
            {languages.map((l) => (
                <td key={l.id} className="px-0 py-0 align-top border-s border-gray-400">
                    <AutoGrowTextarea
                        className="w-full px-2 py-1"
                        placeholder={``}
                        value={''}
                        onChange={() => { /* no-op until created */ }}
                        disabled={true}
                    />
                </td>
            ))}
            <td className="px-0 py-0 border-s border-gray-400">&nbsp;</td>
        </tr>
    )
}
