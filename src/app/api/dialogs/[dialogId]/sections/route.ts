import { NextResponse } from 'next/server'
import prisma from '../../../../../lib/prisma'

type Params = {
  dialogId: string
}

// GET /api/dialogs/[dialogId]/sections - get all sections for a dialog
export async function GET(_request: Request, { params }: { params: Promise<Params> }) {
  const { dialogId } = await params

  const sections = await prisma.dialogSection.findMany({
    where: { dialogId },
    include: {
      lines: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(sections)
}

// POST /api/dialogs/[dialogId]/sections - create a new section
export async function POST(request: Request, { params }: { params: Promise<Params> }) {
  const { dialogId } = await params
  const body = await request.json()
  const { sectionId, order } = body

  if (!sectionId) {
    return NextResponse.json({ error: 'sectionId required' }, { status: 400 })
  }

  // Check if section ID already exists in this dialog
  const existing = await prisma.dialogSection.findFirst({
    where: { dialogId, sectionId },
  })

  if (existing) {
    return NextResponse.json({ error: 'Section with this ID already exists' }, { status: 409 })
  }

  const section = await prisma.dialogSection.create({
    data: {
      dialogId,
      sectionId,
      order: order ?? 0,
    },
  })

  return NextResponse.json(section)
}
