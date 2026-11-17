// This route is intentionally disabled. Do not add an environment or build-time gate.
function unavailable(): Response {
  return Response.json(
    { error: { code: 'SERVER_ERROR', message: 'Authentication is temporarily unavailable.' } },
    { status: 503, headers: { 'Cache-Control': 'no-store', 'Pragma': 'no-cache', 'X-Content-Type-Options': 'nosniff' } },
  )
}

export const GET = unavailable
export const POST = unavailable
export const PUT = unavailable
export const PATCH = unavailable
export const DELETE = unavailable
export const HEAD = unavailable
export const OPTIONS = unavailable
