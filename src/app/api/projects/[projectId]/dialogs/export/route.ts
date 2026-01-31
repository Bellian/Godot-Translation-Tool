import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import JSZip from 'jszip'
import { buildExportedKey } from '@/lib/buildExportedKey'

type Params = {
  projectId: string
}

export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { projectId: projectIdStr } = await params
  const projectId = Number(projectIdStr)

  if (isNaN(projectId)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
  }

  // Fetch project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Fetch all dialogs for this project
  const dialogs = await prisma.dialog.findMany({
    where: { projectId },
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
    orderBy: { createdAt: 'asc' },
  })

  if (dialogs.length === 0) {
    return NextResponse.json({ error: 'No dialogs found' }, { status: 404 })
  }

  // Create a zip file
  const zip = new JSZip()

  type ExportLine = {
    type: string
    speaker?: string | null
    text?: string
    background?: string | null
    name?: string | null
    value?: string | null
    data?: string | null
    [key: string]: unknown
  }

  type ExportOption = {
    text?: string
    [key: string]: unknown
  }

  // Process each dialog
  for (const dialog of dialogs) {
    // Get the dialog's translation group
    const dialogGroup = await prisma.translationGroup.findFirst({
      where: {
        projectId: dialog.projectId,
        name: `Dialog_${dialog.id}`,
      },
    })

    const exportData = {
      startSection: dialog.startSection || '',
      sections: dialog.sections.map((section) => ({
        id: section.sectionId,
        lines: section.lines.map((line) => {
          const baseLine: ExportLine = {
            type: line.type,
          }

          // Add type-specific fields
          if (line.speaker) baseLine.speaker = line.speaker
          if (line.textKey) {
            // Build complete translation key
            baseLine.text = buildExportedKey(project.name, dialogGroup?.name || `Dialog_${dialog.id}`, line.textKey)
          }
          if (line.background) baseLine.background = line.background
          if (line.eventName) baseLine.name = line.eventName
          if (line.eventValue) baseLine.value = line.eventValue

          // Parse data field for options and other types
          if (line.data) {
            try {
              const parsed = JSON.parse(line.data) as Record<string, unknown>
              // If there are options, convert their text keys to complete keys
              if (parsed.options && Array.isArray(parsed.options)) {
                parsed.options = parsed.options.map((opt: ExportOption) => ({
                  ...opt,
                  text: opt.text ? buildExportedKey(project.name, dialogGroup?.name || `Dialog_${dialog.id}`, opt.text) : opt.text
                }))
              }
              Object.assign(baseLine, parsed)
            } catch {
              // If not JSON, just add as data
              baseLine.data = line.data
            }
          }

          return baseLine
        }),
      })),
    }

    // Add dialog JSON to zip
    zip.file(`${dialog.id}.json`, JSON.stringify(exportData, null, 2))
  }

  // Generate zip buffer
  const zipBuffer = await zip.generateAsync({ type: 'uint8array' })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `${project.name}_dialogs_${timestamp}.zip`

  // Return as zip file download
  return new NextResponse(Buffer.from(zipBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
