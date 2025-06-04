
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { YoutubeIcon, BrainCircuitIcon, LightbulbIcon } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-3xl py-8 px-4 sm:py-12">
      <Card className="shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <YoutubeIcon className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-4xl font-headline tracking-tight">About TubeDigest</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Unlocking insights from YouTube videos, one summary at a time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground/90">
          <section aria-labelledby="what-is-tubedigest">
            <h2 id="what-is-tubedigest" className="text-2xl font-semibold mb-3 flex items-center">
              <LightbulbIcon className="mr-2 h-6 w-6 text-primary" />
              What is TubeDigest?
            </h2>
            <p className="leading-relaxed">
              TubeDigest is an AI-powered web application designed to help you quickly understand the content of YouTube videos.
              Whether you're a student, researcher, or just curious, TubeDigest provides video transcripts and detailed, structured summaries
              to save you time and highlight key information.
            </p>
          </section>

          <section aria-labelledby="how-it-works">
            <h2 id="how-it-works" className="text-2xl font-semibold mb-3 flex items-center">
              <BrainCircuitIcon className="mr-2 h-6 w-6 text-primary" />
              How It Works
            </h2>
            <p className="leading-relaxed">
              Simply paste a YouTube video URL into TubeDigest. The application will:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4 mt-2">
              <li>Fetch the video's transcript if available.</li>
              <li>Utilize advanced AI models (powered by Genkit and Google's Gemini) to analyze the transcript.</li>
              <li>Generate a comprehensive summary, broken down into key sections like main topics, chronological flow, key points, learnings, and a final conclusion.</li>
            </ul>
            <p className="mt-2 leading-relaxed">
              This allows you to grasp the essence of a video without watching it in its entirety, or to quickly review important concepts from content you've already seen.
            </p>
          </section>

          <section aria-labelledby="our-mission">
            <h2 id="our-mission" className="text-2xl font-semibold mb-3">
              Our Mission
            </h2>
            <p className="leading-relaxed">
              Our mission is to make information more accessible and learning more efficient. We believe that by leveraging the power of AI,
              we can help users extract valuable knowledge from the vast ocean of online video content quickly and effectively.
            </p>
          </section>

          <section aria-labelledby="tech-stack">
            <h2 id="tech-stack" className="text-2xl font-semibold mb-3">
              Technology
            </h2>
            <p className="leading-relaxed">
              TubeDigest is built with a modern tech stack including:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4 mt-2">
              <li>Next.js for the frontend and backend framework.</li>
              <li>React and TypeScript for building the user interface.</li>
              <li>ShadCN UI components and Tailwind CSS for styling.</li>
              <li>Genkit with Google's Gemini models for AI-powered summarization.</li>
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
