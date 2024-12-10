import stopsData from '@/data/from_db/kl-transit_stop.json'
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(stopsData)
}
