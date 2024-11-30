import { Card } from '@/app/components/ui/card'

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
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-16 text-foreground">
      <div className="container flex max-w-4xl flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            API Documentation
          </h1>
          <p className="text-lg text-muted-foreground">
            Access KL Transit data through our REST API
          </p>
        </div>

        <div className="w-full space-y-6">
          {endpoints.map((endpoint) => (
            <Card
              key={endpoint.path}
              className="w-full overflow-hidden bg-card"
            >
              <div className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-primary px-2 py-1 text-sm font-medium text-primary-foreground">
                    {endpoint.method}
                  </span>
                  <code className="rounded bg-muted px-2 py-1 font-mono text-muted-foreground">
                    {endpoint.path}
                  </code>
                </div>

                <p className="text-muted-foreground">{endpoint.description}</p>

                {endpoint.parameters && endpoint.parameters.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Parameters</h3>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-2 text-left">Name</th>
                            <th className="p-2 text-left">Type</th>
                            <th className="p-2 text-left">Required</th>
                            <th className="p-2 text-left">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {endpoint.parameters.map((param) => (
                            <tr key={param.name} className="border-b">
                              <td className="p-2 font-mono text-sm">
                                {param.name}
                              </td>
                              <td className="p-2 text-sm">{param.type}</td>
                              <td className="p-2 text-sm">
                                {param.required ? 'Yes' : 'No'}
                              </td>
                              <td className="p-2 text-sm text-muted-foreground">
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
                        <p className="text-sm text-muted-foreground">
                          Request:
                        </p>
                        <code className="block rounded bg-muted p-2 font-mono text-sm">
                          {endpoint.example.request}
                        </code>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Response:</p>
                      <pre className="overflow-x-auto rounded bg-muted p-2">
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
