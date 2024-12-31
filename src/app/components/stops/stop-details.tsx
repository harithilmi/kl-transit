import type { Route, Stop } from '@/types/routes'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i8n/routing'

export function StopDetails({
  stopData,
  routes,
}: {
  stopData: Stop
  routes: Route[]
}) {
  // Find all routes and their trips that serve this stop
  const routesWithTrips = routes
    .map((route) => ({
      ...route,
      relevantTrips: route.trips.filter((trip) =>
        trip.stopDetails.some((stop) => stop.stopId === stopData.stop_id),
      ),
    }))
    .filter((route) => route.relevantTrips.length > 0)

  if (!routesWithTrips.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{stopData.stop_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No routes found at this stop</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Routes at this stop</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {routesWithTrips.map((route) => (
            <div key={route.routeId} className="space-y-2">
              <div className="flex items-center gap-2">
                <Link href={`/routes/${route.routeId}`}>
                  <Badge
                    style={{
                      backgroundColor: `#${route.routeColor}`,
                      color: `#${route.routeTextColor}`,
                    }}
                  >
                    {route.routeShortName}
                  </Badge>
                </Link>
                <span className="text-sm font-medium">
                  {route.routeLongName}
                </span>
              </div>
              <div className="pl-4 space-y-1">
                {route.relevantTrips.map((trip) => (
                  <div
                    key={trip.tripId}
                    className="text-sm text-muted-foreground"
                  >
                    {trip.direction === 0 ? '↑' : '↓'} {trip.headsign}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
