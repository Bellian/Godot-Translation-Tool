import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, context: { params: Promise<{ id?: string }> }) {
    try {
        const resolved = await context.params
        const id = Number(resolved?.id)
        if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
        const body = await req.json()
        const { code, name } = body
        if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 })
        const lang = await prisma.language.update({ where: { id }, data: { code, name } })
        return NextResponse.json(lang)
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
