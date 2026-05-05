import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Activa el MCP server en /_next/mcp (Next.js 16+)
  experimental: {
    mcpServer: true,
  },

  // Paquetes server-only que NO deben bundlearse en cada API route.
  // Vercel los carga directo desde node_modules en runtime → bundles mucho mas pequenos
  // (importante para no exceder los 50MB de Edge Functions).
  serverExternalPackages: [
    'ai',
    '@openrouter/ai-sdk-provider',
    'replicate',
    'sharp',
    'web-push',
    'gray-matter',
    'tus-js-client',
    // Remotion: bundler/renderer + binarios compositor platform-specific.
    // Sin esto Next.js intenta bundlear .node binaries para todas las arch.
    '@remotion/bundler',
    '@remotion/renderer',
    'remotion',
    '@ffprobe-installer/ffprobe',
    '@ffmpeg-installer/ffmpeg',
    'fluent-ffmpeg',
  ],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
