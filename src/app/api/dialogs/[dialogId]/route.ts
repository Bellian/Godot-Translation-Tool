import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'

type Params = {
  dialogId: string
}

// GET /api/dialogs/[dialogId] - get a specific dialog with all sections and lines
export async function GET(_request: Request, { params }: { params: Promise<Params> }) {
  const { dialogId } = await params

  const dialog = await prisma.dialog.findUnique({
    where: { id: dialogId },
    include: {
      sections: {
        include: {
          lines: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!dialog) {
    return NextResponse.json({ error: 'Dialog not found' }, { status: 404 })
  }

  return NextResponse.json(dialog)
}

// PATCH /api/dialogs/[dialogId] - update dialog metadata
export async function PATCH(request: Request, { params }: { params: Promise<Params> }) {
  const { dialogId } = await params
  const body = await request.json()
  const { name, description, startSection } = body

  const dialog = await prisma.dialog.update({
    where: { id: dialogId },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(startSection !== undefined && { startSection }),
    },
  })

  return NextResponse.json(dialog)
}

// DELETE /api/dialogs/[dialogId] - delete a dialog and its translation group
export async function DELETE(_request: Request, { params }: { params: Promise<Params> }) {
  const { dialogId } = await params

  // Get the dialog to find its project
  const dialog = await prisma.dialog.findUnique({
    where: { id: dialogId },
  })

  if (!dialog) {
    return NextResponse.json({ error: 'Dialog not found' }, { status: 404 })
  }

  // Delete the dialog (cascade will delete sections and lines)
  await prisma.dialog.delete({
    where: { id: dialogId },
  })

  // Delete the associated translation group
  const groupName = `Dialog_${dialogId}`
  await prisma.translationGroup.deleteMany({
    where: {
      projectId: dialog.projectId,
      name: groupName,
    },
  })

  return NextResponse.json({ success: true })
}
