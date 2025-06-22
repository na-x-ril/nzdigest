import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations} from 'next-intl/server';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { GithubIcon, InfoIcon } from 'lucide-react';
import { ModelProvider } from '@/contexts/ModelContext';
import { ModelSelectorDropdown } from '@/components/ModelSelectorDropdown';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { Link } from '@/i18n/navigation';
import type { Metadata } from 'next';

export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  const t = await getTranslations({locale, namespace: 'Layout'});

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  const t = await getTranslations('Layout.Footer');
  const currentYear = new Date().getFullYear();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ModelProvider>
            <div className="relative flex min-h-screen flex-col">
              <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex justify-center items-center">
                <div className="w-[80%] mx-auto flex h-14 items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Link href="/" className="flex items-center space-x-0">
                      <span className="font-bold text-2xl text-primary">
                        <span style={{ letterSpacing: '-0.12em' }}>NZD</span>
                        <span className="ml-[2px] text-primary">igest</span>
                      </span>
                    </Link>
                    <ModelSelectorDropdown />
                  </div>
                  <div className="flex items-center space-x-2">
                    <LocaleSwitcher />
                    <ThemeToggle />
                  </div>
                </div>
              </header>
              <main className="flex-1">{children}</main>
              <footer className="py-4 md:py-6 border-t flex justify-center">
                <div className="w-[80%] mx-auto flex flex-col items-center justify-between gap-2 md:h-16 md:flex-row">
                  <div className="text-center md:text-left">
                    <p className="text-xs md:text-sm leading-loose text-muted-foreground">
                      {t('builtBy')}
                    </p>
                    <p className="text-xs md:text-sm leading-loose text-muted-foreground">
                      {t('copyright', {year: currentYear})}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link
                      href="/about"
                      className="text-xs md:text-sm font-medium underline underline-offset-4 flex items-center gap-1"
                    >
                      <InfoIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      {t('about')}
                    </Link>
                    <a
                      href="https://github.com/na-x-ril/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs md:text-sm font-medium underline underline-offset-4 flex items-center gap-1"
                    >
                      <GithubIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      {t('github')}
                    </a>
                  </div>
                </div>
              </footer>
            </div>
          </ModelProvider>
          <Toaster />
        </ThemeProvider>
    </NextIntlClientProvider>
  );
}
