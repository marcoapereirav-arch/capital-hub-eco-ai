import type { MetricsAdapter, AdapterResult, PlatformDefinition } from '../types'

export const ghlDefinition: PlatformDefinition = {
  platform: 'ghl',
  displayName: 'GoHighLevel',
  description: 'CRM, pipeline y leads desde GHL.',
  docsUrl: 'https://highlevel.stoplight.io/docs/integrations/',
  credentialFields: [
    {
      key: 'apiKey',
      label: 'API Key',
      type: 'password',
      required: true,
      helpText: 'Settings -> Business Profile -> API Key',
    },
    {
      key: 'locationId',
      label: 'Location ID',
      type: 'text',
      required: true,
      placeholder: 'loc_xxxxxxxxxxxx',
    },
  ],
}

export const ghlAdapter: MetricsAdapter = {
  platform: 'ghl',
  displayName: 'GoHighLevel',

  async validateCredentials(credentials) {
    return Boolean(credentials.apiKey && credentials.locationId)
  },

  async fetchMetrics(credentials): Promise<AdapterResult> {
    // TODO: Reemplazar por llamadas reales a la API de GHL cuando se tengan credenciales.
    // Endpoint referencia: GET https://services.leadconnectorhq.com/contacts/?locationId=...
    // Auth: Authorization: Bearer {apiKey}
    if (!credentials.apiKey || !credentials.locationId) {
      return {
        platform: 'ghl',
        metrics: [],
        fetchedAt: new Date().toISOString(),
        error: 'Missing apiKey or locationId',
      }
    }

    return {
      platform: 'ghl',
      fetchedAt: new Date().toISOString(),
      metrics: [
        { key: 'leads_active', label: 'Leads Activos', value: 1284, valueText: '1,284', change: '+8.1%', trend: 'up' },
        { key: 'leads_new_7d', label: 'Nuevos Leads (7d)', value: 142, valueText: '142', change: '+12.0%', trend: 'up' },
        { key: 'contacts_total', label: 'Contactos Totales', value: 4820, valueText: '4.8K', change: '+3.4%', trend: 'up' },
        { key: 'pipeline_value', label: 'Valor Pipeline', value: 48200, valueText: '€48,200', change: '+15.2%', trend: 'up' },
      ],
    }
  },
}
