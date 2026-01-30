import { NextResponse } from 'next/server'
import prisma from '../../../../../../../lib/prisma'

type Params = {
  sectionDbId: string
}

// GET /api/dialogs/[dialogId]/sections/[sectionDbId]/lines - get all lines for a section
export async function GET(_request: Request, { params }: { params: Promise<Params> }) {
  const { sectionDbId } = await params

  const lines = await prisma.dialogLine.findMany({
    where: { sectionId: Number(sectionDbId) },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(lines)
}

// POST /api/dialogs/[dialogId]/sections/[sectionDbId]/lines - create a new line
export async function POST(request: Request, { params }: { params: Promise<Params> }) {
  const { sectionDbId } = await params
  const body = await request.json()
  const { type, order, speaker, textKey, background, eventName, eventValue, data } = body

  if (!type) {
    return NextResponse.json({ error: 'type required' }, { status: 400 })
  }

  const line = await prisma.dialogLine.create({
    data: {
      sectionId: Number(sectionDbId),
      type,
      order: order ?? 0,
      speaker: speaker || null,
      textKey: textKey || null,
      background: background || null,
      eventName: eventName || null,
      eventValue: eventValue || null,
      data: data || null,
    },
  })

  return NextResponse.json(line)
}
