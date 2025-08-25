import prisma from '../../../../../../../../lib/prisma'
import { NextResponse } from 'next/server'

interface BodyData {
    key?: string;
    comment?: string | null;
    copied?: boolean;
}

export async function PATCH(req: Request, context: { params: unknown }) {
    try {
        const resolved = (await Promise.resolve(context.params)) as { projectId?: string; groupId?: string; entryId?: string } | undefined
        const entryId = Number(resolved?.entryId)
        if (Number.isNaN(entryId)) return NextResponse.json({ error: 'Invalid entry id' }, { status: 400 })

        const body = await req.json() as BodyData;
        const { key, comment, copied } = body

        const data: BodyData = {}
        if (typeof key !== 'undefined') data.key = key
        if (typeof comment !== 'undefined') data.comment = comment ?? null
        if (typeof copied !== 'undefined') data.copied = Boolean(copied)

        if (Object.keys(data).length === 0) return NextResponse.json({ error: 'nothing to update' }, { status: 400 })

        const entry = await prisma.translationEntry.update({ where: { id: entryId }, data })
        return NextResponse.json(entry)
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

export async function POST(req: Request, context: { params: unknown }) {
    // create or update a translation for this entry
    try {
        const resolved = (await Promise.resolve(context.params)) as { projectId?: string; groupId?: string; entryId?: string } | undefined
        const entryId = Number(resolved?.entryId)
        if (Number.isNaN(entryId)) return NextResponse.json({ error: 'Invalid entry id' }, { status: 400 })

        const body = await req.json()
        const { languageId, text } = body
        if (!languageId) return NextResponse.json({ error: 'languageId required' }, { status: 400 })

        // if text is empty, remove any existing translation so empty translations don't persist
        const existing = await prisma.translation.findUnique({ where: { entryId_languageId: { entryId, languageId } } })
        if (!text || (typeof text === 'string' && text.trim() === '')) {
            if (existing) {
                await prisma.translation.delete({ where: { id: existing.id } })
                // successful deletion — no content
                return new NextResponse(null, { status: 204 })
            }
            // nothing to do
            return new NextResponse(null, { status: 204 })
        }

        // upsert translation with non-empty text
        if (existing) {
            const updated = await prisma.translation.update({ where: { id: existing.id }, data: { text } })
            return NextResponse.json(updated)
        }

        const created = await prisma.translation.create({ data: { entryId, languageId, text } })
        return NextResponse.json(created, { status: 201 })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
