import { NextResponse } from 'next/server'
import prisma from '../../../../../../../lib/prisma'

type Params = {
  dialogId: string
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
  const { dialogId, sectionDbId } = await params
  const body = await request.json()
  const { type, order, speaker, textKey, background, eventName, eventValue, data } = body

  if (!type) {
    return NextResponse.json({ error: 'type required' }, { status: 400 })
  }

  let finalTextKey = textKey || null

  // If this is a dialog line, create a translation entry automatically
  if (type === 'dialog') {
    // Get the dialog to find its project
    const dialog = await prisma.dialog.findUnique({
      where: { id: dialogId },
      select: { projectId: true },
    })

    if (!dialog) {
      return NextResponse.json({ error: 'Dialog not found' }, { status: 404 })
    }

    // Find or create the dialog's translation group
    let dialogGroup = await prisma.translationGroup.findFirst({
      where: {
        projectId: dialog.projectId,
        name: `Dialog_${dialogId}`,
      },
    })

    if (!dialogGroup) {
      dialogGroup = await prisma.translationGroup.create({
        data: {
          projectId: dialog.projectId,
          name: `Dialog_${dialogId}`,
          description: `Translation entries for dialog ${dialogId}`,
        },
      })
    }

    // Generate a unique key for this dialog line
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const key = `dialog_line_${timestamp}_${randomSuffix}`

    // Create translation entry
    const entry = await prisma.translationEntry.create({
      data: {
        groupId: dialogGroup.id,
        key,
        comment: `Auto-generated for dialog line`,
      },
    })

    // Get all project languages and create empty translations
    const projectLanguages = await prisma.projectLanguage.findMany({
      where: { projectId: dialog.projectId },
      select: { languageId: true },
    })

    // Create empty translations for each language
    await Promise.all(
      projectLanguages.map((pl) =>
        prisma.translation.create({
          data: {
            entryId: entry.id,
            languageId: pl.languageId,
            text: '', // Empty text initially
          },
        })
      )
    )

    finalTextKey = key
  }

  const line = await prisma.dialogLine.create({
    data: {
      sectionId: Number(sectionDbId),
      type,
      order: order ?? 0,
      speaker: speaker || null,
      textKey: finalTextKey,
      background: background || null,
      eventName: eventName || null,
      eventValue: eventValue || null,
      data: data || null,
    },
  })

  return NextResponse.json(line)
}
