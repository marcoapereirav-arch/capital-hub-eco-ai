import type {
  MetricsAdapter,
  AdapterResult,
  PlatformDefinition,
  MetricValue,
  GhlRawOpportunity,
  GhlRawPipeline,
  GhlRawContact,
} from '../types'

export const ghlDefinition: PlatformDefinition = {
  platform: 'ghl',
  displayName: 'GoHighLevel',
  description: 'CRM, pipeline y leads desde GHL.',
  docsUrl: 'https://highlevel.stoplight.io/docs/integrations/',
  credentialFields: [
    {
      key: 'apiKey',
      label: 'API Key / Private Integration Token',
      type: 'password',
      required: true,
      helpText: 'Settings -> Integrations -> Private Integrations (token empieza por pit-)',
    },
    {
      key: 'locationId',
      label: 'Location ID',
      type: 'text',
      required: true,
      placeholder: 'fPSTvVgtLrLaVpNFx8ix',
      helpText: 'Lo ves en la URL de GHL: /v2/location/{locationId}/dashboard',
    },
  ],
}

const GHL_BASE = 'https://services.leadconnectorhq.com'
const GHL_VERSION = '2021-07-28'
const OPP_PAGE_LIMIT = 100
const MAX_OPPS_PER_STATUS = 1000

function formatEUR(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES').format(value)
}

async function ghlFetch(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${GHL_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Version: GHL_VERSION,
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`GHL ${path} -> ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json()
}

type OppRaw = {
  id: string
  pipelineId?: string | null
  pipelineStageId?: string | null
  contactId?: string | null
  name?: string | null
  status?: string | null
  monetaryValue?: number | null
  source?: string | null
  tags?: string[] | null
  createdAt?: string | null
  updatedAt?: string | null
}

function mapOpp(raw: OppRaw): GhlRawOpportunity {
  return {
    id: raw.id,
    pipeline_id: raw.pipelineId ?? null,
    pipeline_stage_id: raw.pipelineStageId ?? null,
    contact_id: raw.contactId ?? null,
    name: raw.name ?? null,
    status: raw.status ?? null,
    monetary_value: Number(raw.monetaryValue) || 0,
    source: raw.source ?? null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    opp_created_at: raw.createdAt ?? null,
    opp_updated_at: raw.updatedAt ?? null,
  }
}

async function fetchAllOppsForStatus(
  apiKey: string,
  locationId: string,
  status: 'open' | 'won' | 'lost' | 'abandoned'
): Promise<GhlRawOpportunity[]> {
  const collected: GhlRawOpportunity[] = []
  let startAfter: string | undefined
  let startAfterId: string | undefined

  while (collected.length < MAX_OPPS_PER_STATUS) {
    const params = new URLSearchParams({
      location_id: locationId,
      status,
      limit: String(OPP_PAGE_LIMIT),
    })
    if (startAfter) params.set('startAfter', startAfter)
    if (startAfterId) params.set('startAfterId', startAfterId)

    const res = await ghlFetch(`/opportunities/search?${params.toString()}`, apiKey)
    const opps: OppRaw[] = res?.opportunities ?? []
    if (opps.length === 0) break

    collected.push(...opps.map(mapOpp))

    if (opps.length < OPP_PAGE_LIMIT) break

    const last = opps[opps.length - 1]
    startAfter = last.updatedAt ?? last.createdAt ?? undefined
    startAfterId = last.id
    if (!startAfter) break
  }

  return collected
}

type PipelineRaw = {
  id: string
  name: string
  stages?: Array<{ id: string; name: string; position?: number }>
}

async function fetchPipelines(apiKey: string, locationId: string): Promise<GhlRawPipeline[]> {
  try {
    const res = await ghlFetch(
      `/opportunities/pipelines?locationId=${locationId}`,
      apiKey
    )
    const pipelines: PipelineRaw[] = res?.pipelines ?? []
    return pipelines.map((p) => ({
      id: p.id,
      name: p.name,
      stages: p.stages ?? [],
    }))
  } catch {
    return []
  }
}

type ContactRaw = {
  id: string
  type?: string | null
  tags?: string[] | null
  source?: string | null
  dateAdded?: string | null
}

async function fetchLeadContactsSample(
  apiKey: string,
  locationId: string
): Promise<GhlRawContact[]> {
  // Para leads no paginamos todos — solo muestra reciente (ultimos 500)
  try {
    const res = await ghlFetch(`/contacts/search`, apiKey, {
      method: 'POST',
      body: JSON.stringify({
        locationId,
        pageLimit: 500,
      }),
    })
    const contacts: ContactRaw[] = res?.contacts ?? []
    return contacts.map((c) => ({
      id: c.id,
      type: c.type ?? null,
      tags: Array.isArray(c.tags) ? c.tags : [],
      source: c.source ?? null,
      contact_created_at: c.dateAdded ?? null,
    }))
  } catch {
    return []
  }
}

export const ghlAdapter: MetricsAdapter = {
  platform: 'ghl',
  displayName: 'GoHighLevel',

  async validateCredentials(credentials) {
    return Boolean(credentials.apiKey && credentials.locationId)
  },

  async fetchMetrics(credentials): Promise<AdapterResult> {
    const apiKey = credentials.apiKey as string | undefined
    const locationId = credentials.locationId as string | undefined

    if (!apiKey || !locationId) {
      return {
        platform: 'ghl',
        metrics: [],
        fetchedAt: new Date().toISOString(),
        error: 'Missing apiKey or locationId',
      }
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    try {
      const [
        contactsRes,
        leadsRes,
        recentRes,
        openOpps,
        wonOpps,
        lostOpps,
        pipelines,
        contactsSample,
      ] = await Promise.all([
        ghlFetch(`/contacts/?locationId=${locationId}&limit=1`, apiKey),
        ghlFetch(`/contacts/search`, apiKey, {
          method: 'POST',
          body: JSON.stringify({
            locationId,
            pageLimit: 1,
            filters: [{ field: 'type', operator: 'eq', value: 'lead' }],
          }),
        }),
        ghlFetch(`/contacts/search`, apiKey, {
          method: 'POST',
          body: JSON.stringify({
            locationId,
            pageLimit: 1,
            filters: [{ field: 'dateAdded', operator: 'range', value: { gte: sevenDaysAgo } }],
          }),
        }),
        fetchAllOppsForStatus(apiKey, locationId, 'open'),
        fetchAllOppsForStatus(apiKey, locationId, 'won'),
        fetchAllOppsForStatus(apiKey, locationId, 'lost'),
        fetchPipelines(apiKey, locationId),
        fetchLeadContactsSample(apiKey, locationId),
      ])

      const contactsTotal: number = contactsRes?.meta?.total ?? 0
      const leadsActive: number = leadsRes?.total ?? 0
      const leadsNew7d: number = recentRes?.total ?? 0

      const sumValue = (arr: GhlRawOpportunity[]) =>
        arr.reduce((s, o) => s + (Number(o.monetary_value) || 0), 0)
      const pipelineValue = sumValue(openOpps)
      const wonValue = sumValue(wonOpps)

      const metrics: MetricValue[] = [
        {
          key: 'leads_active',
          label: 'Leads Activos',
          value: leadsActive,
          valueText: formatNumber(leadsActive),
        },
        {
          key: 'leads_new_7d',
          label: 'Nuevos Leads (7d)',
          value: leadsNew7d,
          valueText: formatNumber(leadsNew7d),
        },
        {
          key: 'contacts_total',
          label: 'Contactos Totales',
          value: contactsTotal,
          valueText: formatNumber(contactsTotal),
        },
        {
          key: 'pipeline_value',
          label: 'Pipeline Abierto',
          value: pipelineValue,
          valueText: formatEUR(pipelineValue),
        },
        {
          key: 'open_opps_count',
          label: 'Oportunidades Abiertas',
          value: openOpps.length,
          valueText: formatNumber(openOpps.length),
        },
        {
          key: 'won_count',
          label: 'Oportunidades Ganadas',
          value: wonOpps.length,
          valueText: formatNumber(wonOpps.length),
        },
        {
          key: 'won_value',
          label: 'Valor Ganado',
          value: wonValue,
          valueText: formatEUR(wonValue),
        },
        {
          key: 'pipelines_count',
          label: 'Pipelines Activos',
          value: pipelines.length,
          valueText: formatNumber(pipelines.length),
        },
      ]

      return {
        platform: 'ghl',
        fetchedAt: new Date().toISOString(),
        metrics,
        rawData: {
          ghlPipelines: pipelines,
          ghlOpportunities: [...openOpps, ...wonOpps, ...lostOpps],
          ghlContacts: contactsSample,
        },
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      return {
        platform: 'ghl',
        metrics: [],
        fetchedAt: new Date().toISOString(),
        error: msg,
      }
    }
  },
}
