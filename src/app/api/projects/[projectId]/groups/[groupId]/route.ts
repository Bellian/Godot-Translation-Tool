import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, context: { params?: Promise<{ projectId?: string; groupId?: string }> }) {
    try {
        const resolved = await context.params
        const groupId = Number(resolved?.groupId)
        if (Number.isNaN(groupId)) return NextResponse.json({ error: 'Invalid group id' }, { status: 400 })

        const body = await req.json()
        const { name, description } = body
        if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

        const group = await prisma.translationGroup.update({ where: { id: groupId }, data: { name, description: description ?? null } })
        return NextResponse.json(group)
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
