import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import { type Metadata } from 'next'
import { ThemeProvider } from '@/app/components/theme-provider'
import { notFound } from 'next/navigation';
import { routing } from '@/i8n/routing';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { Navbar } from '@/app/components/navbar';
import { ClerkProvider } from '@clerk/nextjs';
import type { Locale } from '@/i8n/request';
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
  // Ensure that the incoming `locale` is valid
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
            <NextIntlClientProvider
              messages={messages}
            >
              <Navbar />
              {children}
            </NextIntlClientProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
