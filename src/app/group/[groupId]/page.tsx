import prisma from '../../../lib/prisma'
import Link from 'next/link'
import BackButton from '../../../components/BackButton'
import EntryManager from '../../../components/EntryManager'
import ExportButton from '@/components/ExportButton'

type Props = {
    params: { groupId: string }
}

type EntryWithTranslations = {
    id: number
    key: string
    comment?: string | null
    copied?: boolean
    translations: { id: number; language: { id: number; code: string; name: string }; text: string }[]
}

type GroupWithRelations = {
    id: number
    name: string
    description?: string | null
    project: { id: number; name: string; projectLanguages?: { language: { id: number; code: string; name: string } }[] }
    entries: EntryWithTranslations[]
}

export default async function GroupPage({ params }: Props) {
    const resolved = (await Promise.resolve(params)) as { groupId?: string } | undefined
    const id = Number(resolved?.groupId)
    if (Number.isNaN(id)) {
        return (
            <main className="min-h-screen p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-medium">Invalid group id</h1>
                    <p className="mt-4">
                        <Link href="/" className="text-indigo-600 hover:underline">
                            Back to projects
                        </Link>
                    </p>
                </div>
            </main>
        )
    }

    const group = (await prisma.translationGroup.findUnique({
        where: { id },
        include: {
            project: { include: { projectLanguages: { include: { language: true } } } },
            entries: {
                include: { translations: { include: { language: true } } },
                orderBy: { id: 'asc' },
            },
        },
    })) as GroupWithRelations | null

    if (!group) {
        return (
            <main className="min-h-screen p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-medium">Group not found</h1>
                    <p className="mt-4">
                        <Link href="/" className="text-indigo-600 hover:underline">
                            Back to projects
                        </Link>
                    </p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="">
                <header className="mb-4">
                    <div className="flex items-center justify-between">
                        <BackButton label={`Back to project: ${group.project.name}`} href={`/project/${group.project.id}`} />
                        <div className="flex items-center gap-2">
                            <ExportButton projectId={group.project.id} />
                        </div>
                    </div>
                    <h1 className="text-3xl font-semibold mt-3">{group.name}</h1>
                    {group.description && <p className="text-sm text-gray-600 mt-1">{group.description}</p>}
                </header>

                <section className="mb-6">
                    <EntryManager
                        projectId={group.project.id}
                        groupId={group.id}
                        projectName={group.project.name}
                        groupName={group.name}
                        languages={group.project?.projectLanguages ? group.project.projectLanguages.map((pl) => pl.language) : []}
                        initialEntries={
                            group.entries.map((e) => ({ id: e.id, key: e.key, copied: e.copied ?? undefined, translations: e.translations.map((t) => ({ id: t.id, languageId: t.language.id, text: t.text })) }))
                        }
                    />
                </section>
            </div>
        </main>
    )
}
