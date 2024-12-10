import servicesData from '@/data/from_db/kl-transit_service.json'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const stopId = searchParams.get('stopId')

  if (stopId) {
    const filteredServices = servicesData.filter(
      (service: any) => service.stop_id === stopId,
    )
    return NextResponse.json(filteredServices)
  }

  return NextResponse.json(servicesData)
}
