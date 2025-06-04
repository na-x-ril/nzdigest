
import type {Metadata} from 'next';
import Link from 'next/link';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { YoutubeIcon, GithubIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'TubeDigest - YouTube Summarizer',
  description: 'Get transcripts and AI-powered summaries for YouTube videos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          <div className="relative flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex justify-center items-center">
              <div className="w-[80%] mx-auto flex h-14 items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                  <YoutubeIcon className="h-6 w-6 text-primary" />
                  <span className="font-bold text-lg">TubeDigest</span>
                </Link>
                <div className="flex items-center space-x-2">
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="py-4 md:py-6 border-t">
              <div className="container flex flex-col items-center justify-between gap-2 md:h-16 md:flex-row">
                <p className="text-center text-xs md:text-sm leading-loose text-muted-foreground md:text-left">
                  Built by Nazril.
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href="https://github.com/na-x-ril/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs md:text-sm font-medium underline underline-offset-4 flex items-center gap-1"
                  >
                    <GithubIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    GitHub
                  </a>
                </div>
              </div>
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
