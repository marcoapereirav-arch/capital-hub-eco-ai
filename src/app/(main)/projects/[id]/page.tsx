import { ProjectDetail } from "@/features/projects/components/project-detail"

export default async function ProjectDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ProjectDetail id={id} />
}
