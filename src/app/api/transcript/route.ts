
import { NextResponse } from 'next/server';
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import type { Innertube } from 'youtubei.js';

// Helper function to find data using multiple regex patterns, inspired by example/yt.js
function getData(text: string, patterns: RegExp[]): any | null {
  try {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        try {
          return JSON.parse(match[1]);
        } catch (e) {
          console.warn(`Failed to parse JSON for pattern: ${pattern}`);
          continue;
        }
      }
    }
    return null;
  } catch (error) {
    console.error(`Error in getData: ${error}`);
    return null;
  }
}

// Helper function to get ytInitialData, inspired by example/yt.js
function getYTInitialData(text: string): any | null {
  const patterns = [
    /window\["ytInitialData"\] = ({.*?});<\/script>/s,
    /ytInitialData = ({.*?});<\/script>/s,
    /var ytInitialData = ({.*?});/s,
  ];
  return getData(text, patterns);
}

// Extracts detailed video info from the page's HTML content
async function getVideoDetailsFromHTML(url: string, language: string) {
    try {
        const response = await fetch(url, {
            headers: {
                'Accept-Language': `${language},en;q=0.9` 
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch video page: ${response.statusText}`);
        }
        const html = await response.text();
        const ytInitialData = getYTInitialData(html);

        if (!ytInitialData) {
            throw new Error("Could not find ytInitialData on the page.");
        }
        
        const primaryInfo = ytInitialData.contents?.twoColumnWatchNextResults?.results?.results?.contents?.find((c: any) => c.videoPrimaryInfoRenderer)?.videoPrimaryInfoRenderer;
        const secondaryInfo = ytInitialData.contents?.twoColumnWatchNextResults?.results?.results?.contents?.find((c: any) => c.videoSecondaryInfoRenderer)?.videoSecondaryInfoRenderer;

        if (!primaryInfo || !secondaryInfo) {
            throw new Error("Could not extract primary or secondary info from ytInitialData.");
        }

        const title = primaryInfo.title?.runs?.map((r: any) => r.text).join('') || "No title found";
        const channelName = secondaryInfo.owner?.videoOwnerRenderer?.title?.runs?.[0]?.text || "No channel found";
        const uploadDate = primaryInfo.relativeDateText?.simpleText || primaryInfo.dateText?.simpleText || "No date found";
        
        let viewCount = "0";
        if (primaryInfo.viewCount?.videoViewCountRenderer?.viewCount?.simpleText) {
             viewCount = primaryInfo.viewCount.videoViewCountRenderer.viewCount.simpleText.replace(/[^0-9]/g, '');
        } else if (primaryInfo.viewCount?.videoViewCountRenderer?.originalViewCount) {
             viewCount = primaryInfo.viewCount.videoViewCountRenderer.originalViewCount;
        }

        return {
            title,
            channelName,
            uploadDate,
            viewCount: parseInt(viewCount, 10).toLocaleString(language === 'id' ? 'id-ID' : 'en-US'),
        };

    } catch (error: any) {
        console.error(`Error in getVideoDetailsFromHTML: ${error.message}`);
        // Return null or partial data so the main function can decide how to proceed
        return {
            title: 'Details unavailable',
            channelName: 'Details unavailable',
            uploadDate: 'Details unavailable',
            viewCount: 'N/A'
        };
    }
}


export async function POST(request: Request) {
  try {
    const { url, language } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'YouTube URL is required and must be a string.' }, { status: 400 });
    }

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    if (!youtubeRegex.test(url)) {
        return NextResponse.json({ error: 'Invalid YouTube URL format.' }, { status: 400 });
    }
    
    console.log(`Fetching transcript for URL: ${url} with language: ${language}`);
    
    // Fetch detailed video info using the new method
    const videoDetails = await getVideoDetailsFromHTML(url, language);

    // Fetch transcript using the existing langchain loader
    const loader = YoutubeLoader.createFromUrl(url, {
      language: language || 'en',
      addVideoInfo: false, // We have our own info now
    });

    const docs = await loader.load();

    if (!docs || docs.length === 0 || !docs[0].pageContent) {
      console.warn(`No transcript content found by Langchain for ${url}. Docs:`, docs);
      return NextResponse.json({ 
        error: 'No transcript found for this video or it might be unavailable.',
        ...videoDetails // Still return details even if transcript fails
      }, { status: 404 });
    }

    const transcriptText = docs.map(doc => doc.pageContent).join(' ');

    if (!transcriptText.trim()) {
      console.warn(`Empty transcript text after joining parts for ${url}. Docs:`, docs);
      return NextResponse.json({ 
        error: 'Transcript found but it is empty.',
        ...videoDetails // Still return details
      }, { status: 404 });
    }
    
    console.log(`Successfully fetched transcript and details for ${url}.`);
    return NextResponse.json({ 
      transcript: transcriptText,
      videoTitle: videoDetails.title,
      channelName: videoDetails.channelName,
      uploadDate: videoDetails.uploadDate,
      viewCount: videoDetails.viewCount
    });

  } catch (error: any) {
    console.error('Error in transcript API route:', error);
    
    let detailedErrorMessage = 'Failed to fetch transcript. The video might not have transcripts available or an unexpected error occurred.';
    let statusCode = 500;

    if (error && typeof error.message === 'string') {
        const lowerCaseError = error.message.toLowerCase();
        if (lowerCaseError.includes('could not retrieve video metadata') || lowerCaseError.includes('could not find player script')) {
            detailedErrorMessage = 'Could not retrieve video metadata. The URL might be invalid or the video is unavailable.';
            statusCode = 400;
        } else if (lowerCaseError.includes('transcripts are disabled')) {
            detailedErrorMessage = 'Transcripts are disabled for this video.';
            statusCode = 404;
        } else if (lowerCaseError.includes('no transcript found')) {
            detailedErrorMessage = 'No transcript could be found for this video.';
            statusCode = 404;
        } else if (lowerCaseError.includes('is not a valid video id')) {
            detailedErrorMessage = 'Invalid YouTube video ID extracted from URL.';
            statusCode = 400;
        }
    }

    return NextResponse.json({ 
      error: detailedErrorMessage,
      videoTitle: 'Error',
      channelName: 'Error',
      uploadDate: 'Error',
      viewCount: 'Error',
    }, { status: statusCode });
  }
}
