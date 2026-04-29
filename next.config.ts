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
  ],
}

export default nextConfig
