// Endpoint que devuelve el SHA del commit deployado actualmente.
// El cliente lo polleña cada 60s para detectar deploys nuevos
// y mostrar el popup "Refrescar".

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? 'local-dev'
  const message = process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null
  const author = process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME ?? null

  return Response.json(
    {
      sha: sha.slice(0, 7),
      message,
      author,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    }
  )
}
