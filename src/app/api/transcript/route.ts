
import { NextResponse } from 'next/server';
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'YouTube URL is required and must be a string.' }, { status: 400 });
    }

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    if (!youtubeRegex.test(url)) {
        return NextResponse.json({ error: 'Invalid YouTube URL format.' }, { status: 400 });
    }
    
    console.log(`Fetching transcript for URL: ${url} using Langchain YoutubeLoader`);

    const loader = YoutubeLoader.createFromUrl(url, {
      // language: "en", // Default to let youtubei.js handle language or use video's default
      addVideoInfo: false, // We only need the transcript text for now
    });

    const docs = await loader.load();

    if (!docs || docs.length === 0 || !docs[0].pageContent) {
      console.warn(`No transcript content found by Langchain for ${url}. Docs:`, docs);
      return NextResponse.json({ error: 'No transcript found for this video or it might be unavailable.' }, { status: 404 });
    }

    const transcriptText = docs.map(doc => doc.pageContent).join(' ');

    if (!transcriptText.trim()) {
      console.warn(`Empty transcript text after joining parts for ${url}. Docs:`, docs);
      return NextResponse.json({ error: 'Transcript found but it is empty.' }, { status: 404 });
    }
    
    console.log(`Successfully fetched transcript for ${url} using Langchain.`);
    return NextResponse.json({ transcript: transcriptText });

  } catch (error: any) {
    console.error('Error fetching transcript with Langchain YoutubeLoader:', error);
    
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

    console.error('Full error object during transcript fetching (Langchain):', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return NextResponse.json({ error: detailedErrorMessage }, { status: statusCode });
  }
}
