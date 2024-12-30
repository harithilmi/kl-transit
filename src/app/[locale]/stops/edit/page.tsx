import { getStops } from '@/lib/data/access'
import ClientPage from './client-page'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function StopsEditPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const stops = await getStops()

  return <ClientPage stops={stops} />
}
