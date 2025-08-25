import prisma from '../../../../../lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request, context: { params: unknown }) {
    try {
        const resolved = (await Promise.resolve(context.params)) as { projectId?: string } | undefined
        const projectId = Number(resolved?.projectId)
        if (Number.isNaN(projectId)) return NextResponse.json({ error: 'Invalid project id' }, { status: 400 })

        const body = await req.json()
        const { name, description } = body
        if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

        const group = await prisma.translationGroup.create({ data: { projectId, name, description: description ?? null } })
        return NextResponse.json(group, { status: 201 })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

export async function DELETE(req: Request, context: { params: unknown }) {
    try {
        const resolved = (await Promise.resolve(context.params)) as { projectId?: string } | undefined
        const projectId = Number(resolved?.projectId)
        if (Number.isNaN(projectId)) return NextResponse.json({ error: 'Invalid project id' }, { status: 400 })

        const body = await req.json()
        const { groupId } = body
        if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })

        await prisma.translationGroup.delete({ where: { id: groupId } })
        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
