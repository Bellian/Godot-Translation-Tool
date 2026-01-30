import prisma from '../../../../lib/prisma'
import Link from 'next/link'
import BackButton from '../../../../components/BackButton'
import DialogsManager from '../../../../components/DialogsManager'

type Props = {
    params: { projectId: string }
}

export default async function ProjectDialogsPage({ params }: Props) {
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

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            dialogs: { orderBy: { createdAt: 'asc' } },
        },
    })

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
                    <BackButton label={`Back to ${project.name}`} href={`/project/${project.id}`} />
                    <h1 className="text-3xl font-semibold mt-3">Dialogs - {project.name}</h1>
                    {project.description && (
                        <p className="text-gray-600 mt-1">{project.description}</p>
                    )}
                </header>

                <DialogsManager
                    projectId={project.id}
                    initialDialogs={project.dialogs}
                />
            </div>
        </main>
    )
}

export const dynamic = 'force-dynamic'
