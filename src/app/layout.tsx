import './globals.css';
import { inter } from '@/app/fonts';

export const metadata = {
  title: 'NZDigest',
  description: 'AI-powered summaries',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}