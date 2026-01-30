import prisma from '../../../lib/prisma'
import Link from 'next/link'
import BackButton from '../../../components/BackButton'
import DialogEditor from '@/components/DialogEditor'

type Props = {
  params: { dialogId: string }
}

export default async function DialogPage({ params }: Props) {
  const resolved = await params
  const dialogId = resolved.dialogId

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
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-medium">Dialog not found</h1>
          <p className="mt-4">
            <Link href="/" className="text-indigo-600 hover:underline">
              Back to projects
            </Link>
          </p>
        </div>
      </main>
    )
  }

  // Get the dialog's translation group
  const dialogGroup = await prisma.translationGroup.findFirst({
    where: {
      projectId: dialog.projectId,
      name: `Dialog_${dialogId}`,
    },
    include: {
      entries: {
        include: {
          translations: true,
        },
      },
    },
  })

  // Get project languages
  const projectLanguages = await prisma.projectLanguage.findMany({
    where: { projectId: dialog.projectId },
    include: { language: true },
  })

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-4">
          <BackButton label={`Back to ${dialog.project.name}`} href={`/project/${dialog.projectId}`} />
          <h1 className="text-3xl font-semibold mt-3">{dialog.name}</h1>
          {dialog.description && <p className="text-gray-600 mt-1">{dialog.description}</p>}
          <p className="text-sm text-gray-500 mt-1">Dialog ID: <span className="font-mono">{dialog.id}</span></p>
        </header>

        <DialogEditor
          dialog={dialog}
          dialogGroup={dialogGroup}
          projectLanguages={projectLanguages.map((pl) => ({
            id: pl.language.id,
            code: pl.language.code,
            name: pl.language.name,
          }))}
        />
      </div>
    </main>
  )
}

export const dynamic = 'force-dynamic'
