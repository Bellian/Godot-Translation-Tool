import prisma from "../lib/prisma";
import ProjectsList from "../components/ProjectsList";

export default async function Home() {
  const projectCount = await prisma.project.count();
  const projects = await prisma.project.findMany({
    include: {
      projectLanguages: { include: { language: true } },
      groups: true,
    },
    orderBy: { name: 'asc' },
  });

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <ProjectsList projects={projects} />
      </div>
    </main>
  );
}

// Ensure this page is rendered at request time so database queries run on the running server
export const dynamic = 'force-dynamic'