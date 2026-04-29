import { create } from 'zustand'
import type { Platform } from '../types/platform'

export interface VideoFilters {
  account_ids: string[]
  platform: Platform | null
  min_views: number | null
  has_transcript: 'all' | 'yes' | 'no'
  order_by: 'views' | 'engagement_rate' | 'posted_at' | 'likes' | 'comments'
  order_dir: 'asc' | 'desc'
}

interface ContentIntelState {
  videoFilters: VideoFilters
  setVideoFilters: (patch: Partial<VideoFilters>) => void
  resetVideoFilters: () => void
  selectedVideoId: string | null
  setSelectedVideoId: (id: string | null) => void
}

const DEFAULT_VIDEO_FILTERS: VideoFilters = {
  account_ids: [],
  platform: null,
  min_views: null,
  has_transcript: 'all',
  order_by: 'views',
  order_dir: 'desc',
}

export const useContentIntelStore = create<ContentIntelState>((set) => ({
  videoFilters: DEFAULT_VIDEO_FILTERS,
  setVideoFilters: (patch) =>
    set((s) => ({ videoFilters: { ...s.videoFilters, ...patch } })),
  resetVideoFilters: () => set({ videoFilters: DEFAULT_VIDEO_FILTERS }),
  selectedVideoId: null,
  setSelectedVideoId: (id) => set({ selectedVideoId: id }),
}))
