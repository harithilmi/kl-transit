// Types for our data
export interface Stop {
  stop_id: string
  stop_code: string
  stop_name: string
  street_name: string
  latitude: string
  longitude: string
  stop_name_old: string
  street_name_old: string
}

export interface Service {
  route_number: string
  stop_id: string
  direction: string
  zone: string
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
  stop_id: string
  stop_code: string
  direction: string
  zone: string
  sequence: number
}

export type RouteStopWithData = RouteStop & {
  stop: Stop | undefined
}

export type DirectionMap = Record<string, RouteStopWithData[]>
