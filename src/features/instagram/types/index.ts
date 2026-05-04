export interface IgAccount {
  id: string
  handle: string
  display_name: string | null
  video_count: number
  last_synced_at: string | null
}

export interface IgPost {
  id: string
  external_id: string
  url: string
  caption: string | null
  posted_at: string | null
  duration_s: number | null
  views: number
  likes: number
  comments: number
  engagement_rate: number | null
  is_reel: boolean
  thumbnail_url: string | null
}

export interface IgLiveSnapshot {
  followerCount: number | null
  reach30d: number
  views30d: number
  profileViews30d: number
  accountsEngaged30d: number
  totalInteractions30d: number
  likes30d: number
  comments30d: number
  shares30d: number
  saves30d: number
}

export interface IgDemographicsSnapshot {
  byCountry: Array<{ key: string; value: number }>
  byCity: Array<{ key: string; value: number }>
  byAge: Array<{ key: string; value: number }>
  byGender: Array<{ key: string; value: number }>
}

export interface IgOverview {
  account: IgAccount | null
  totalPosts: number
  totalReels: number
  totalViews: number
  totalLikes: number
  totalComments: number
  avgEngagement: number
  posts7d: number
  posts30d: number
  topReel: IgPost | null
  recentPosts: IgPost[]
  metaGraphReady: boolean
  live: IgLiveSnapshot | null
  demographics: IgDemographicsSnapshot | null
}

export interface ScheduledPost {
  id: string
  user_id: string
  scheduled_for: string
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'
  media_type: 'reel' | 'image' | 'carousel' | 'story'
  caption: string | null
  media_url: string | null
  thumbnail_url: string | null
  ig_media_id: string | null
  script_id: string | null
  publish_error: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}
