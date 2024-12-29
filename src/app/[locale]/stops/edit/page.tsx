import { getStops } from '@/lib/data/access'
import ClientPage from './client-page'

export default async function StopsEditPage() {
  const stops = await getStops()

  return <ClientPage stops={stops} />
}
