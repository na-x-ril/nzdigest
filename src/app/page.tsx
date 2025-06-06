
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, YoutubeIcon, FileTextIcon, SparklesIcon, AlertCircle, ListChecksIcon, KeyIcon, LightbulbIcon, CheckSquareIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import type { SummarizeTranscriptOutput } from '@/ai/schemas/transcript-summary-schemas';
import { cn } from '@/lib/utils';
import { useModel } from '@/contexts/ModelContext';

function formatSummaryText(text: string | undefined | null): string {
  if (!text) return '';

  let result = text;

  result = result.replace(/```[a-zA-Z]+\n/g, '```'); // Basic code block cleanup
  result = result.replace(/\*\*(.*?)\*\*/g, (_match, p1) => `<strong>${p1}</strong>`); // Bold with **
  result = result.replace(/\*(.*?)\*/g, (_match, p1) => `<em>${p1}</em>`); // Italics with * (changed from strong to em for differentiation)
  result = result.replace(/~(.*?)~/g, (_match, p1) => `<del>${p1}</del>`); // Strikethrough
  result = result.replace(/^### (.*)$/gm, (_match, p1) => `<h3>${p1}</h3>`); // H3
  result = result.replace(/^## (.*)$/gm, (_match, p1) => `<h2>${p1}</h2>`); // H2
  result = result.replace(/^# (.*)$/gm, (_match, p1) => `<h1>${p1}</h1>`); // H1
  
  // Handle simple markdown lists (unordered)
  result = result.replace(/^\s*[-*+]\s+(.*)/gm, (_match, p1) => `<li>${p1}</li>`);
  // Wrap sets of <li> in <ul>, this is a bit naive and might need refinement for complex cases
  if (result.includes("<li>")) {
      result = `<ul>${result.replace(/<\/li>\s*<li>/g, '</li><li>')}</ul>`;
      // Clean up potential empty <ul> or <ul><li></li></ul> which might result from regex
      result = result.replace(/<ul>\s*<\/ul>/g, '');
  }
  
  // Handle simple markdown lists (ordered)
  result = result.replace(/^\s*\d+\.\s+(.*)/gm, (_match, p1) => `<li class="ml-4">${p1}</li>`);
   if (result.includes('<li class="ml-4">')) {
       result = `<ol>${result.replace(/<\/li>\s*<li class="ml-4">/g, '</li><li class="ml-4">')}</ol>`;
       result = result.replace(/<ol>\s*<\/ol>/g, '');
   }

  result = result.replace(/\n/g, '<br />'); // Replace newlines with <br /> for HTML display

  return result;
}

const MAX_TRANSCRIPT_RETRIES = 3; // Reduced for faster feedback during debugging
const RETRY_DELAY_MS = 1500; 

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
  const { selectedModel } = useModel();

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

    // Client-side validation for selectedModel BEFORE any API call
    if (!selectedModel || typeof selectedModel !== 'string' || selectedModel.trim().length === 0) {
      const clientErrorMsg = `Client-side: Invalid AI model selected. Value: '${selectedModel}', Type: ${typeof selectedModel}. Please select a model.`;
      console.error(clientErrorMsg);
      setError("An AI model must be selected. Please check the dropdown.");
      toast({
        title: "Model Selection Error",
        description: "An AI model must be selected. Please check the dropdown.",
        variant: "destructive",
      });
      return; 
    }
    console.log(`[TubeDigestPage] Using model for API calls: '${selectedModel}'`);


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
            description: `Attempt ${attempt} failed: ${e.message}. Retrying...`,
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

    if (!transcriptFetched || !fetchedTranscriptContent.trim()) {
      setError(finalErrorForDisplay || "An unknown error occurred while fetching the transcript, or transcript is empty.");
      setTranscript(''); 
      setSummary(null);   
      return; 
    }
    
    setError(null); 
    setTranscript(fetchedTranscriptContent);
    
    setIsLoadingSummary(true);
    console.log(`[TubeDigestPage] Attempting to call /api/summarize with model: '${selectedModel}' and transcript length: ${fetchedTranscriptContent.length}`);

    try {
      const summaryResponse = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: fetchedTranscriptContent, model: selectedModel }),
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
          <div className="space-y-3 pt-6" id="url-input-section">
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
            <Alert variant="destructive" className="shadow-md mt-4" id="error-alert-section">
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
                <p className="text-sm whitespace-pre-wrap leading-relaxed pb-2">{transcript}</p>
              </ScrollArea>
            </div>
          )}
          
          {summary && typeof summary === 'object' && summary.topikUtama && !error && (
            <div id="summary-section" className="space-y-6 pt-6">
              <CardTitle className="flex items-center text-2xl font-headline mb-4">
                <SparklesIcon className="mr-3 h-6 w-6 text-primary" /> Detail Ringkasan
              </CardTitle>
              
              <div id="summary-section-topik-utama" className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center text-foreground/90">
                  <SparklesIcon className="mr-2 h-5 w-5 text-primary/80" />Topik Utama
                </h3>
                <ScrollArea className="h-auto max-h-60 w-full rounded-md border bg-muted/30 p-3 text-sm" id="summary-scroll-area-topik-utama">
                  <p className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.topikUtama) }} />
                </ScrollArea>
              </div>

              {summary.kronologiAlur && summary.kronologiAlur.length > 0 && (
                <div id="summary-section-kronologi-alur" className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center text-foreground/90">
                    <ListChecksIcon className="mr-2 h-5 w-5 text-primary/80" />Kronologi/Alur
                  </h3>
                  <ScrollArea className="h-auto max-h-72 w-full rounded-md border bg-muted/30 p-3 text-sm" id="summary-scroll-area-kronologi-alur">
                    <ul className="list-disc space-y-1.5 pl-5">
                      {summary.kronologiAlur.map((item, index) => (
                        <li key={`kronologi-${index}`} dangerouslySetInnerHTML={{ __html: formatSummaryText(item) }} />
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}

              {summary.poinPoinKunci && summary.poinPoinKunci.length > 0 && (
                <div id="summary-section-poin-kunci" className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center text-foreground/90">
                    <KeyIcon className="mr-2 h-5 w-5 text-primary/80" />Poin-poin Kunci
                  </h3>
                  <ScrollArea className="h-auto max-h-96 w-full rounded-md border bg-muted/30 p-3 text-sm" id="summary-scroll-area-poin-kunci">
                    <div className="space-y-3">
                      {summary.poinPoinKunci.map((item, index) => (
                        <div key={`poin-${index}`} className="rounded-md border border-border/50 p-2.5 bg-background/30">
                          {item.judul && <h4 className="font-medium text-foreground/95 mb-1" dangerouslySetInnerHTML={{ __html: formatSummaryText(item.judul) }} />}
                          {item.penjelasan && <p className="whitespace-pre-wrap leading-relaxed text-foreground/80" dangerouslySetInnerHTML={{ __html: formatSummaryText(item.penjelasan) }} />}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {summary.pembelajaranInsight && summary.pembelajaranInsight.length > 0 && (
                <div id="summary-section-pembelajaran-insight" className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center text-foreground/90">
                    <LightbulbIcon className="mr-2 h-5 w-5 text-primary/80" />Pembelajaran/Insight
                  </h3>
                  <ScrollArea className="h-auto max-h-96 w-full rounded-md border bg-muted/30 p-3 text-sm" id="summary-scroll-area-pembelajaran-insight">
                     <div className="space-y-3">
                      {summary.pembelajaranInsight.map((item, index) => (
                        <div key={`insight-${index}`} className="rounded-md border border-border/50 p-2.5 bg-background/30">
                          {item.judul && <h4 className="font-medium text-foreground/95 mb-1" dangerouslySetInnerHTML={{ __html: formatSummaryText(item.judul) }} />}
                          {item.penjelasan && <p className="whitespace-pre-wrap leading-relaxed text-foreground/80" dangerouslySetInnerHTML={{ __html: formatSummaryText(item.penjelasan) }} />}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              
              <div id="summary-section-kesimpulan" className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center text-foreground/90">
                  <CheckSquareIcon className="mr-2 h-5 w-5 text-primary/80" />Kesimpulan
                </h3>
                <ScrollArea className="h-auto max-h-60 w-full rounded-md border bg-muted/30 p-3 text-sm" id="summary-scroll-area-kesimpulan">
                  <p className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.kesimpulan) }} />
                </ScrollArea>
              </div>
            </div>
          )}
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground pt-4 pb-6">
          <p>Powered by AI. Summaries are for informational purposes and may not always be perfect.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
