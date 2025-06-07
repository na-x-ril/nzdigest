
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, FileTextIcon, SparklesIcon, AlertCircle, ListChecksIcon, KeyIcon, LightbulbIcon, CheckSquareIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import type { SummarizeTranscriptOutput } from '@/ai/schemas/transcript-summary-schemas';
import { cn } from '@/lib/utils';
import { useModel } from '@/contexts/ModelContext';

function formatSummaryText(text: string | undefined | null): string {
  if (!text) return '';

  let result = text;

  result = result.replace(/```[a-zA-Z]+\n/g, '```'); 
  result = result.replace(/\*\*(.*?)\*\*/g, (_match, p1) => `<strong>${p1}</strong>`); 
  result = result.replace(/\*(.*?)\*/g, (_match, p1) => `<em>${p1}</em>`); 
  result = result.replace(/~(.*?)~/g, (_match, p1) => `<del>${p1}</del>`); 
  result = result.replace(/^### (.*)$/gm, (_match, p1) => `<h3>${p1}</h3>`); 
  result = result.replace(/^## (.*)$/gm, (_match, p1) => `<h2>${p1}</h2>`); 
  result = result.replace(/^# (.*)$/gm, (_match, p1) => `<h1>${p1}</h1>`); 
  
  
  result = result.replace(/^\s*[-*+]\s+(.*)/gm, (_match, p1) => `<li>${p1}</li>`);
  
  if (result.includes("<li>")) {
      result = `<ul>${result.replace(/<\/li>\s*<li>/g, '</li><li>')}</ul>`;
      
      result = result.replace(/<ul>\s*<\/ul>/g, '');
  }
  
  
  result = result.replace(/^\s*\d+\.\s+(.*)/gm, (_match, p1) => `<li class="ml-4">${p1}</li>`);
   if (result.includes('<li class="ml-4">')) {
       result = `<ol>${result.replace(/<\/li>\s*<li class="ml-4">/g, '</li><li class="ml-4">')}</ol>`;
       result = result.replace(/<ol>\s*<\/ol>/g, '');
   }

  result = result.replace(/\n/g, '<br />'); 

  return result;
}

const MAX_TRANSCRIPT_RETRIES = 3; 
const RETRY_DELAY_MS = 1500; 

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function NZDigestPage() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState<SummarizeTranscriptOutput | null>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { selectedModel } = useModel();
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    urlInputRef.current?.focus();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const isButtonDisabled = !youtubeUrl || isLoadingTranscript || isLoadingSummary;
      if (!isButtonDisabled) {
        event.preventDefault();
        handleSubmit();
      }
    }
  };

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
    console.log(`[NZDigestPage] Using model for API calls: '${selectedModel}'`);


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
        finalErrorForDisplay = e.message || "An unknown error occurred while fetching transcript.";
        
        if (e.message && e.message.includes('Invalid YouTube URL format.')) {
            transcriptFetched = false;
            break; 
        }

        if (attempt < MAX_TRANSCRIPT_RETRIES) {
          toast({
            title: "Transcript Fetch Failed",
            description: `Attempt ${attempt} failed: ${finalErrorForDisplay}. Retrying...`,
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
      setError(finalErrorForDisplay || "Could not fetch transcript or transcript is empty. The video might not have transcripts available, or it's too short.");
      setTranscript(''); 
      setSummary(null);   
      return; 
    }
    
    setError(null); 
    setTranscript(fetchedTranscriptContent);
    
    setIsLoadingSummary(true);
    console.log(`[NZDigestPage] Attempting to call /api/summarize with model: '${selectedModel}' and transcript length: ${fetchedTranscriptContent.length}`);

    try {
      const summaryResponse = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: fetchedTranscriptContent, model: selectedModel }),
      });

      const summaryData = await summaryResponse.json();

      if (!summaryResponse.ok) {
        const errorMsg = summaryData.error || `Failed to generate summary (status: ${summaryResponse.status})`;
        let fullErrorDetails = summaryData.details || errorMsg; // Use details if available for more context
        // We pass the fullErrorDetails to the Error constructor so that we can parse it below if needed
        throw new Error(fullErrorDetails);
      }
      setSummary(summaryData);
      toast({
        title: "Summary Generated",
        description: "Successfully generated the video summary.",
      });
    } catch (summaryError: any) {
      let displayError = "An unexpected error occurred while generating the summary.";
      if (summaryError && typeof summaryError.message === 'string') {
          const errorMessageContent = summaryError.message; // This might contain the JSON string
          const lowerMessage = errorMessageContent.toLowerCase();
          const isGroqModelSelected = selectedModel.startsWith('llama') || selectedModel.startsWith('meta-llama') || selectedModel.startsWith('deepseek') || selectedModel.startsWith('qwen');

          if (
            (lowerMessage.includes('413') || lowerMessage.includes('request too large') || lowerMessage.includes('rate_limit_exceeded') || lowerMessage.includes('reduce your message size')) &&
            isGroqModelSelected
          ) {
            let limit = "N/A";
            let requested = "N/A";
            try {
                // Attempt to extract the JSON part of the error
                const jsonErrorMatch = errorMessageContent.match(/{.*}/);
                if (jsonErrorMatch && jsonErrorMatch[0]) {
                    const errorDetails = JSON.parse(jsonErrorMatch[0]);
                    if (errorDetails.error && errorDetails.error.message) {
                        const detailMsg = errorDetails.error.message;
                        const limitMatch = detailMsg.match(/Limit (\d+)/);
                        const requestedMatch = detailMsg.match(/Requested (\d+)/);
                        if (limitMatch && limitMatch[1]) limit = limitMatch[1];
                        if (requestedMatch && requestedMatch[1]) requested = requestedMatch[1];
                    }
                }
            } catch (e) {
                console.warn("Could not parse token limit/requested from error message string:", e);
            }
            displayError = `The video transcript is too long for the selected AI model (Requested: ${requested} tokens, Limit: ${limit} tokens). Please try a different model (e.g., Gemini Flash) or choose a shorter video.`;
          } else if (lowerMessage.includes('failed to generate summary content') || lowerMessage.includes('unexpected format') || lowerMessage.includes('did not match expected schema')) {
            displayError = "The AI model couldn't process the transcript or returned an unexpected response. This can sometimes happen with complex or unusual video content. You could try again, select a different AI model, or use a different video.";
          } else if (lowerMessage.includes('transcript cannot be empty')) {
              displayError = "The transcript provided was empty. A summary cannot be generated without content.";
          } else if (lowerMessage.includes('model selection is required') || lowerMessage.includes('unsupported model')) {
              displayError = "Please select a valid AI model from the dropdown menu before generating a summary.";
          } else {
              displayError = errorMessageContent; // Use the specific error message if not handled above
          }
      }
      setError(displayError);
      setSummary(null); 
      toast({
        title: "Summarization Error",
        description: displayError,
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
          <div className="flex justify-center items-center my-4">
             <h1 className="text-7xl font-bold text-primary" style={{ letterSpacing: '-0.075em' }}>
                NZD
              </h1>
          </div>
          <CardTitle className="flex justify-center text-4xl font-headline tracking-tight gap-2">
            <span style={{ letterSpacing: '-0.075em' }}>NZD</span><span className="ml-[4px] text-primary">igest</span>
          </CardTitle>
          <CardDescription className="text-lg">
            Enter a YouTube URL to get its transcript and a concise AI-powered summary.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 px-6 pt-0 pb-2">
          <div className="space-y-3 pt-6" id="url-input-section">
            <Input
              ref={urlInputRef}
              id="youtube-url-input"
              type="url"
              placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              onKeyDown={handleKeyDown}
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
                <ScrollArea className="w-full rounded-md border bg-muted/30 p-4 text-sm" id="summary-scroll-area-topik-utama">
                  <p className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.topikUtama) }} />
                </ScrollArea>
              </div>

              {summary.kronologiAlur && summary.kronologiAlur.length > 0 && (
                <div id="summary-section-kronologi-alur" className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center text-foreground/90">
                    <ListChecksIcon className="mr-2 h-5 w-5 text-primary/80" />Kronologi/Alur
                  </h3>
                  <ScrollArea className="w-full rounded-md border bg-muted/30 p-4 text-sm" id="summary-scroll-area-kronologi-alur">
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
                    <ScrollArea className="w-full rounded-md border bg-muted/30 p-4 text-sm" id="summary-scroll-area-poin-kunci">
                        {summary.poinPoinKunci.map((item, index) => (
                            <p key={`poin-${index}`} className="whitespace-pre-wrap leading-relaxed text-foreground/80 mb-3 last:mb-0">
                                {item.judul && <strong className="text-foreground/95" dangerouslySetInnerHTML={{ __html: formatSummaryText(item.judul) + ": " }} />}
                                {item.penjelasan && <span dangerouslySetInnerHTML={{ __html: formatSummaryText(item.penjelasan) }} />}
                            </p>
                        ))}
                    </ScrollArea>
                </div>
              )}

              {summary.pembelajaranInsight && summary.pembelajaranInsight.length > 0 && (
                <div id="summary-section-pembelajaran-insight" className="space-y-2">
                    <h3 className="font-semibold text-lg flex items-center text-foreground/90">
                        <LightbulbIcon className="mr-2 h-5 w-5 text-primary/80" />Pembelajaran/Insight
                    </h3>
                    <ScrollArea className="w-full rounded-md border bg-muted/30 p-4 text-sm" id="summary-scroll-area-pembelajaran-insight">
                        {summary.pembelajaranInsight.map((item, index) => (
                            <p key={`insight-${index}`} className="whitespace-pre-wrap leading-relaxed text-foreground/80 mb-3 last:mb-0">
                                {item.judul && <strong className="text-foreground/95" dangerouslySetInnerHTML={{ __html: formatSummaryText(item.judul) + ": " }} />}
                                {item.penjelasan && <span dangerouslySetInnerHTML={{ __html: formatSummaryText(item.penjelasan) }} />}
                            </p>
                        ))}
                    </ScrollArea>
                </div>
              )}
              
              <div id="summary-section-kesimpulan" className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center text-foreground/90">
                  <CheckSquareIcon className="mr-2 h-5 w-5 text-primary/80" />Kesimpulan
                </h3>
                <ScrollArea className="w-full rounded-md border bg-muted/30 p-4 text-sm" id="summary-scroll-area-kesimpulan">
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

    

    