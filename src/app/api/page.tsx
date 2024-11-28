import { Card } from '~/components/ui/card'

interface Endpoint {
  method: string
  path: string
  description: string
  parameters?: {
    name: string
    type: string
    description: string
    required: boolean
  }[]
  example?: {
    request?: string
    response: string
  }
}

const endpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/routes',
    description: 'Get all bus routes, optionally filtered by search query',
    parameters: [
      {
        name: 'q',
        type: 'string',
        description: 'Search query to filter routes by number or name',
        required: false,
      },
    ],
    example: {
      request: '/api/routes?q=damansara',
      response: `[
  {
    "route_id": "780",
    "route_number": "780",
    "route_name": "Kota Damansara ⇌ Hab Pasar Seni",
    "route_type": "utama"
  }
]`,
    },
  },
  {
    method: 'GET',
    path: '/api/routes/[routeId]',
    description: 'Get detailed information about a specific route',
    parameters: [
      {
        name: 'routeId',
        type: 'string',
        description: 'The route number to get details for',
        required: true,
      },
    ],
    example: {
      request: '/api/routes/780',
      response: `{
  "route_id": "780",
  "route_number": "780",
  "route_name": "Kota Damansara ⇌ Hab Pasar Seni",
  "route_type": "utama",
  "services": [...],
  "shape": {
    "direction1": {...},
    "direction2": {...}
  }
}`,
    },
  },
]

export default function ApiDocsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-16 text-white">
      <div className="container flex max-w-4xl flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            API Documentation
          </h1>
          <p className="text-lg text-white/80">
            Access KL Transit data through our REST API
          </p>
        </div>

        <div className="w-full space-y-6">
          {endpoints.map((endpoint) => (
            <Card
              key={endpoint.path}
              className="w-full overflow-hidden bg-white/5 p-6"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-blue-500 px-2 py-1 text-sm font-medium">
                    {endpoint.method}
                  </span>
                  <code className="rounded bg-white/10 px-2 py-1 font-mono">
                    {endpoint.path}
                  </code>
                </div>

                <p className="text-white/80">{endpoint.description}</p>

                {endpoint.parameters && endpoint.parameters.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Parameters</h3>
                    <div className="rounded-lg border border-white/10 overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5">
                            <th className="p-2 text-left">Name</th>
                            <th className="p-2 text-left">Type</th>
                            <th className="p-2 text-left">Required</th>
                            <th className="p-2 text-left">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {endpoint.parameters.map((param) => (
                            <tr
                              key={param.name}
                              className="border-b border-white/10"
                            >
                              <td className="p-2 font-mono text-sm">
                                {param.name}
                              </td>
                              <td className="p-2 text-sm">{param.type}</td>
                              <td className="p-2 text-sm">
                                {param.required ? 'Yes' : 'No'}
                              </td>
                              <td className="p-2 text-sm text-white/80">
                                {param.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {endpoint.example && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Example</h3>
                    {endpoint.example.request && (
                      <div className="space-y-1">
                        <p className="text-sm text-white/60">Request:</p>
                        <code className="block rounded bg-white/10 p-2 font-mono text-sm">
                          {endpoint.example.request}
                        </code>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-sm text-white/60">Response:</p>
                      <pre className="overflow-x-auto rounded bg-white/10 p-2">
                        <code className="font-mono text-sm">
                          {endpoint.example.response}
                        </code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
