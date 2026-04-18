import type { MetricsAdapter, AdapterResult, PlatformDefinition } from '../types'

export const youtubeDefinition: PlatformDefinition = {
  platform: 'youtube',
  displayName: 'YouTube',
  description: 'Suscriptores, vistas y engagement del canal.',
  docsUrl: 'https://developers.google.com/youtube/analytics',
  credentialFields: [
    {
      key: 'apiKey',
      label: 'API Key',
      type: 'password',
      required: true,
      helpText: 'Google Cloud Console -> YouTube Data API v3',
    },
    {
      key: 'channelId',
      label: 'Channel ID',
      type: 'text',
      required: true,
      placeholder: 'UCxxxxxxxxxxxxxxxxxxxx',
    },
  ],
}

export const youtubeAdapter: MetricsAdapter = {
  platform: 'youtube',
  displayName: 'YouTube',

  async validateCredentials(credentials) {
    return Boolean(credentials.apiKey && credentials.channelId)
  },

  async fetchMetrics(credentials): Promise<AdapterResult> {
    // TODO: YouTube Data API v3
    // GET https://www.googleapis.com/youtube/v3/channels?part=statistics&id={channelId}&key={apiKey}
    if (!credentials.apiKey || !credentials.channelId) {
      return {
        platform: 'youtube',
        metrics: [],
        fetchedAt: new Date().toISOString(),
        error: 'Missing apiKey or channelId',
      }
    }

    return {
      platform: 'youtube',
      fetchedAt: new Date().toISOString(),
      metrics: [
        { key: 'subscribers', label: 'Suscriptores', value: 32100, valueText: '32.1K', change: '+5.4%', trend: 'up' },
        { key: 'views_30d', label: 'Vistas (30d)', value: 412000, valueText: '412K', change: '+11.2%', trend: 'up' },
        { key: 'engagement_rate', label: 'Engagement', value: 6.2, valueText: '6.2%', change: '+0.4%', trend: 'up' },
        { key: 'videos_published', label: 'Videos (Mes)', value: 8, valueText: '8', change: '+2', trend: 'up' },
      ],
    }
  },
}
