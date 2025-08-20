import Footer from "@/components/layouts/footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'NZDigest - About',
  description: 'Get transcripts and AI-powered summaries for YouTube videos.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="max-md:min-h-dvh min-lg:max-h-dvh">
      {children}
    </div>
  )
}