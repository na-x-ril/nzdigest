
"use client";

import { useState, useEffect, useRef } from 'react';
import {useTranslations, useLocale} from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, FileTextIcon, SparklesIcon, AlertCircle, ListChecksIcon, KeyIcon, LightbulbIcon, CheckSquareIcon, YoutubeIcon, UserIcon, CalendarDaysIcon, InfoIcon, EyeIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

interface VideoDetails {
  title?: string;
  channelName?: string;
  uploadDate?: string;
  viewCount?: string;
}

export default function NZDigestPage() {
  const t = useTranslations('HomePage');
  const t_toast = useTranslations('Toast');
  const locale = useLocale();

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState<SummarizeTranscriptOutput | null>(null);
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
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
    setVideoDetails(null);

    if (!youtubeUrl) {
      setError(t_toast('errorInvalidUrl'));
      toast({
        title: t_toast('errorInputTitle'),
        description: t_toast('errorInvalidUrl'),
        variant: "destructive",
      });
      return;
    }

    
    if (!selectedModel || typeof selectedModel !== 'string' || selectedModel.trim().length === 0) {
      const clientErrorMsg = `Client-side: Invalid AI model selected. Value: '${selectedModel}', Type: ${typeof selectedModel}. Please select a model.`;
      console.error(clientErrorMsg);
      setError(t_toast('errorInvalidModel'));
      toast({
        title: t_toast('errorModelSelectionTitle'),
        description: t_toast('errorInvalidModel'),
        variant: "destructive",
      });
      return; 
    }
    console.log(`[NZDigestPage] Using model for API calls: '${selectedModel}'`);


    setIsLoadingTranscript(true);
    let transcriptFetched = false;
    let fetchedTranscriptContent = '';
    let fetchedVideoDetails: VideoDetails | null = null;
    let finalErrorForDisplay: string | null = null;

    for (let attempt = 1; attempt <= MAX_TRANSCRIPT_RETRIES; attempt++) {
      try {
        toast({
          title: t_toast('fetchingTitle'),
          description: t_toast('fetchingAttempt', { attempt, max: MAX_TRANSCRIPT_RETRIES }),
        });
        const transcriptResponse = await fetch('/api/transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: youtubeUrl, language: locale }),
        });

        const responseBody = await transcriptResponse.json();

        if (responseBody.videoTitle || responseBody.channelName || responseBody.uploadDate) {
          fetchedVideoDetails = {
            title: responseBody.videoTitle,
            channelName: responseBody.channelName,
            uploadDate: responseBody.uploadDate,
            viewCount: responseBody.viewCount,
          };
        }

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
          title: t_toast('fetchSuccessTitle'),
          description: t_toast('fetchSuccessDesc'),
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
            title: t_toast('fetchFailedTitle'),
            description: t_toast('fetchFailedDesc', { attempt, message: finalErrorForDisplay }),
            variant: "destructive",
          });
          await sleep(RETRY_DELAY_MS);
        } else {
          toast({
            title: t_toast('fetchErrorTitle'),
            description: t_toast('fetchErrorDesc', { attempts: attempt, message: finalErrorForDisplay }),
            variant: "destructive",
          });
        }
      }
    }

    setIsLoadingTranscript(false);
    
    if (fetchedVideoDetails) {
      setVideoDetails(fetchedVideoDetails);
    }

    if (!transcriptFetched || !fetchedTranscriptContent.trim()) {
      setError(finalErrorForDisplay || t_toast('errorEmptyTranscript'));
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
        body: JSON.stringify({ transcript: fetchedTranscriptContent, model: selectedModel, language: locale }),
      });

      const summaryData = await summaryResponse.json();

      if (!summaryResponse.ok) {
        const errorMsg = summaryData.error || `Failed to generate summary (status: ${summaryResponse.status})`;
        let fullErrorDetails = summaryData.details || errorMsg;
        throw new Error(fullErrorDetails);
      }
      setSummary(summaryData);
      toast({
        title: t_toast('summarySuccessTitle'),
        description: t_toast('summarySuccessDesc'),
      });
    } catch (summaryError: any) {
      let displayError = t_toast('summaryErrorDesc');
      if (summaryError && typeof summaryError.message === 'string') {
          const errorMessageContent = summaryError.message; 
          const lowerMessage = errorMessageContent.toLowerCase();
          const isGroqModelSelected = selectedModel.startsWith('llama') || selectedModel.startsWith('meta-llama') || selectedModel.startsWith('deepseek') || selectedModel.startsWith('qwen');

          if (
            (lowerMessage.includes('413') || lowerMessage.includes('request too large') || lowerMessage.includes('rate_limit_exceeded') || lowerMessage.includes('reduce your message size')) &&
            isGroqModelSelected
          ) {
            let limit = "N/A";
            let requested = "N/A";
            try {
                const jsonErrorMatch = errorMessageContent.match(/{.*}/s);
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
            displayError = t_toast('errorTokenLimit', { requested, limit });
          } else if (lowerMessage.includes('failed to generate summary content') || lowerMessage.includes('unexpected format') || lowerMessage.includes('did not match expected schema')) {
            displayError = t_toast('errorUnexpectedFormat');
          } else if (lowerMessage.includes('transcript cannot be empty')) {
              displayError = t_toast('errorEmptyTranscript');
          } else if (lowerMessage.includes('model selection is required') || lowerMessage.includes('unsupported model')) {
              displayError = t_toast('errorInvalidModel');
          } else {
              displayError = errorMessageContent; 
          }
      }
      setError(displayError);
      setSummary(null); 
      toast({
        title: t_toast('summaryErrorTitle'),
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
          <div className="flex justify-center items-center mt-2">
              <h1 className="text-8xl sm:font-bold md:font-bold lg:font-semibold xl:font-semibold text-primary" style={{ letterSpacing: '-0.13em' }}>
                NZD
              </h1>
          </div>
          <CardTitle className="flex justify-center text-4xl font-headline tracking-tight">
            <span className="font-bold" style={{ letterSpacing: '-0.13em' }}>NZD</span><span className="ml-[3px] font-bold text-primary">igest</span>
          </CardTitle>
          <CardDescription className="text-lg">
            {t('description')}
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
              {isLoadingTranscript ? t('digestButtonLoadingTranscript') : isLoadingSummary ? t('digestButtonLoadingSummary') : t('digestButton')}
            </Button>
          </div>


          {videoDetails && (
            <Card className="mt-6 bg-muted/20 shadow-md" id="video-details-collapsible-card">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="video-details" className="border-b-0">
                  <AccordionTrigger className="py-3 px-4 hover:no-underline">
                    <CardTitle className="text-xl font-headline flex items-center">
                      <InfoIcon className="mr-2 h-5 w-5 text-primary" />
                      {t('videoDetails')}
                    </CardTitle>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <CardContent className="text-sm space-y-1.5 px-4 pb-4 pt-1">
                      {videoDetails.title && (
                        <div className="flex items-start">
                          <YoutubeIcon className="mr-2 h-4 w-4 text-primary/80 flex-shrink-0 mt-0.5" />
                          <span className="font-medium">{t('videoTitle')}:</span>
                          <span className="ml-1.5 text-foreground/90 break-words">{videoDetails.title}</span>
                        </div>
                      )}
                      {videoDetails.channelName && (
                        <div className="flex items-start">
                          <UserIcon className="mr-2 h-4 w-4 text-primary/80 flex-shrink-0 mt-0.5" />
                          <span className="font-medium">{t('videoChannel')}:</span>
                          <span className="ml-1.5 text-foreground/90 break-words">{videoDetails.channelName}</span>
                        </div>
                      )}
                      {videoDetails.uploadDate && (
                        <div className="flex items-start">
                          <CalendarDaysIcon className="mr-2 h-4 w-4 text-primary/80 flex-shrink-0 mt-0.5" />
                          <span className="font-medium">{t('videoUploaded')}:</span>
                          <span className="ml-1.5 text-foreground/90 break-words">{videoDetails.uploadDate}</span>
                        </div>
                      )}
                       {videoDetails.viewCount && (
                        <div className="flex items-start">
                          <EyeIcon className="mr-2 h-4 w-4 text-primary/80 flex-shrink-0 mt-0.5" />
                          <span className="font-medium">{t('videoViews')}:</span>
                          <span className="ml-1.5 text-foreground/90 break-words">{videoDetails.viewCount}</span>
                        </div>
                      )}
                    </CardContent>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          )}

          {transcript && (
            <div id="transcript-section" className="space-y-3 pt-4">
              <CardTitle className="flex items-center text-2xl font-headline">
                <FileTextIcon className="mr-3 h-6 w-6 text-primary" /> {t('transcript')}
              </CardTitle>
              <ScrollArea className="h-64 w-full rounded-md border bg-muted/30 p-4" id="transcript-scroll-area">
                <p className="text-sm whitespace-pre-wrap leading-relaxed pb-2">{transcript}</p>
              </ScrollArea>
            </div>
          )}
          
          {summary && typeof summary === 'object' && summary.topikUtama && (
            <div id="summary-section" className="space-y-6 pt-6">
              <CardTitle className="flex items-center text-2xl font-headline mb-4">
                <SparklesIcon className="mr-3 h-6 w-6 text-primary" /> {t('summaryDetails')}
              </CardTitle>
              
              <div id="summary-section-topik-utama" className="space-y-2">
                <h3 className="font-semibold text-lg flex items-center text-foreground/90">
                  <SparklesIcon className="mr-2 h-5 w-5 text-primary/80" />{t('mainTopic')}
                </h3>
                <ScrollArea className="w-full rounded-md border bg-muted/30 p-4 text-sm" id="summary-scroll-area-topik-utama">
                  <p className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.topikUtama) }} />
                </ScrollArea>
              </div>

              {summary.kronologiAlur && summary.kronologiAlur.length > 0 && (
                <div id="summary-section-kronologi-alur" className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center text-foreground/90">
                    <ListChecksIcon className="mr-2 h-5 w-5 text-primary/80" />{t('chronology')}
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
                        <KeyIcon className="mr-2 h-5 w-5 text-primary/80" />{t('keyPoints')}
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
                        <LightbulbIcon className="mr-2 h-5 w-5 text-primary/80" />{t('insights')}
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
                  <CheckSquareIcon className="mr-2 h-5 w-5 text-primary/80" />{t('conclusion')}
                </h3>
                <ScrollArea className="w-full rounded-md border bg-muted/30 p-4 text-sm" id="summary-scroll-area-kesimpulan">
                  <p className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: formatSummaryText(summary.kesimpulan) }} />
                </ScrollArea>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="shadow-md mt-4" id="error-alert-section">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground pt-4 pb-6">
          <p>Powered by AI. Summaries are for informational purposes and may not always be perfect.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
