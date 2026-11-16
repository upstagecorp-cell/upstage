const baseUrl = process.env.SUPABASE_URL?.trim()
const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
if (!baseUrl || !secretKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')

const response = await fetch(`${baseUrl.replace(/\/$/, '')}/storage/v1/bucket`, {
  method: 'POST',
  headers: {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    id: 'nexora-private',
    name: 'nexora-private',
    public: false,
    file_size_limit: 20 * 1024 * 1024,
    allowed_mime_types: ['image/png', 'image/jpeg', 'video/mp4'],
  }),
})

if (response.ok || response.status === 409) {
  console.log(JSON.stringify({ configured: true, bucket: 'nexora-private', alreadyExisted: response.status === 409 }))
  await response.body?.cancel()
  process.exit(0)
}
const message = await response.text()
console.error(`Supabase Storage setup failed with HTTP ${response.status}: ${message.slice(0, 300)}`)
process.exit(1)
