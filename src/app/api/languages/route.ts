import prisma from '../../../lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
    const langs = await prisma.language.findMany({ orderBy: { code: 'asc' } })
    return NextResponse.json(langs)
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { code, name } = body
        if (!code || !name) return NextResponse.json({ error: 'code and name required' }, { status: 400 })
        const existing = await prisma.language.findUnique({ where: { code } })
        if (existing) return NextResponse.json({ error: 'Language code already exists' }, { status: 409 })
        const lang = await prisma.language.create({ data: { code, name } })
        return NextResponse.json(lang, { status: 201 })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
