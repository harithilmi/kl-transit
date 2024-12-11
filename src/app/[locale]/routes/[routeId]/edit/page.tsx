import { fetchRouteData } from '@/lib/routes'
import { notFound } from 'next/navigation'
import ClientPage from './client-page'

export default async function RouteEditPage({
  params,
}: {
  params: { routeId: string }
}) {
  const routeData = await fetchRouteData(params.routeId)
  if (!routeData) return notFound()

  return <ClientPage routeData={routeData} routeId={params.routeId} />
}
