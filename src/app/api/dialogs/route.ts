import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

// GET /api/dialogs?projectId=<id> - list all dialogs for a project
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  const dialogs = await prisma.dialog.findMany({
    where: { projectId: Number(projectId) },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(dialogs)
}

// POST /api/dialogs - create a new dialog
export async function POST(request: Request) {
  const body = await request.json()
  const { id, projectId, name, description } = body

  if (!id || !projectId || !name) {
    return NextResponse.json({ error: 'id, projectId and name required' }, { status: 400 })
  }

  // Check if dialog ID already exists for this project
  const existing = await prisma.dialog.findFirst({
    where: { id, projectId: Number(projectId) },
  })

  if (existing) {
    return NextResponse.json({ error: 'Dialog with this ID already exists' }, { status: 409 })
  }

  const dialog = await prisma.dialog.create({
    data: {
      id,
      projectId: Number(projectId),
      name,
      description: description || null,
      startSection: 'start',
    },
  })

  // Create the dialog's translation group
  await prisma.translationGroup.create({
    data: {
      projectId: Number(projectId),
      name: `Dialog_${id}`,
      description: `Translations for dialog ${name}`,
    },
  })

  // Create a default "start" section
  await prisma.dialogSection.create({
    data: {
      dialogId: id,
      sectionId: 'start',
      order: 0,
    },
  })

  return NextResponse.json(dialog)
}
