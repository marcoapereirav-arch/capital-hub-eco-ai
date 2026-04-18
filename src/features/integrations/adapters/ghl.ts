import type { MetricsAdapter, AdapterResult, PlatformDefinition, MetricValue } from '../types'

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
    throw new Error(`GHL ${path} → ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json()
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
      const [contactsRes, leadsRes, recentRes, openOppsRes, wonOppsRes] = await Promise.all([
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
        ghlFetch(`/opportunities/search?location_id=${locationId}&status=open&limit=100`, apiKey),
        ghlFetch(`/opportunities/search?location_id=${locationId}&status=won&limit=100`, apiKey),
      ])

      const contactsTotal: number = contactsRes?.meta?.total ?? 0
      const leadsActive: number = leadsRes?.total ?? 0
      const leadsNew7d: number = recentRes?.total ?? 0

      type Opp = { monetaryValue?: number | null }
      const openOpps: Opp[] = openOppsRes?.opportunities ?? []
      const wonOpps: Opp[] = wonOppsRes?.opportunities ?? []
      const sumValue = (arr: Opp[]) =>
        arr.reduce((s, o) => s + (Number(o.monetaryValue) || 0), 0)
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
      ]

      return {
        platform: 'ghl',
        fetchedAt: new Date().toISOString(),
        metrics,
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
