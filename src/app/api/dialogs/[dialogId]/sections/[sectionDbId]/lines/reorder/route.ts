import { NextResponse } from 'next/server'
import prisma from '../../../../../../../../lib/prisma'

type Params = {
  sectionDbId: string
}

// PATCH /api/dialogs/[dialogId]/sections/[sectionDbId]/lines/reorder - reorder lines
export async function PATCH(request: Request, { params }: { params: Promise<Params> }) {
  const { sectionDbId } = await params
  const body = await request.json()
  const { lineIds } = body

  if (!Array.isArray(lineIds)) {
    return NextResponse.json({ error: 'lineIds must be an array' }, { status: 400 })
  }

  // Update order for each line
  await Promise.all(
    lineIds.map((lineId: number, index: number) =>
      prisma.dialogLine.update({
        where: { id: lineId },
        data: { order: index },
      })
    )
  )

  return NextResponse.json({ success: true })
}
