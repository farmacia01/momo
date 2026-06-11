import { caktoFetch } from '@/lib/cakto'
import { createRouteClient } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL
  if (!user || !ADMIN_EMAIL || user.email !== ADMIN_EMAIL) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = searchParams.get('page') || '1'
  const status = searchParams.get('status') || ''

  const params = new URLSearchParams({ page, limit: '20' })
  if (status) params.set('status', status)

  const data = await caktoFetch(
    `/public_api/orders/?${params.toString()}`
  )
  return Response.json(data)
}
