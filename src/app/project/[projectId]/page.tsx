import prisma from '../../../lib/prisma'
import Link from 'next/link'
import BackButton from '../../../components/BackButton'
import ExportButton from '../../../components/ExportButton'
import LanguagesManager from '../../../components/LanguagesManager'
import GroupsManager from '../../../components/GroupsManager'

type Props = {
    params: { projectId: string }
}

// Minimal local types for clarity in this file
type Group = {
    id: number
    name: string
    description?: string | null
    entries: {
        id: number
        key: string
        comment?: string | null
        copied: boolean
        translations: {
            id: number
            languageId: number
            text: string
        }[]
    }[]
}

type ProjectWithRelations = {
    id: number
    name: string
    description?: string | null
    projectLanguages: { language: { code: string, id: number, name: string } }[]
    groups: Group[]
}

export default async function ProjectPage({ params }: Props) {
    const resolved = await params
    const id = Number(resolved?.projectId)
    if (Number.isNaN(id)) {
        return (
            <main className="min-h-screen p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-medium">Invalid project id</h1>
                    <p className="mt-4">
                        <Link href="/" className="text-indigo-600 hover:underline">
                            Back to projects
                        </Link>
                    </p>
                </div>
            </main>
        )
    }

    const project = (await prisma.project.findUnique({
        where: { id },
        include: {
            projectLanguages: { include: { language: true } },
            groups: { include: { entries: { include: { translations: true } } } },
        },
    })) as ProjectWithRelations | null

    if (!project) {
        return (
            <main className="min-h-screen p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-medium">Project not found</h1>
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
            <div className="max-w-4xl mx-auto">
                <header className="mb-4">
                    <div className="flex items-center justify-between">
                        <BackButton label="Back to projects" href='/' />
                        <div className="flex items-center gap-2">
                            <ExportButton projectId={project.id} />
                        </div>
                    </div>
                    <h1 className="text-3xl font-semibold mt-3">{project.name}</h1>
                </header>

                <LanguagesManager
                    projectId={project.id}
                    initialLanguages={project.projectLanguages.map((pl) => ({ id: pl.language.code ? pl.language.id as number : 0, code: pl.language.code, name: pl.language.name }))}
                />

                {/* compute whether any entry in a group is missing translations for project languages */}
                {(() => {
                    const languageIds = project.projectLanguages.map((pl) => pl.language.id as number)
                    const groupsWithFlag = project.groups.map((g) => ({
                        id: g.id,
                        name: g.name,
                        description: g.description,
                        entriesCount: g.entries.length,
                        hasUntranslated: g.entries.some((entry) =>
                            languageIds.some((lid) => !entry.translations?.some((t) => t.languageId === lid))
                        ),
                    }))

                    return <GroupsManager projectId={project.id} initialGroups={groupsWithFlag} />
                })()}
            </div>
        </main>
    )
}

// Force this page to be rendered at request-time so DB queries are executed by the running server
export const dynamic = 'force-dynamic'
