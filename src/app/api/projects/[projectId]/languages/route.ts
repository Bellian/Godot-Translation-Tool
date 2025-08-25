import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request, context: { params?: Promise<{ projectId?: string }> }) {
    try {
        const resolved = await context.params
        const projectId = Number(resolved?.projectId)
        if (Number.isNaN(projectId)) return NextResponse.json({ error: 'Invalid project id' }, { status: 400 })
        const body = await req.json()
        const { languageId } = body
        if (!languageId) return NextResponse.json({ error: 'languageId required' }, { status: 400 })

        await prisma.projectLanguage.create({ data: { projectId, languageId } })
        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

export async function DELETE(req: Request, context: { params?: Promise<{ projectId?: string }> }) {
    try {
        const resolved = await context.params
        const projectId = Number(resolved?.projectId)
        if (Number.isNaN(projectId)) return NextResponse.json({ error: 'Invalid project id' }, { status: 400 })
        const body = await req.json()
        const { languageId } = body
        if (!languageId) return NextResponse.json({ error: 'languageId required' }, { status: 400 })

        await prisma.projectLanguage.delete({ where: { projectId_languageId: { projectId, languageId } } })
        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
