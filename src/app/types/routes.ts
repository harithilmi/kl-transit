export interface Route {
  route_id: number
  route_number: string
  route_name: string
  route_type: string
}

export interface Stop {
  id: number
  stop_id: string
  stop_code: string
  stop_name: string
  street_name: string | null
  latitude: string
  longitude: string
  created_at: string
  updated_at: string
}

export interface Service {
  id: number
  route_number: string
  stop_id: string
  sequence: number
  direction: number
  zone: number
  created_at: string
  updated_at: string
  stop: Stop
}

export interface RouteShape {
  route_number: string
  direction: number
  coordinates: [number, number][]
}

export interface RouteDetails extends Route {
  services: Service[]
  shape: {
    direction1: RouteShape
    direction2: RouteShape
  }
}

export interface RouteMapProps {
  services: Service[]
  shape: {
    direction1: RouteShape
    direction2: RouteShape
  }
}

export interface RouteMapWrapperProps extends RouteMapProps {
  routeId: string
}
