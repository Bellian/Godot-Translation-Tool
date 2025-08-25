import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { buildExportedKey } from '@/lib/buildExportedKey'

type ExportLanguage = { id: number; code: string }
type ExportTranslation = { id: number; languageId: number; text: string; language?: ExportLanguage }
type ExportEntry = { id: number; key: string; translations: ExportTranslation[] }
type ExportGroup = { id: number; name: string; entries: ExportEntry[] }
type ExportProject = { id: number; name: string; projectLanguages: { language: ExportLanguage }[]; groups: ExportGroup[] }

function escapeCsv(value: string | null | undefined) {
    if (value === null || typeof value === 'undefined') return ''
    const s = String(value)
    if (s.includes('"')) return `"${s.replace(/"/g, '""')}"`
    if (s.includes(',') || s.includes('\n') || s.includes('\r')) return `"${s}"`
    return s
}

export async function GET(req: Request, context: { params?: Promise<{ projectId?: string }> }) {
    try {
        const resolved = await context.params
        const projectId = Number(resolved?.projectId)
        if (Number.isNaN(projectId)) return NextResponse.json({ error: 'Invalid project id' }, { status: 400 })

        const project = (await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                projectLanguages: { include: { language: true } },
                groups: { include: { entries: { include: { translations: { include: { language: true } } } } } },
            },
        })) as ExportProject | null

        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

        const languages: ExportLanguage[] = project.projectLanguages.map((pl) => pl.language)

        // header
        const header = ['keys', ...languages.map((l) => l.code)]

        // collect rows
        const rows: string[][] = []

        for (const g of project.groups) {
            for (const e of g.entries) {
                // build key as requested
                const key = buildExportedKey(project.name, g.name, e.key)
                const row: string[] = [key]
                for (const lang of languages) {
                    const t = e.translations.find((tt) => tt.languageId === lang.id)
                    row.push(t ? t.text : '')
                }
                rows.push(row)
            }
        }

        // build CSV text
        const lines = []
        lines.push(header.map((h) => escapeCsv(h)).join(','))
        for (const r of rows) {
            lines.push(r.map((c) => escapeCsv(c)).join(','))
        }

        const csv = lines.join('\n')

        const filename = `${project.name.replace(/[^a-z0-9-_\.]/gi, '_') || 'export'}.csv`
        return new Response(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
