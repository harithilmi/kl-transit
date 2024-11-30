import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import { type Metadata } from 'next'
import Link from "next/link";
import { ThemeToggle } from '@/app/components/theme-toggle'
import { ThemeProvider } from '@/app/components/theme-provider'
import { notFound } from 'next/navigation';
import { routing } from '@/i8n/routing';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';

const inter = Inter({ subsets: ['latin'] })

// Define the Locale type based on your supported locales
type Locale = 'en' | 'ms';

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
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <NextIntlClientProvider
            messages={messages}
          >
            <div className="fixed top-4 right-4 z-50">
              <ThemeToggle />
            </div>
            {children}
            <footer className="fixed bottom-0 left-0 right-0 p-4 text-center text-muted-foreground">
              <Link 
                href="https://github.com/harithilmi/kl-transit"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Contribute on GitHub
              </Link>
            </footer>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
