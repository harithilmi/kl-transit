// Types for our data
export interface Stop {
  stop_id: number
  stop_code: string
  stop_name: string
  street_name: string
  latitude: number
  longitude: number
  stop_name_old: string
  street_name_old: string
}

export interface Service {
  route_number: string
  stop_id: number
  direction: number
  zone: number
  sequence: number
}

export interface Route {
  routeId: string
  routeShortName: string
  routeLongName: string
  routeColor: string
  routeTextColor: string
}

export interface RouteStop {
  route_number: string
  stop_id: number
  stop_code: string
  direction: number
  zone: number
  sequence: number
}

export type RouteStopWithData = RouteStop & {
  stop: Stop | undefined
}

export type DirectionMap = Record<string, RouteStopWithData[]>
