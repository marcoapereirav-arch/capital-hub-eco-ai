import type { MetricsAdapter, AdapterResult, PlatformDefinition } from '../types'

export const metaAdsDefinition: PlatformDefinition = {
  platform: 'meta_ads',
  displayName: 'Meta Ads',
  description: 'Campanas, gasto y ROAS de Meta Ads Manager.',
  docsUrl: 'https://developers.facebook.com/docs/marketing-api/',
  credentialFields: [
    {
      key: 'accessToken',
      label: 'Access Token',
      type: 'password',
      required: true,
      helpText: 'System User token con permiso ads_read',
    },
    {
      key: 'adAccountId',
      label: 'Ad Account ID',
      type: 'text',
      required: true,
      placeholder: 'act_1234567890',
    },
  ],
}

export const metaAdsAdapter: MetricsAdapter = {
  platform: 'meta_ads',
  displayName: 'Meta Ads',

  async validateCredentials(credentials) {
    return Boolean(credentials.accessToken && credentials.adAccountId)
  },

  async fetchMetrics(credentials): Promise<AdapterResult> {
    // TODO: Reemplazar por llamadas a Marketing API.
    // GET https://graph.facebook.com/v20.0/{ad_account_id}/insights?fields=spend,impressions,clicks,actions
    if (!credentials.accessToken || !credentials.adAccountId) {
      return {
        platform: 'meta_ads',
        metrics: [],
        fetchedAt: new Date().toISOString(),
        error: 'Missing accessToken or adAccountId',
      }
    }

    return {
      platform: 'meta_ads',
      fetchedAt: new Date().toISOString(),
      metrics: [
        { key: 'ad_spend', label: 'Ad Spend (Mes)', value: 4320, valueText: '€4,320', change: '-3.2%', trend: 'down' },
        { key: 'roas', label: 'ROAS', value: 4.2, valueText: '4.2x', change: '+0.3x', trend: 'up' },
        { key: 'impressions', label: 'Impresiones', value: 248000, valueText: '248K', change: '+18.1%', trend: 'up' },
        { key: 'ctr', label: 'CTR', value: 2.4, valueText: '2.4%', change: '+0.2%', trend: 'up' },
      ],
    }
  },
}
