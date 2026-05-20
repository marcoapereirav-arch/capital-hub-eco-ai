import type { MetadataRoute } from "next"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ecoai.capitalhubapp.com"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${APP_URL}/mifge`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${APP_URL}/mifge/agenda`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${APP_URL}/legal/privacidad`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/legal/terminos`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/legal/cookies`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ]
}
