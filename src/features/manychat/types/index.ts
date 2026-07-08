export interface ManychatSubscriber {
  id: string
  page_id: string | null
  name: string | null
  first_name: string | null
  last_name: string | null
  gender: string | null
  profile_pic: string | null
  locale: string | null
  language: string | null
  timezone: string | null
  ig_username: string | null
  ig_id: string | null
  last_input_text: string | null
  last_interaction_at: string | null
  last_seen_at: string | null
  subscribed_at: string | null
  status: string | null
  optin_fb: boolean
  optin_email: boolean
  optin_sms: boolean
  optin_whatsapp: boolean
  tags: string[]
  custom_fields: Record<string, unknown>
  synced_at: string
}

export interface ManychatTag {
  id: string
  name: string
  synced_at: string
}

export interface ManychatCustomField {
  id: string
  name: string
  type: string | null
  description: string | null
  synced_at: string
}

export interface ManychatEvent {
  id: string
  subscriber_id: string | null
  event_type: string
  payload: Record<string, unknown>
  received_at: string
}

export interface ManychatOverview {
  totalSubscribers: number
  activeStatus: number
  tagsCount: number
  customFieldsCount: number
  topTags: Array<{ name: string; count: number }>
  recentEvents: ManychatEvent[]
  lastSync: string | null
  igChannelActive: boolean
  syncError: string | null
}

export interface InboxMessage {
  subscriberId: string | null
  subscriberName: string | null
  igUsername: string | null
  profilePic: string | null
  text: string | null
  receivedAt: string
}
