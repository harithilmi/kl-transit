import { Card } from '~/components/ui/card'

export default function LoadingRoutePage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-16 text-white">
      <div className="container flex max-w-6xl flex-col items-center gap-12">
        {/* Route Header Loading */}
        <div className="flex flex-col items-center gap-4">
          <div className="h-24 w-24 animate-pulse rounded-2xl bg-white/20" />
          <div className="h-8 w-64 animate-pulse rounded-lg bg-white/20" />
        </div>

        {/* Stops List Loading */}
        <Card className="w-full max-w-2xl">
          <div className="flex flex-col divide-y divide-white/10">
            {[...Array<number>(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="h-8 w-8 animate-pulse rounded-full bg-white/20" />
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-white/20" />
                  <div className="h-3 w-32 animate-pulse rounded bg-white/20" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Map Loading */}
        <Card className="aspect-video w-full max-w-2xl">
          <div className="h-full animate-pulse bg-white/20" />
        </Card>
      </div>
    </main>
  )
}
