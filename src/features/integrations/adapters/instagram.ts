import type { MetricsAdapter, AdapterResult, PlatformDefinition } from '../types'

export const instagramDefinition: PlatformDefinition = {
  platform: 'instagram',
  displayName: 'Instagram',
  description: 'Seguidores, engagement y alcance del perfil.',
  docsUrl: 'https://developers.facebook.com/docs/instagram-api',
  credentialFields: [
    {
      key: 'accessToken',
      label: 'Access Token',
      type: 'password',
      required: true,
      helpText: 'Instagram Graph API — Long-lived User Token',
    },
    {
      key: 'instagramAccountId',
      label: 'Instagram Business Account ID',
      type: 'text',
      required: true,
      placeholder: '17841400000000000',
    },
  ],
}

export const instagramAdapter: MetricsAdapter = {
  platform: 'instagram',
  displayName: 'Instagram',

  async validateCredentials(credentials) {
    return Boolean(credentials.accessToken && credentials.instagramAccountId)
  },

  async fetchMetrics(credentials): Promise<AdapterResult> {
    // TODO: Instagram Graph API
    // GET https://graph.facebook.com/v20.0/{ig-user-id}?fields=followers_count,media_count,insights
    if (!credentials.accessToken || !credentials.instagramAccountId) {
      return {
        platform: 'instagram',
        metrics: [],
        fetchedAt: new Date().toISOString(),
        error: 'Missing accessToken or instagramAccountId',
      }
    }

    return {
      platform: 'instagram',
      fetchedAt: new Date().toISOString(),
      metrics: [
        { key: 'followers', label: 'Seguidores', value: 89200, valueText: '89.2K', change: '+12.3%', trend: 'up' },
        { key: 'engagement_rate', label: 'Engagement', value: 4.8, valueText: '4.8%', change: '+0.2%', trend: 'up' },
        { key: 'reach_30d', label: 'Alcance (30d)', value: 182000, valueText: '182K', change: '+22.1%', trend: 'up' },
        { key: 'posts_published', label: 'Posts (Mes)', value: 24, valueText: '24', change: '+6', trend: 'up' },
      ],
    }
  },
}
