import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { ModelProvider } from '@/contexts/ModelContext';
import Header from '@/components/layouts/header';
import Footer from '@/components/layouts/footer';

export const metadata: Metadata = {
  title: 'NZDigest - YouTube Summarizer',
  description: 'Get transcripts and AI-powered summaries for YouTube videos.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ModelProvider>
            <div className="relative flex min-h-dvh flex-col">
              <Header />
              <main className="flex-1 pt-16">{children}</main>
              <Footer />
            </div>
          </ModelProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
