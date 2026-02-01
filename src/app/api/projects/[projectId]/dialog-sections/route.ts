import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await params
    const projectIdNum = parseInt(projectId, 10)

    try {
        // Get all dialogs for this project
        const dialogs = await prisma.dialog.findMany({
            where: { projectId: projectIdNum },
            include: {
                sections: {
                    select: {
                        sectionId: true,
                    },
                },
            },
        })

        // Extract all unique section IDs
        const sectionIds = new Set<string>()
        dialogs.forEach((dialog) => {
            dialog.sections.forEach((section) => {
                sectionIds.add(section.sectionId)
            })
        })

        return NextResponse.json(Array.from(sectionIds).sort())
    } catch (error) {
        console.error('Error fetching dialog sections:', error)
        return NextResponse.json({ error: 'Failed to fetch dialog sections' }, { status: 500 })
    }
}
