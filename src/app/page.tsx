
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
    let fetchedTranscriptContent = '';
    let finalErrorForDisplay: string | null = null;

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

        const responseBody = await transcriptResponse.json();

        if (!transcriptResponse.ok) {
          const errorMessage = responseBody.error || `Failed to fetch transcript (status: ${transcriptResponse.status})`;
          
          if (errorMessage.includes('Invalid YouTube URL format.')) {
            finalErrorForDisplay = errorMessage;
            transcriptFetched = false; 
            break; 
          }
          throw new Error(errorMessage); 
        }
        
        fetchedTranscriptContent = responseBody.transcript;
        transcriptFetched = true;
        finalErrorForDisplay = null; 
        toast({
          title: "Transcript Fetched",
          description: "Successfully fetched the video transcript.",
        });
        break; 
      } catch (e: any) {
        finalErrorForDisplay = e.message;
        
        if (e.message && e.message.includes('Invalid YouTube URL format.')) {
            transcriptFetched = false;
            break; 
        }

        if (attempt < MAX_TRANSCRIPT_RETRIES) {
          toast({
            title: "Transcript Fetch Failed",
            description: `Attempt ${attempt} failed: ${e.message}. Retrying in ${RETRY_DELAY_MS / 1000} seconds...`,
            variant: "destructive",
          });
          await sleep(RETRY_DELAY_MS);
        } else {
          toast({
            title: "Transcript Error",
            description: `Failed to fetch transcript after ${attempt} attempts: ${finalErrorForDisplay}`,
            variant: "destructive",
          });
        }
      }
    }

    setIsLoadingTranscript(false);

    if (!transcriptFetched) {
      setError(finalErrorForDisplay || "An unknown error occurred while fetching the transcript.");
      setTranscript(''); 
      setSummary(null);   
      return; 
    }
    
    setError(null); 
    setTranscript(fetchedTranscriptContent);
    
    setIsLoadingSummary(true);
    try {
      const summaryResponse = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: fetchedTranscriptContent }),
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
      setSummary(null); 
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
    <div className="flex flex-col items-center justify-start bg-background p-4 sm:pt-12">
      <Card className="w-full max-w-2xl shadow-2xl rounded-lg" id="main-content-card">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <YoutubeIcon className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-4xl font-headline tracking-tight">TubeDigest</CardTitle>
          <CardDescription className="text-lg">
            Enter a YouTube URL to get its transcript and a concise AI-powered summary.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 px-6 pt-0 pb-2">
          <div className="space-y-3 pt-6" id="url-input-section"> {/* Added pt-6 here to maintain original top padding of CardContent */}
            <Input
              id="youtube-url-input"
              type="url"
              placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={isLoadingTranscript || isLoadingSummary}
              className="text-base h-12 px-4"
              aria-label="YouTube URL"
            />
            <Button
              id="digest-video-button"
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
            <Alert variant="destructive" className="shadow-md" id="error-alert-section">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {transcript && !error && (
            <div id="transcript-section" className="space-y-3 pt-4">
              <CardTitle className="flex items-center text-2xl font-headline">
                <FileTextIcon className="mr-3 h-6 w-6 text-primary" /> Transcript
              </CardTitle>
              <ScrollArea className="h-64 w-full rounded-md border bg-muted/30 p-4" id="transcript-scroll-area">
                <p className="text-sm whitespace-pre-wrap leading-relaxed pb-4">{transcript}</p>
              </ScrollArea>
            </div>
          )}

          {summary && typeof summary === 'object' && summary.topikUtama && !error && (
            <div id="summary-section" className="space-y-3 pt-4">
              <CardTitle className="flex items-center text-2xl font-headline">
                <SparklesIcon className="mr-3 h-6 w-6 text-primary" /> Detail Ringkasan
              </CardTitle>
              <div className="space-y-4">
                <div id="summary-section-topik-utama">
                  <h3 className="font-semibold text-lg mb-2 text-foreground/90">1. Topik Utama</h3>
                  <ScrollArea className="h-auto w-full rounded-md border bg-muted/30 p-3 text-sm" id="summary-scroll-area-topik-utama">
                    <p className="whitespace-pre-wrap leading-relaxed pb-2" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.topikUtama) }} />
                  </ScrollArea>
                </div>
                <div id="summary-section-kronologi-alur">
                  <h3 className="font-semibold text-lg mb-2 text-foreground/90">2. Kronologi/Alur</h3>
                  <ScrollArea className="h-auto w-full rounded-md border bg-muted/30 p-3 text-sm" id="summary-scroll-area-kronologi-alur">
                    <p className="whitespace-pre-wrap leading-relaxed pb-0" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.kronologiAlur) }} />
                  </ScrollArea>
                </div>
                <div id="summary-section-poin-kunci">
                  <h3 className="font-semibold text-lg mb-2 text-foreground/90">3. Poin-poin Kunci</h3>
                  <ScrollArea className="h-auto w-full rounded-md border bg-muted/30 p-3 text-sm" id="summary-scroll-area-poin-kunci">
                     <p className="whitespace-pre-wrap leading-relaxed pb-2" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.poinPoinKunci) }} />
                  </ScrollArea>
                </div>
                <div id="summary-section-pembelajaran-insight">
                  <h3 className="font-semibold text-lg mb-2 text-foreground/90">4. Pembelajaran/Insight</h3>
                  <ScrollArea className="h-auto w-full rounded-md border bg-muted/30 p-3 text-sm" id="summary-scroll-area-pembelajaran-insight">
                    <p className="whitespace-pre-wrap leading-relaxed pb-2" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.pembelajaranInsight) }} />
                  </ScrollArea>
                </div>
                <div id="summary-section-kesimpulan">
                  <h3 className="font-semibold text-lg mb-2 text-foreground/90">5. Kesimpulan</h3>
                  <ScrollArea className="h-auto w-full rounded-md border bg-muted/30 p-3 text-sm" id="summary-scroll-area-kesimpulan">
                    <p className="whitespace-pre-wrap leading-relaxed pb-2" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.kesimpulan) }} />
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground pt-4">
          <p>Powered by AI. Summaries are for informational purposes and may not always be perfect.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
    

    