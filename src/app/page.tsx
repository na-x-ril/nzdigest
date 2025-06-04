
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

  result = result.replace(/```[a-zA-Z]+\n/g, '```');
  result = result.replace(/\*\*(.*?)\*\*/g, (_match, p1) => `<strong>${p1}</strong>`);
  result = result.replace(/\*(.*?)\*/g, (_match, p1) => `<strong>${p1}</strong>`);
  result = result.replace(/~(.*?)~/g, (_match, p1) => `<del>${p1}</del>`);
  result = result.replace(/^### (.*)$/gm, (_match, p1) => `\t\`<strong>${p1}</strong>\``);

  return result;
}

const MAX_TRANSCRIPT_RETRIES = 5;
const RETRY_DELAY_MS = 2000; // 2 seconds

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
    let transcriptFetched = false;
    let transcriptData;
    let lastTranscriptError: any = null;

    for (let attempt = 1; attempt <= MAX_TRANSCRIPT_RETRIES; attempt++) {
      try {
        toast({
          title: "Fetching Transcript",
          description: `Attempt ${attempt} of ${MAX_TRANSCRIPT_RETRIES}...`,
        });
        const transcriptResponse = await fetch('/api/transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: youtubeUrl }),
        });

        transcriptData = await transcriptResponse.json();

        if (!transcriptResponse.ok) {
          throw new Error(transcriptData.error || `Failed to fetch transcript (status: ${transcriptResponse.status})`);
        }
        setTranscript(transcriptData.transcript);
        toast({
          title: "Transcript Fetched",
          description: "Successfully fetched the video transcript.",
        });
        transcriptFetched = true;
        lastTranscriptError = null; // Reset error on success
        break; // Exit retry loop on success
      } catch (e: any) {
        lastTranscriptError = e;
        setError(`Attempt ${attempt} failed: ${e.message}`);
        if (attempt < MAX_TRANSCRIPT_RETRIES) {
          toast({
            title: "Transcript Fetch Failed",
            description: `Attempt ${attempt} failed. Retrying in ${RETRY_DELAY_MS / 1000} seconds...`,
            variant: "destructive",
          });
          await sleep(RETRY_DELAY_MS);
        }
      }
    }

    setIsLoadingTranscript(false);

    if (!transcriptFetched || !transcriptData?.transcript) {
      const finalErrorMessage = lastTranscriptError?.message || 'Failed to fetch transcript after multiple retries.';
      setError(finalErrorMessage);
      toast({
        title: "Transcript Error",
        description: finalErrorMessage,
        variant: "destructive",
      });
      return; // Stop if transcript fetching ultimately failed
    }
    
    // Proceed to summarization only if transcript was successful
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
                  <p className="text-sm whitespace-pre-wrap leading-relaxed pb-4">{transcript}</p>
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
                    <p className="whitespace-pre-wrap leading-relaxed pb-4" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.topikUtama) }} />
                  </ScrollArea>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground/90">2. Kronologi/Alur</h3>
                  <ScrollArea className="h-auto max-h-60 w-full rounded-md border bg-muted/30 p-3 text-sm">
                    <p className="whitespace-pre-wrap leading-relaxed pb-4" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.kronologiAlur) }} />
                  </ScrollArea>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground/90">3. Poin-poin Kunci</h3>
                  <ScrollArea className="h-auto max-h-72 w-full rounded-md border bg-muted/30 p-3 text-sm">
                     <p className="whitespace-pre-wrap leading-relaxed pb-4" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.poinPoinKunci) }} />
                  </ScrollArea>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground/90">4. Pembelajaran/Insight</h3>
                  <ScrollArea className="h-auto max-h-60 w-full rounded-md border bg-muted/30 p-3 text-sm">
                    <p className="whitespace-pre-wrap leading-relaxed pb-4" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.pembelajaranInsight) }} />
                  </ScrollArea>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground/90">5. Kesimpulan</h3>
                  <ScrollArea className="h-auto max-h-48 w-full rounded-md border bg-muted/30 p-3 text-sm">
                    <p className="whitespace-pre-wrap leading-relaxed pb-4" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.kesimpulan) }} />
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
