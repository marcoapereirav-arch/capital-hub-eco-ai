import type {
  MetricsAdapter,
  AdapterResult,
  PlatformDefinition,
  MetricValue,
  ManychatRawTag,
  ManychatRawCustomField,
} from '../types'

export const manychatDefinition: PlatformDefinition = {
  platform: 'manychat',
  displayName: 'ManyChat',
  description: 'DMs de Instagram via ManyChat: suscriptores, tags, flows.',
  docsUrl: 'https://api.manychat.com/swagger',
  credentialFields: [
    {
      key: 'apiKey',
      label: 'ManyChat API Key',
      type: 'password',
      required: true,
      helpText: 'Settings -> API -> formato <page_id>:<hash>',
    },
  ],
}

const MC_BASE = 'https://api.manychat.com'

async function mcFetch(path: string, token: string) {
  const res = await fetch(`${MC_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`ManyChat ${path} -> ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = await res.json()
  if (json?.status !== 'success') {
    throw new Error(`ManyChat ${path} -> status=${json?.status}: ${JSON.stringify(json).slice(0, 200)}`)
  }
  return json.data
}

type RawTag = { id: number | string; name: string }
type RawCustomField = {
  id: number | string
  name: string
  type?: string
  description?: string
}
type RawPageInfo = {
  id: number | string
  name?: string
  category?: string
  avatar_link?: string
  username?: string
  about?: string
  description?: string
  is_pro?: boolean
  timezone?: string
  fb_channel?: { is_active?: boolean }
  ig_channel?: {
    is_active?: boolean
    id?: string | number
    username?: string
    name?: string
  }
}

function fmt(n: number): string {
  return new Intl.NumberFormat('es-ES').format(n)
}

export const manychatAdapter: MetricsAdapter = {
  platform: 'manychat',
  displayName: 'ManyChat',

  async validateCredentials(credentials) {
    return Boolean(credentials.apiKey)
  },

  async fetchMetrics(credentials): Promise<AdapterResult> {
    const apiKey = credentials.apiKey as string | undefined

    if (!apiKey) {
      return {
        platform: 'manychat',
        metrics: [],
        fetchedAt: new Date().toISOString(),
        error: 'Missing apiKey',
      }
    }

    try {
      const [pageInfoRaw, tagsRaw, fieldsRaw] = await Promise.all([
        mcFetch('/fb/page/getInfo', apiKey) as Promise<RawPageInfo>,
        mcFetch('/fb/page/getTags', apiKey) as Promise<RawTag[]>,
        mcFetch('/fb/page/getCustomFields', apiKey) as Promise<RawCustomField[]>,
      ])

      const tags: ManychatRawTag[] = (tagsRaw ?? []).map((t) => ({
        id: String(t.id),
        name: t.name,
      }))

      const customFields: ManychatRawCustomField[] = (fieldsRaw ?? []).map((f) => ({
        id: String(f.id),
        name: f.name,
        type: f.type ?? null,
        description: f.description ?? null,
      }))

      const igActive = Boolean(pageInfoRaw?.ig_channel?.is_active)
      const fbActive = Boolean(pageInfoRaw?.fb_channel?.is_active)

      const metrics: MetricValue[] = [
        {
          key: 'tags_total',
          label: 'Tags definidos',
          value: tags.length,
          valueText: fmt(tags.length),
        },
        {
          key: 'custom_fields_total',
          label: 'Custom Fields',
          value: customFields.length,
          valueText: fmt(customFields.length),
        },
        {
          key: 'ig_channel_active',
          label: 'Canal Instagram',
          value: igActive ? 1 : 0,
          valueText: igActive ? 'Activo' : 'Inactivo',
        },
        {
          key: 'fb_channel_active',
          label: 'Canal Facebook',
          value: fbActive ? 1 : 0,
          valueText: fbActive ? 'Activo' : 'Inactivo',
        },
      ]

      return {
        platform: 'manychat',
        fetchedAt: new Date().toISOString(),
        metrics,
        rawData: {
          manychatTags: tags,
          manychatCustomFields: customFields,
        },
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      return {
        platform: 'manychat',
        metrics: [],
        fetchedAt: new Date().toISOString(),
        error: msg,
      }
    }
  },
}
