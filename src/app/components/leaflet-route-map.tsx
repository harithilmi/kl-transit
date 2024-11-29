'use client'

import dynamic from 'next/dynamic'
import type { MapComponentProps } from './map-component'

const Map = dynamic(() => import('./map-component'), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
})

const LeafletRouteMap = (props: MapComponentProps) => {
  return <Map {...props} />
}

export default LeafletRouteMap
