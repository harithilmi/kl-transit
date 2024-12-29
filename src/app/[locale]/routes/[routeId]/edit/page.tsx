import { notFound } from 'next/navigation'
import routes from '@/data/v2/routes.json'
import dynamic from 'next/dynamic'
import LoadingSpinner from '@/components/layout/loading-spinner'

const RouteEditClient = dynamic(() => import('./client-page'), {
  loading: () => <LoadingSpinner />,
})

interface Props {
  params: Promise<{ routeId: string; locale: string }>
}

export default async function RouteEditPage({ params: paramsPromise }: Props) {
  const params = await paramsPromise
  const routeId = parseInt(params.routeId)
  const routeData = routes.find((r) => r.routeId === routeId)

  if (!routeData) {
    notFound()
  }

  return <RouteEditClient routeData={routeData} />
}
