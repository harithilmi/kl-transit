import { Card, CardContent } from '@/components/ui/card'

export default function LoadingRoutes() {
  // Create array for route card skeletons
  const routeCards = Array.from({ length: 9 }, (_, i) => i)

  return (
    <main className="min-h-screen bg-background px-2 py-8 text-foreground sm:px-4 sm:py-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 sm:gap-8">
        {/* Header */}
        <div className="flex w-full max-w-xl flex-col gap-4 text-center">
          <div className="h-12 w-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-6 w-96 animate-pulse rounded-lg bg-muted" />
        </div>

        {/* Search and Filter */}
        <Card className="w-full max-w-xl p-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="h-[50px] w-full animate-pulse rounded-lg bg-secondary" />
            <div className="h-[50px] w-full animate-pulse rounded-lg bg-primary/50" />
          </div>
        </Card>

        {/* Routes Grid */}
        <div className="grid w-full max-w-7xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {routeCards.map((i) => (
            <Card key={i} className="h-24">
              <CardContent className="flex h-full items-center p-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <div className="h-6 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-6 w-24 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-4 w-32 animate-pulse rounded bg-muted/50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
