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
    'ffprobe-static',
    'ffmpeg-static',
    '@ffmpeg-installer/ffmpeg',
  ],
}

export default nextConfig
