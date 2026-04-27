// LLMs (via OpenRouter, reuso stack existente)
export const LLM_ANALYZER_MODEL = 'anthropic/claude-haiku-4.5'
export const LLM_CROSS_QUERY_MODEL = 'anthropic/claude-sonnet-4.6'
export const LLM_SCRIPT_GENERATOR_MODEL = 'anthropic/claude-sonnet-4.6'
export const LLM_TEMPERATURE_ANALYZE = 0.1
export const LLM_TEMPERATURE_GENERATE = 0.7

// Gemini (transcripción + embeddings)
export const GEMINI_TRANSCRIBE_MODEL = 'gemini-2.5-flash'
export const GEMINI_EMBED_MODEL = 'gemini-embedding-001'
export const EMBEDDING_DIMENSIONS = 768

// Apify
export const APIFY_IG_ACTOR = 'apify~instagram-scraper'
export const APIFY_FETCH_MAX_RETRIES = 3
export const APIFY_FETCH_BACKOFF_MS = [2000, 8000, 30000] as const
export const APIFY_DEFAULT_TIMEOUT_MS = 180_000

// Pickers / defaults UI
export const DEFAULT_TRANSCRIBE_TOP_X = 20
export const DEFAULT_CROSS_QUERY_MAX_VIDEOS = 30
export const DEFAULT_SEMANTIC_MATCH_THRESHOLD = 0.5

// Brand context paths (leídos frescos en cada generación)
export const BRAND_PLAYBOOK_PATH = 'docs/brand-playbook.md'
export const AVATAR_PATH = 'docs/avatar-andres.md'

// Rate / cost limits (soft)
export const MAX_VIDEOS_PER_SYNC = 500
export const MAX_TRANSCRIPT_CHARS = 20_000
