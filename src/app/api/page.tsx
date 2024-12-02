import { Card } from '@/app/components/ui/card'
import { getTranslations } from 'next-intl/server'

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

export default async function ApiDocsPage() {
  const t = await getTranslations()

  const endpoints: Endpoint[] = [
    {
      method: 'GET',
      path: '/api/routes',
      description: t('APIDocsPage.routesGETDescription'),
      parameters: [
        {
          name: 'q',
          type: 'string',
          description: t('APIDocsPage.routesGETParameterQDescription'),
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
      description: t('APIDocsPage.routeDetailsGETDescription'),
      parameters: [
        {
          name: 'routeId',
          type: 'string',
          description: t(
            'APIDocsPage.routeDetailsGETParameterRouteIdDescription',
          ),
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

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-16 text-foreground">
      <div className="container flex max-w-4xl flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            {t('APIDocsPage.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('APIDocsPage.subtitle')}
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
                    <h3 className="font-semibold">
                      {t('APIDocsPage.tableHeaderTitle')}
                    </h3>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-2 text-left">
                              {t('APIDocsPage.tableHeaderName')}
                            </th>
                            <th className="p-2 text-left">
                              {t('APIDocsPage.tableHeaderType')}
                            </th>
                            <th className="p-2 text-left">
                              {t('APIDocsPage.tableHeaderRequired')}
                            </th>
                            <th className="p-2 text-left">
                              {t('APIDocsPage.tableHeaderDescription')}
                            </th>
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
                                {param.required
                                  ? t('APIDocsPage.requiredTrue')
                                  : t('APIDocsPage.requiredFalse')}
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
                    <h3 className="font-semibold">
                      {t('APIDocsPage.example')}
                    </h3>
                    {endpoint.example.request && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {t('APIDocsPage.request')}:
                        </p>
                        <code className="block rounded bg-muted p-2 font-mono text-sm">
                          {endpoint.example.request}
                        </code>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {t('APIDocsPage.response')}:
                      </p>
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
