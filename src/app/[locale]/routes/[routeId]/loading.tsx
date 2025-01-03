import { Card } from '@/components/ui/card'

export default function LoadingPage() {
  const leftStops = Array.from({ length: 4 }, (_, i) => i)
  const rightStops = Array.from({ length: 4 }, (_, i) => i)

  return (
    <main className="min-h-screen bg-background px-2 py-8 text-foreground sm:px-4 sm:py-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3">
        {/* Back button */}
        <div className="w-full max-w-4xl px-2">
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        </div>

        {/* Route header */}
        <div className="flex w-full max-w-xl lg:max-w-none flex-col gap-6 sm:gap-8">
          <Card className="w-full p-4">
            <div className="flex flex-col gap-2">
              <div className="h-8 w-32 mx-auto animate-pulse rounded bg-muted" />
              <div className="h-6 w-64 mx-auto animate-pulse rounded bg-muted" />
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-24 animate-pulse rounded bg-muted" />
                <div className="h-6 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </Card>
        </div>

        {/* Map and Route Stop List Container */}
        <div className="flex w-full max-w-xl lg:max-w-none flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Map */}
          <Card className="w-full lg:flex-1 h-96 lg:h-[calc(100vh-20rem)] overflow-hidden">
            <div className="h-full w-full flex items-center justify-center bg-muted/50">
              <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            </div>
          </Card>

          {/* Route Stop List */}
          <Card className="w-full lg:w-[400px] h-96 lg:h-[calc(100vh-20rem)] overflow-hidden">
            <div className="p-4 space-y-4">
              <div className="flex justify-between gap-8">
                <div className="flex-1 space-y-4">
                  {leftStops.map((i) => (
                    <div key={`left-${i}`} className="space-y-2">
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                      <div className="h-6 w-full animate-pulse rounded bg-muted/50" />
                    </div>
                  ))}
                </div>
                <div className="flex-1 space-y-4">
                  {rightStops.map((i) => (
                    <div key={`right-${i}`} className="space-y-2">
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                      <div className="h-6 w-full animate-pulse rounded bg-muted/50" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
