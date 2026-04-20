export const FATHOM_API_BASE = 'https://api.fathom.ai/external/v1'

export const LLM_CLASSIFIER_MODEL = 'anthropic/claude-haiku-4.5'
export const LLM_TEMPERATURE = 0.1

export const FATHOM_FETCH_MAX_RETRIES = 3
export const FATHOM_FETCH_BACKOFF_MS = [2000, 8000, 30000] as const

export const TIMEZONE = 'Europe/Madrid'

export const DOCS_ROOT = 'docs'
export const DOCS_CONTACTS_DIR = 'docs/contacts'
export const DOCS_TEAM_MEETINGS_DIR = 'docs/meetings/team'
export const DOCS_INSIGHTS_DIR = 'docs/insights'
export const DOCS_COMMERCIAL_LOG = 'docs/insights/commercial-log.md'
export const DOCS_OPERATIONAL_LOG = 'docs/insights/operational-log.md'
export const DOCS_INDEX_FILE = 'docs/INDEX.md'

// Ruta blindada: jamás escribir en ella desde el pipeline.
export const DOCS_MANUAL_FORBIDDEN = 'docs/Manual_Proyecto_Capital_Hub.md'

export const MEETING_TIPOS = [
  'sales_discovery',
  'sales_closing',
  'client_onboarding',
  'client_success',
  'team_daily',
  'team_strategy',
  'partner',
  'delivery',
  'otros',
] as const

export const MEETING_SCOPES = ['external', 'internal'] as const
export const MEETING_RESULTADOS = ['won', 'lost', 'follow_up', 'info', 'na'] as const
export const FUNNEL_STAGES = [
  'lead',
  'discovery',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
] as const
