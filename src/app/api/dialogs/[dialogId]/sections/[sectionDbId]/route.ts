import { NextResponse } from 'next/server'
import prisma from '../../../../../../lib/prisma'

type Params = {
  dialogId: string
  sectionDbId: string
}

// PATCH /api/dialogs/[dialogId]/sections/[sectionDbId] - update a section
export async function PATCH(request: Request, { params }: { params: Promise<Params> }) {
  const { sectionDbId } = await params
  const body = await request.json()
  const { sectionId, order } = body

  const section = await prisma.dialogSection.update({
    where: { id: Number(sectionDbId) },
    data: {
      ...(sectionId && { sectionId }),
      ...(order !== undefined && { order }),
    },
  })

  return NextResponse.json(section)
}

// DELETE /api/dialogs/[dialogId]/sections/[sectionDbId] - delete a section
export async function DELETE(_request: Request, { params }: { params: Promise<Params> }) {
  const { sectionDbId } = await params

  await prisma.dialogSection.delete({
    where: { id: Number(sectionDbId) },
  })

  return NextResponse.json({ success: true })
}
