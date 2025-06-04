
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, YoutubeIcon, FileTextIcon, SparklesIcon, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import type { SummarizeTranscriptOutput } from '@/ai/flows/summarize-transcript-flow';
import { cn } from '@/lib/utils';

function formatSummaryText(text: string | undefined | null): string {
  if (!text) return '';

  let result = text;

  // Aturan 1: ```bahasa\n -> ``` (Menghapus penentu bahasa dari blok kode)
  result = result.replace(/```[a-zA-Z]+\n/g, '```');

  // Aturan 2: **teks tebal** -> <strong>teks tebal</strong>
  result = result.replace(/\*\*(.*?)\*\*/g, (_match, p1) => `<strong>${p1}</strong>`);

  // Aturan 3: *teks* -> <strong>teks</strong> (Juga membuat teks yang diapit bintang tunggal menjadi tebal)
  // Ini akan cocok dengan pola seperti *kata* pada satu baris.
  result = result.replace(/\*(.*?)\*/g, (_match, p1) => `<strong>${p1}</strong>`);

  // Aturan 4: ~teks coret~ -> <del>teks coret</del>
  result = result.replace(/~(.*?)~/g, (_match, p1) => `<del>${p1}</del>`);

  // Aturan 5: ### Heading -> \t\`<strong>Heading</strong>\` (Tab literal, backtick, teks tebal, backtick)
  // Dalam HTML, \t akan dirender sebagai spasi, dan backtick akan menjadi karakter literal.
  result = result.replace(/^### (.*)$/gm, (_match, p1) => `\t\`<strong>${p1}</strong>\``);

  return result;
}


export default function TubeDigestPage() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState<SummarizeTranscriptOutput | null>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setError(null);
    setTranscript('');
    setSummary(null);

    if (!youtubeUrl) {
      setError("Please enter a YouTube URL.");
      toast({
        title: "Input Error",
        description: "Please enter a YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingTranscript(true);
    try {
      const transcriptResponse = await fetch('/api/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      const transcriptData = await transcriptResponse.json();

      if (!transcriptResponse.ok) {
        throw new Error(transcriptData.error || 'Failed to fetch transcript');
      }
      setTranscript(transcriptData.transcript);
      toast({
        title: "Transcript Fetched",
        description: "Successfully fetched the video transcript.",
      });

      setIsLoadingTranscript(false);
      setIsLoadingSummary(true);

      try {
        const summaryResponse = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: transcriptData.transcript }),
        });

        const summaryData = await summaryResponse.json();

        if (!summaryResponse.ok) {
          throw new Error(summaryData.error || 'Failed to generate summary');
        }
        setSummary(summaryData);
        toast({
          title: "Summary Generated",
          description: "Successfully generated the video summary.",
        });
      } catch (summaryError: any) {
        setError(summaryError.message);
        toast({
          title: "Summarization Error",
          description: summaryError.message,
          variant: "destructive",
        });
      } finally {
        setIsLoadingSummary(false);
      }

    } catch (transcriptError: any) {
      setError(transcriptError.message);
      toast({
        title: "Transcript Error",
        description: transcriptError.message,
        variant: "destructive",
      });
      setIsLoadingTranscript(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background p-4 pt-8 sm:pt-12">
      <Card className="w-full max-w-2xl shadow-2xl rounded-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <YoutubeIcon className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-4xl font-headline tracking-tight">TubeDigest</CardTitle>
          <CardDescription className="text-lg">
            Enter a YouTube URL to get its transcript and a concise AI-powered summary.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Input
              type="url"
              placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={isLoadingTranscript || isLoadingSummary}
              className="text-base h-12 px-4"
              aria-label="YouTube URL"
            />
            <Button
              onClick={handleSubmit}
              disabled={!youtubeUrl || isLoadingTranscript || isLoadingSummary}
              className={cn(
                "w-full h-12 text-lg",
                (isLoadingTranscript || isLoadingSummary) && "ai-animated-button-style"
              )}
              size="lg"
            >
              {(isLoadingTranscript || isLoadingSummary) ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : null}
              {isLoadingTranscript ? 'Fetching Transcript...' : isLoadingSummary ? 'Generating Summary...' : 'Digest Video'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="shadow-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {transcript && !error && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-headline">
                  <FileTextIcon className="mr-3 h-6 w-6 text-primary" /> Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 w-full rounded-md border bg-muted/30 p-4">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{transcript}</p>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {summary && typeof summary === 'object' && summary.topikUtama && !error && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl font-headline">
                  <SparklesIcon className="mr-3 h-6 w-6 text-primary" /> Detail Ringkasan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground/90">1. Topik Utama</h3>
                  <ScrollArea className="h-auto max-h-48 w-full rounded-md border bg-muted/30 p-3 text-sm">
                    <p className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.topikUtama) }} />
                  </ScrollArea>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground/90">2. Kronologi/Alur</h3>
                  <ScrollArea className="h-auto max-h-60 w-full rounded-md border bg-muted/30 p-3 text-sm">
                    <p className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.kronologiAlur) }} />
                  </ScrollArea>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground/90">3. Poin-poin Kunci</h3>
                  <ScrollArea className="h-auto max-h-72 w-full rounded-md border bg-muted/30 p-3 text-sm">
                     <p className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.poinPoinKunci) }} />
                  </ScrollArea>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground/90">4. Pembelajaran/Insight</h3>
                  <ScrollArea className="h-auto max-h-60 w-full rounded-md border bg-muted/30 p-3 text-sm">
                    <p className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.pembelajaranInsight) }} />
                  </ScrollArea>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground/90">5. Kesimpulan</h3>
                  <ScrollArea className="h-auto max-h-48 w-full rounded-md border bg-muted/30 p-3 text-sm">
                    <p className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.kesimpulan) }} />
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground pt-6">
          <p>Powered by AI. Summaries are for informational purposes and may not always be perfect.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
