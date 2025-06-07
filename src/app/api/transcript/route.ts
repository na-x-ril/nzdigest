
import { NextResponse } from 'next/server';
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";

async function fetchVideoPageHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        // Some basic headers to mimic a browser request
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    if (!response.ok) {
      console.error(`Failed to fetch video page HTML: ${response.status} ${response.statusText}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching video page HTML:', error);
    return null;
  }
}

function parseYtInitialData(html: string): any | null {
  try {
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/s);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
    console.warn('Could not find ytInitialData in HTML.');
    return null;
  } catch (error) {
    console.error('Error parsing ytInitialData:', error);
    return null;
  }
}

export async function POST(request: Request) {
  let videoTitle: string | undefined = undefined;
  let channelName: string | undefined = undefined;
  let uploadDate: string | undefined = undefined;

  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'YouTube URL is required and must be a string.' }, { status: 400 });
    }

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    if (!youtubeRegex.test(url)) {
        return NextResponse.json({ error: 'Invalid YouTube URL format.' }, { status: 400 });
    }
    
    console.log(`Fetching details for URL: ${url}`);

    const videoPageHtml = await fetchVideoPageHtml(url);
    if (videoPageHtml) {
      const ytInitialData = parseYtInitialData(videoPageHtml);
      if (ytInitialData) {
        try {
          videoTitle = ytInitialData.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[0]?.videoPrimaryInfoRenderer?.title?.runs?.[0]?.text;
          channelName = ytInitialData.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[1]?.videoSecondaryInfoRenderer?.owner?.videoOwnerRenderer?.title?.runs?.[0]?.text;
          uploadDate = ytInitialData.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[0]?.videoPrimaryInfoRenderer?.relativeDateText?.simpleText;
          
          console.log('Parsed ytInitialData:', { videoTitle, channelName, uploadDate });
        } catch (e) {
          console.warn('Error accessing paths in ytInitialData:', e);
        }
      }
    } else {
      console.warn('Could not fetch video page HTML to extract ytInitialData.');
    }

    console.log(`Fetching transcript for URL: ${url} using Langchain YoutubeLoader`);
    const loader = YoutubeLoader.createFromUrl(url, {
      addVideoInfo: false, 
    });

    const docs = await loader.load();

    if (!docs || docs.length === 0 || !docs[0].pageContent) {
      console.warn(`No transcript content found by Langchain for ${url}. Docs:`, docs);
      return NextResponse.json({ 
        error: 'No transcript found for this video or it might be unavailable.',
        videoTitle,
        channelName,
        uploadDate
      }, { status: 404 });
    }

    const transcriptText = docs.map(doc => doc.pageContent).join(' ');

    if (!transcriptText.trim()) {
      console.warn(`Empty transcript text after joining parts for ${url}. Docs:`, docs);
      return NextResponse.json({ 
        error: 'Transcript found but it is empty.',
        videoTitle,
        channelName,
        uploadDate
      }, { status: 404 });
    }
    
    console.log(`Successfully fetched transcript and details for ${url} using Langchain.`);
    return NextResponse.json({ 
      transcript: transcriptText,
      videoTitle,
      channelName,
      uploadDate 
    });

  } catch (error: any) {
    console.error('Error fetching transcript/details with Langchain YoutubeLoader or ytInitialData parsing:', error);
    
    let detailedErrorMessage = 'Failed to fetch transcript. The video might not have transcripts available or an unexpected error occurred.';
    let statusCode = 500;

    if (error && typeof error.message === 'string') {
      if (error.message.includes('Could not retrieve video metadata') || error.message.includes('Could not find player script')) {
        detailedErrorMessage = 'Could not retrieve video metadata. The URL might be invalid or the video is unavailable.';
        statusCode = 400;
      } else if (error.message.includes('Transcripts are disabled for this video')) {
        detailedErrorMessage = 'Transcripts are disabled for this video.';
        statusCode = 404;
      } else if (error.message.includes('No transcript found for this video')) {
        detailedErrorMessage = 'No transcript could be found for this video.';
        statusCode = 404;
      } else if (error.message.includes('is not a valid video ID')) {
          detailedErrorMessage = 'Invalid YouTube video ID extracted from URL.';
          statusCode = 400;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
          detailedErrorMessage = 'A network error occurred while trying to fetch the transcript.';
      } else {
        detailedErrorMessage = `An error occurred: ${error.message}`;
      }
    } else if (typeof error === 'string') {
      detailedErrorMessage = `An error occurred: ${error}`;
    }

    console.error('Full error object during transcript fetching:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return NextResponse.json({ 
      error: detailedErrorMessage,
      videoTitle, // Still return any details we might have gotten
      channelName,
      uploadDate
    }, { status: statusCode });
  }
}
