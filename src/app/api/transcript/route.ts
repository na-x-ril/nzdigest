
import { NextResponse } from 'next/server';
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";

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
    const loader = YoutubeLoader.createFromUrl(url, {
      language: language || 'en',
      addVideoInfo: true, 
    });

    const docs = await loader.load();

    if (!docs || docs.length === 0 || !docs[0].pageContent) {
      console.warn(`No transcript content found by Langchain for ${url}. Docs:`, docs);
      return NextResponse.json({ 
        error: 'No transcript found for this video or it might be unavailable.',
        videoTitle: docs[0]?.metadata?.title,
        channelName: docs[0]?.metadata?.author,
        uploadDate: undefined // Langchain loader doesn't provide this easily
      }, { status: 404 });
    }

    const transcriptText = docs.map(doc => doc.pageContent).join(' ');
    const metadata = docs[0]?.metadata;

    if (!transcriptText.trim()) {
      console.warn(`Empty transcript text after joining parts for ${url}. Docs:`, docs);
      return NextResponse.json({ 
        error: 'Transcript found but it is empty.',
        videoTitle: metadata?.title,
        channelName: metadata?.author,
        uploadDate: undefined
      }, { status: 404 });
    }
    
    console.log(`Successfully fetched transcript and details for ${url} using Langchain.`);
    return NextResponse.json({ 
      transcript: transcriptText,
      videoTitle: metadata?.title,
      channelName: metadata?.author,
      uploadDate: undefined 
    });

  } catch (error: any) {
    console.error('Error fetching transcript/details with Langchain YoutubeLoader:', error);
    
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
      videoTitle: undefined,
      channelName: undefined,
      uploadDate: undefined
    }, { status: statusCode });
  }
}
