export type WebType = "funnel" | "lead_magnet" | "presentation" | "other"
export type WebStatus = "draft" | "published" | "archived"

export type Web = {
  id: string
  type: WebType
  slug: string
  name: string
  description: string
  status: WebStatus
  createdAt: string
  updatedAt: string
}

export type WebStep = {
  id: string
  webId: string
  slug: string
  name: string
  position: number
  isEntry: boolean
  description: string
}

export type WebWithSteps = Web & {
  steps: WebStep[]
}
