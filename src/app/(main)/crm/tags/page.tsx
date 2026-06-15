import { ShellHeader } from "@/features/shell/components/shell-header"
import { TagsPage } from "@/features/tags/components/tags-page"

export const dynamic = "force-dynamic"

export default function CrmTagsRoute() {
  return (
    <div className="flex h-full min-h-mobile-content flex-col md:min-h-0">
      <ShellHeader title="Tags" />
      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-mobile-nav md:p-6">
        <TagsPage />
      </div>
    </div>
  )
}
