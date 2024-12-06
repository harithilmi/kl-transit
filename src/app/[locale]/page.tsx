import { HomeSearchForm } from '@/app/components/home-search-form'
import { Card } from '@/app/components/ui/card'
import { Link } from '@/i8n/routing'
import { useTranslations } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const title =
    locale === 'ms'
      ? 'KL Transit - Panduan Pengangkutan Awam KL'
      : 'KL Transit - KL Public Transport Guide'

  const description =
    locale === 'ms'
      ? 'Panduan komprehensif untuk pengangkutan awam di Kuala Lumpur'
      : 'Your comprehensive guide to public transportation in Kuala Lumpur'

  return {
    title,
    description,
    alternates: {
      canonical: '/',
      languages: {
        en: '/en',
        ms: '/ms',
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: '/',
      siteName: 'KL Transit',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default function HomePage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  setRequestLocale(locale)
  const t = useTranslations()
  return (
    <main className="min-h-screen bg-background px-2 py-8 text-foreground sm:px-4 sm:py-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 sm:gap-8">
        {/* Hero Section */}
        <div className="flex w-full max-w-xl flex-col gap-4 text-center">
          <h1 className="text-3xl font-bold sm:text-5xl">KL Transit</h1>
          <p className="text-lg text-muted-foreground">
            {t('HomePage.subtitle')}
          </p>
        </div>

        {/* Search Section */}
        <Card className="w-full max-w-xl p-4">
          <HomeSearchForm />
        </Card>

        {/* About Section */}
        <Card className="w-full max-w-xl p-4">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">
              {t('HomePage.about.title')}
            </h2>
            <p className="text-muted-foreground">
              {t('HomePage.about.description')}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Link
                href="https://github.com/harithilmi/kl-transit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 hover:bg-secondary/80 transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                {t('HomePage.about.github')}
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
