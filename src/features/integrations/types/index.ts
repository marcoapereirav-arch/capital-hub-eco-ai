export type Platform = 'ghl' | 'meta_ads' | 'youtube' | 'instagram'

export type ConnectionStatus = 'connected' | 'disconnected' | 'error'

export interface ApiConnection {
  id: string
  user_id: string
  platform: Platform
  status: ConnectionStatus
  credentials: Record<string, unknown> | null
  last_sync_at: string | null
  last_error: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type MetricValue = {
  key: string
  label: string
  value: number | null
  valueText: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
}

export interface GhlRawOpportunity {
  id: string
  pipeline_id: string | null
  pipeline_stage_id: string | null
  contact_id: string | null
  name: string | null
  status: string | null
  monetary_value: number
  source: string | null
  tags: string[]
  opp_created_at: string | null
  opp_updated_at: string | null
}

export interface GhlRawPipeline {
  id: string
  name: string
  stages: Array<{ id: string; name: string; position?: number }>
}

export interface GhlRawContact {
  id: string
  type: string | null
  tags: string[]
  source: string | null
  contact_created_at: string | null
}

export interface AdapterRawData {
  ghlPipelines?: GhlRawPipeline[]
  ghlOpportunities?: GhlRawOpportunity[]
  ghlContacts?: GhlRawContact[]
}

export interface AdapterResult {
  platform: Platform
  metrics: MetricValue[]
  fetchedAt: string
  error?: string
  rawData?: AdapterRawData
}

export interface MetricsAdapter {
  platform: Platform
  displayName: string

  validateCredentials(credentials: Record<string, unknown>): Promise<boolean>

  fetchMetrics(
    credentials: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<AdapterResult>
}

export interface PlatformDefinition {
  platform: Platform
  displayName: string
  description: string
  docsUrl: string
  credentialFields: CredentialField[]
}

export interface CredentialField {
  key: string
  label: string
  type: 'text' | 'password' | 'textarea'
  placeholder?: string
  required: boolean
  helpText?: string
}
