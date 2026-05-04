"use client"

import { ShellHeader } from "@/features/shell/components/shell-header"
import { MifgeKanban } from "./mifge-kanban"

export function CrmPage() {
  return (
    <>
      <ShellHeader title="CRM" />
      <MifgeKanban />
    </>
  )
}
