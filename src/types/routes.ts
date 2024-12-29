export interface Route {
  routeId: number
  routeShortName: string
  routeLongName: string
  operatorId: string
  networkId: string
  routeType: number
  routeColor: string
  routeTextColor: string
  trips: Trip[]
}

export interface Trip {
  tripId: number
  routeId: number
  headsign: string
  direction: number
  isActive: boolean
  fullShape: string
	stopDetails: StopDetail[]
	stopPairSegments: StopPairSegment[]
}

export interface StopDetail {
  stopId: number
  fareZone: number
}

export interface StopPairSegment {
  fromStopId: number
  toStopId: number
  distance: number | null
  segmentShape: string | null
}

export interface Stop {
  stop_id: number
  stop_name: string
  stop_code?: string
  street_name?: string
  latitude: number
  longitude: number
  rapid_stop_id?: number
  mrt_stop_id?: number
  old_stop_id: string
}

//Not used anymore
export interface Service {  
  stop_id: number
  route_number: string
  sequence: number
  direction: 1 | 2
  zone: 1 | 2 | 3
}

//Not used anymore
export interface ServiceWithStop extends Service {
  stop: Stop
}

//Not used anymore
export interface Shape {
  route_number: string
  direction: 1 | 2
  coordinates: [latitude: number, longitude: number][]
}

//Not used anymore
export interface RouteDetails {
  route: Route
  services: ServiceWithStop[]
  shape: {
    direction1: Shape
    direction2: Shape
  }
}

//Not used anymore
export interface SelectedStop extends Stop {
  route_number: string[]
}

export const RouteTypes = {
  utama: 'Rapid Bus (Trunk)',
  tempatan: 'Rapid Bus (Local)',
  nadiputra: 'Nadi Putra',
  bet: 'Express/Limited Stop Bus (BET)',
  drt: 'Demand Responsive Transport (DRT)',
  mbpj: 'PJ City Bus (MBPJ)',
  mbsa: 'Smart Selangor (MBSA)',
  mpaj: 'Smart Selangor (MPAJ)',
  mpkl: 'Smart Selangor (MPKL)',
  mbsj: 'Smart Selangor (MBSJ)',
  mbdk: 'Smart Selangor (MBDK)',
  mpkj: 'Smart Selangor (MPKJ)',
  mps: 'Smart Selangor (MPS)',
  lrt_feeder: 'LRT Feeder',
  mrt_feeder: 'MRT Feeder',
  shuttle: 'Event Shuttle',
  batu_caves_shuttle: 'Batu Caves Shuttle',
  mall_shuttle: 'Mall Shuttle',
  merdeka_shuttle: 'Merdeka Express',
  gokl: 'GOKL',
  unknown: 'Unknown',
} as const

export type RouteType = keyof typeof RouteTypes

//Not used anymore
export interface RouteMapBaseProps {
  services: ServiceWithStop[]
  shape: {
    direction1: Shape
    direction2: Shape
  }
  route: Route
}
