import type { MetadataRoute } from "next"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://os.capitalhubapp.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/mifge", "/legal"],
        disallow: ["/api/", "/dashboard/", "/webs/", "/tasks/", "/(main)/", "/(auth)/"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  }
}
