import { Card } from '~/components/ui/card'

export default function LoadingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-16 text-white">
      <div className="container flex max-w-6xl flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-4 bg-white/5 p-4 rounded-lg">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-white/10" />
          <div className="h-6 w-72 animate-pulse rounded-lg bg-white/10" />
        </div>

        <Card className="w-full">
          <div className="p-6 space-y-4">
            {[...Array<number>(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-6 w-24 animate-pulse rounded bg-white/10" />
                <div className="h-12 animate-pulse rounded bg-white/5" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="aspect-video w-full max-w-2xl">
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-32 animate-pulse rounded bg-white/10" />
          </div>
        </Card>
      </div>
    </main>
  )
}
