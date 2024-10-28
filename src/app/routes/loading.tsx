import { Card } from '~/components/ui/card'

export default function LoadingRoutes() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-16 text-white">
      <div className="container flex max-w-6xl flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-64 animate-pulse rounded-lg bg-white/20" />
          <div className="h-6 w-96 animate-pulse rounded-lg bg-white/20" />
        </div>

        <Card className="w-full max-w-2xl">
          <div className="flex flex-col gap-4 p-4">
            <div className="h-12 animate-pulse rounded-lg bg-white/20" />
          </div>
        </Card>

        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <Card key={i} className="flex flex-col p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-lg bg-white/20" />
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-20 animate-pulse rounded bg-white/20" />
                  <div className="h-4 w-32 animate-pulse rounded bg-white/20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
