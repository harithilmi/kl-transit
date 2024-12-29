# Refactor to to change from direction to trips

## Core Types

```tsx
// routes.json
type TripType = 'linear' | 'circular' | 'variant'
type ServiceType = 'regular' | 'express' | 'peak_hours' | 'special'
type RouteType = keyof typeof RouteTypes

interface Stop {
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

interface Service {
  stop_id: number
  zone: 1 | 2 | 3
}

interface ServiceWithStop extends Service {
  stop: Stop
}

interface Shape {
  coordinates: [number, number][]
}

interface Trip {
  id: string
  name: string
  type: TripType // Pattern type (linear, circular, variant)
  service_type: ServiceType // Service type (regular, express, peak_hours, special)
  description?: string
  schedule?: {
    days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[]
    hours: {
      start: string
      end: string
    }
    frequency?: {
      peak: number
      offpeak: number
    }
  }
  terminals?: {
    first: string
    last: string
  }
}

interface Route {
  route_number: string
  route_name: string
  route_type: RouteType
  operator?: string
  fare_zone?: 1 | 2 | 3
  tags?: string[]
  trips: Trip[]
}

const RouteTypes = {
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
```

Example of a route:

---

```json
// routes.json
{
  "T410": {
    "route_number": "T410",
    "route_name": "MRT Taman Connaught ↺ Bandar Tasik Selatan",
    "route_type": "mrt_feeder",
    "operator": "Rapid Bus",
    "fare_zone": 1,
    "tags": ["feeder"],
    "trips": [
      {
        "id": "clockwise_peak",
        "name": "Peak Hours Service",
        "type": "circular",
        "service_type": "peak_hours",
        "description": "Clockwise loop with additional stops during peak hours",
        "schedule": {
          "days": ["mon", "tue", "wed", "thu", "fri"],
          "hours": {
            "start": "06:00",
            "end": "09:00"
          },
          "frequency": {
            "peak": 10,
            "offpeak": 0
          }
        }
      },
      {
        "id": "clockwise_regular",
        "name": "Regular Service",
        "type": "circular",
        "service_type": "regular",
        "description": "Regular clockwise loop service",
        "schedule": {
          "days": ["mon", "tue", "wed", "thu", "fri"],
          "hours": {
            "start": "09:00",
            "end": "23:00"
          },
          "frequency": {
            "peak": 15,
            "offpeak": 20
          }
        }
      }
    ]
  }
}
```

```json
// stops.json
{
  "T410": {
    "clockwise_peak": [
      { "stop_id": 1001, "zone": 1 },
      { "stop_id": 1002, "zone": 1 },
      { "stop_id": 1003, "zone": 1 },
      { "stop_id": 1004, "zone": 1 },
      { "stop_id": 1005, "zone": 1 },
      { "stop_id": 1001, "zone": 1 }
    ],
    "clockwise_regular": [
      { "stop_id": 1001, "zone": 1 },
      { "stop_id": 1002, "zone": 1 },
      { "stop_id": 1004, "zone": 1 },
      { "stop_id": 1001, "zone": 1 }
    ]
  }
}
```

```json
// shapes.json
{
  "T410": {
    "clockwise_peak": {
      "coordinates": [
        [100, 100],
        [101, 101],
        [102, 102],
        [103, 103],
        [104, 104],
        [100, 100]
      ]
    }
  }
}
```

## Implementatiion on the app

### Route Stop List

```tsx
// src/app/components/routes/route-stop-list.tsx
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { Route, ServiceWithStop, Trip } from '@/types/routes'

export function RouteStopList({
  services = {},
  route,
}: {
  services: Record<string, ServiceWithStop[]>
  route: Route
}) {
  return (
    <Tabs defaultValue={route.trips[0].id} className="w-full">
      <TabsList className="w-full justify-start">
        {route.trips.map((trip) => (
          <TabsTrigger key={trip.id} value={trip.id}>
            {trip.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {route.trips.map((trip) => (
        <TabsContent key={trip.id} value={trip.id}>
          <TripStopList services={services[trip.id]} trip={trip} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

function TripStopList({
  services,
  trip,
}: {
  services: ServiceWithStop[]
  trip: Trip
}) {
  const isCircular = trip.type === 'circular'
  const midPoint = Math.ceil(services.length / 2)

  // Split services into two columns for balanced display
  const leftServices = services.slice(0, midPoint)
  const rightServices = services.slice(midPoint).reverse()

  return (
    <div className="h-full flex">
      <div className="flex w-full flex-col overflow-y-auto">
        <div className="flex flex-col h-full p-4">
          {/* Start Half Circle */}
          <div className="relative top-0 left-1/2 w-[1.375rem] h-8 -translate-x-1/2 rounded-t-full border-t-[0.2rem] border-l-[0.2rem] border-r-[0.2rem] border-primary shrink-0" />

          <div className="flex w-full flex-1 relative">
            {/* Left column */}
            <div className="flex-1 flex flex-col justify-stretch h-full">
              {leftServices.map((service) => (
                <StopItem
                  key={`${service.stop_id}`}
                  service={service}
                  alignment="right"
                />
              ))}
            </div>

            {/* Right column */}
            <div className="flex-1 flex flex-col justify-stretch h-full">
              {rightServices.map((service) => (
                <StopItem
                  key={`${service.stop_id}`}
                  service={service}
                  alignment="left"
                />
              ))}
            </div>
          </div>

          {/* Ending Half Circle */}
          <div className="relative top-0 left-1/2 w-[1.375rem] h-8 -translate-x-1/2 rounded-b-full border-b-[0.2rem] border-l-[0.2rem] border-r-[0.2rem] border-primary shrink-0" />

          {/* Trip information */}
          <div className="text-center text-sm text-muted-foreground mt-4">
            {isCircular ? (
              <span>
                ↺ This is a circular route that loops back to the starting point
              </span>
            ) : (
              <span>{trip.description}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StopItem({
  service,
  alignment,
}: {
  service: ServiceWithStop
  alignment: 'left' | 'right'
}) {
  return (
    <div
      className={cn(
        'hover:bg-accent/50 rounded-lg transition-colors duration-300 py-4 relative flex flex-col justify-center',
        alignment === 'right' ? 'pr-5' : 'pl-5',
        // Line styles
        alignment === 'right'
          ? 'after:absolute after:top-0 after:right-0 after:w-[0.2rem] after:h-full after:bg-primary after:translate-x-[-0.5rem]'
          : 'after:absolute after:top-0 after:left-0 after:w-[0.2rem] after:h-full after:bg-primary after:translate-x-[0.5rem]',
        // Arrow styles
        alignment === 'right'
          ? 'before:absolute before:top-1/2 before:right-0 before:w-2 before:h-2 before:border-t-2 before:border-r-2 before:border-foreground before:z-10 before:translate-x-[-0.35rem] before:-translate-y-1/2 before:rotate-[135deg]'
          : 'before:absolute before:top-1/2 before:left-0 before:w-2 before:h-2 before:border-t-2 before:border-r-2 before:border-foreground before:z-10 before:translate-x-[0.35rem] before:-translate-y-1/2 before:rotate-[-45deg]',
      )}
    >
      <h3
        className={cn(
          'text-sm text-muted-foreground',
          alignment === 'right' ? 'text-right' : 'text-left',
        )}
      >
        {service.stop?.stop_code}
      </h3>
      <h2
        className={cn(
          'text-sm font-medium',
          alignment === 'right' ? 'text-right' : 'text-left',
        )}
      >
        {service.stop?.stop_name}
      </h2>
      <h3
        className={cn(
          'text-sm text-muted-foreground',
          alignment === 'right' ? 'text-right' : 'text-left',
        )}
      >
        {service.stop?.street_name}
      </h3>
    </div>
  )
}

export const dynamic = 'force-static'
export const revalidate = 3600
```

### Route Stop Map

### Route Stop Editor
