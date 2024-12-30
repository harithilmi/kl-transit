'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <Card className="max-w-md p-6 space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <h2 className="text-lg font-semibold">{t('ErrorPage.title')}</h2>
        </div>
        <p className="text-muted-foreground">{error.message}</p>
        <div className="flex gap-4">
          <Button onClick={reset} variant="default">
            {t('ErrorPage.tryAgain')}
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            {t('ErrorPage.refresh')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
