import { NextResponse } from 'next/server'
import prisma from '../../../../../../../../lib/prisma'

type Params = {
  lineId: string
}

// PATCH /api/dialogs/[dialogId]/sections/[sectionDbId]/lines/[lineId] - update a line
export async function PATCH(request: Request, { params }: { params: Promise<Params> }) {
  const { lineId } = await params
  const body = await request.json()
  const { type, order, speaker, textKey, background, eventName, eventValue, data } = body

  const line = await prisma.dialogLine.update({
    where: { id: Number(lineId) },
    data: {
      ...(type && { type }),
      ...(order !== undefined && { order }),
      ...(speaker !== undefined && { speaker }),
      ...(textKey !== undefined && { textKey }),
      ...(background !== undefined && { background }),
      ...(eventName !== undefined && { eventName }),
      ...(eventValue !== undefined && { eventValue }),
      ...(data !== undefined && { data }),
    },
  })

  return NextResponse.json(line)
}

// DELETE /api/dialogs/[dialogId]/sections/[sectionDbId]/lines/[lineId] - delete a line
export async function DELETE(_request: Request, { params }: { params: Promise<Params> }) {
  const { lineId } = await params

  // delete the translation entry associated with this line, if any
  const line = await prisma.dialogLine.findUnique({
    where: { id: Number(lineId) },
  })
  if (line?.textKey) {
    // find the dialog to get its project
    const dialogSection = await prisma.dialogSection.findUnique({
      where: { id: line.sectionId },
      include: {
        dialog: true,
      }
    })
    if (dialogSection) {
      const dialog = dialogSection.dialog;
      const dialogGroup = await prisma.translationGroup.findFirst({
        where: {
          projectId: dialog.projectId,
          name: `Dialog_${dialog.id}`,
        },
      })

      if (dialogGroup) {
        await prisma.translationEntry.deleteMany({
          where: { groupId: dialogGroup.id, key: line.textKey },
        })
      }
    }
  }

  await prisma.dialogLine.delete({
    where: { id: Number(lineId) },
  })

  return NextResponse.json({ success: true })
}
