import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request, context: { params?: Promise<{ projectId?: string; groupId?: string }> }) {
    try {
        const resolved = await context.params
        const groupId = Number(resolved?.groupId)
        if (Number.isNaN(groupId)) return NextResponse.json({ error: 'Invalid group id' }, { status: 400 })

        const body = await req.json()
        const { key, comment } = body
        if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })

        const entry = await prisma.translationEntry.create({ data: { groupId, key, comment: comment ?? null } })
        return NextResponse.json(entry, { status: 201 })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

export async function DELETE(req: Request, context: { params?: Promise<{ projectId?: string; groupId?: string }> }) {
    try {
        const resolved = await context.params
        const groupId = Number(resolved?.groupId)
        if (Number.isNaN(groupId)) return NextResponse.json({ error: 'Invalid group id' }, { status: 400 })

        const body = await req.json()
        const { entryId } = body
        if (!entryId) return NextResponse.json({ error: 'entryId required' }, { status: 400 })

        await prisma.translationEntry.delete({ where: { id: entryId } })
        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
