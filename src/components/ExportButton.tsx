"use client"

import React from 'react'

type Props = { projectId: number }

export default function ExportButton({ projectId }: Props) {
    async function onExport() {
        try {
            const res = await fetch(`/api/projects/${projectId}/export`)
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                alert('Export failed: ' + (err?.error || res.statusText))
                return
            }

            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            // try to derive filename from content-disposition
            const cd = res.headers.get('content-disposition')
            let filename = 'export.csv'
            if (cd) {
                const m = /filename="?([^";]+)"?/.exec(cd)
                if (m) filename = m[1]
            }
            a.download = filename
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error(err)
            alert('Export failed')
        }
    }

    return (
        <button onClick={onExport} className="px-3 py-1 border rounded">
            Export
        </button>
    )
}
