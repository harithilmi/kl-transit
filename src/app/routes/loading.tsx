import { Card } from '~/components/ui/card'

export default function LoadingRoutes() {
  // Create array for route card skeletons
  const routeCards = Array.from({ length: 9 }, (_, i) => i)

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-16 text-foreground">
      <div className="container flex max-w-6xl flex-col items-center gap-12">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-6 w-96 animate-pulse rounded-lg bg-muted" />
        </div>

        {/* Search and Filter */}
        <Card className="w-full max-w-2xl">
          <div className="flex flex-col gap-4 p-4">
            <div className="h-10 animate-pulse rounded-lg bg-muted" />
          </div>
        </Card>

        {/* Routes Grid */}
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {routeCards.map((i) => (
            <Card key={i} className="flex flex-col p-4">
              <div className="flex flex-col gap-2">
                <div className="h-6 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted/50" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
