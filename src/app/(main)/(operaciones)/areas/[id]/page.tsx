import { AreaDetail } from "@/features/areas/components/area-detail"

export default async function AreaDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AreaDetail areaId={id} />
}
