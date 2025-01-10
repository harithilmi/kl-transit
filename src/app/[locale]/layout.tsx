import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import { type Metadata } from 'next'
import { ThemeProvider } from '@/components/layout/theme/theme-provider'
import { notFound } from 'next/navigation';
import { routing } from '@/i8n/routing';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { Navbar } from '@/components/layout/navbar/navbar';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from '@/lib/query-provider';
import type { Locale } from '@/i8n/request';
import { CommandMenu } from '@/components/search/command-dialog';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'] })

	
export const metadata: Metadata = {
  title: "KL Transit",
  description: "KL Transit",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
    { rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon-32x32.png" },
    { rel: "icon", type: "image/png", sizes: "16x16", url: "/favicon-16x16.png" },
	],
  alternates: {
    canonical: 'https://kltransit.my',
    languages: {
      'en': 'https://kltransit.my/en',
      'ms': 'https://kltransit.my/ms',
    },
  },
};

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  // eslint-disable-next-line @typescript-eslint/await-thenable
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }
  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
		  <body className={inter.className}>
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <NextIntlClientProvider messages={messages}>
                <Navbar />
                <CommandMenu />
                {children}
			  <Analytics />
			  <SpeedInsights />
              </NextIntlClientProvider>
            </QueryProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
