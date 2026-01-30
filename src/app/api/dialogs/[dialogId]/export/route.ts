import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { buildExportedKey } from '@/lib/buildExportedKey'

type Params = {
  params: { dialogId: string }
}

export async function GET(request: NextRequest, { params }: Params) {
  const resolved = await params
  const dialogId = resolved.dialogId

  // Fetch dialog with all sections and lines
  const dialog = await prisma.dialog.findUnique({
    where: { id: dialogId },
    include: {
      project: true,
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

  // Get the dialog's translation group with entries
  const dialogGroup = await prisma.translationGroup.findFirst({
    where: {
      projectId: dialog.projectId,
      name: `Dialog_${dialogId}`,
    },
    include: {
      entries: {
        include: {
          translations: {
            include: {
              language: true,
            },
          },
        },
      },
    },
  })

  // Build the export structure
  const exportData: any = {
    startSection: dialog.startSection || '',
    sections: dialog.sections.map((section) => ({
      id: section.sectionId,
      lines: section.lines.map((line) => {
        const baseLine: any = {
          type: line.type,
        }

        // Add type-specific fields
        if (line.speaker) baseLine.speaker = line.speaker
        if (line.textKey) {
          // Build complete translation key
          baseLine.text = buildExportedKey(dialog.project.name, dialogGroup?.name || `Dialog_${dialogId}`, line.textKey)
        }
        if (line.background) baseLine.background = line.background
        if (line.eventName) baseLine.name = line.eventName
        if (line.eventValue) baseLine.value = line.eventValue

        // Parse data field for options and other types
        if (line.data) {
          try {
            const parsed = JSON.parse(line.data)
            // If there are options, convert their text keys to complete keys
            if (parsed.options && Array.isArray(parsed.options)) {
              parsed.options = parsed.options.map((opt: any) => ({
                ...opt,
                text: opt.text ? buildExportedKey(dialog.project.name, dialogGroup?.name || `Dialog_${dialogId}`, opt.text) : opt.text
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

  // Return as JSON file download
  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${dialogId}.json"`,
    },
  })
}
