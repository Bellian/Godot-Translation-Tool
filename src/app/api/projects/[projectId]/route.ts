import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, context: { params?: Promise<{ projectId?: string }> }) {
    try {
        // params can be a plain object or a Promise depending on runtime - normalize it
        const resolvedParams = await context.params

        const projectId = Number(resolvedParams?.projectId)
        if (Number.isNaN(projectId)) {
            return NextResponse.json({ error: 'Invalid project id' }, { status: 400 })
        }

        const body = await req.json()
        const { name, description } = body

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        const project = await prisma.project.update({
            where: { id: projectId },
            data: {
                name,
                description: description ?? null,
            },
        })

        return NextResponse.json(project)
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

export async function DELETE(req: Request, context: { params?: Promise<{ projectId?: string }> }) {
    try {
        const resolvedParams = await context.params

        const projectId = Number(resolvedParams?.projectId)
        if (Number.isNaN(projectId)) {
            return NextResponse.json({ error: 'Invalid project id' }, { status: 400 })
        }

        // Attempt to delete the project
        const deleted = await prisma.project.delete({ where: { id: projectId } })

        return NextResponse.json({ success: true, project: deleted })
    } catch (err) {
        console.error(err)
        // If the project was not found, prisma throws an error we can map to 404
        if (err instanceof PrismaClientKnownRequestError && err?.code === 'P2025' || err instanceof Error && /Record to delete not found/.test(String(err.message))) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
