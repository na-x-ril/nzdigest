import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'YouTube URL is required and must be a string.' }, { status: 400 });
    }

    // Basic check if it's a YouTube URL pattern
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    if (!youtubeRegex.test(url)) {
        return NextResponse.json({ error: 'Invalid YouTube URL format.' }, { status: 400 });
    }
    
    const transcriptResponse = await YoutubeTranscript.fetchTranscript(url);
    
    if (!transcriptResponse || transcriptResponse.length === 0) {
      return NextResponse.json({ error: 'No transcript found for this video or it might be unavailable.' }, { status: 404 });
    }

    const transcriptText = transcriptResponse.map(item => item.text).join(' ');

    return NextResponse.json({ transcript: transcriptText });
  } catch (error: any) {
    console.error('Error fetching transcript:', error);
    let errorMessage = 'Failed to fetch transcript. The video might not have transcripts available or the URL is incorrect.';
    if (error.message) {
        if (error.message.includes('transcripts disabled')) {
            errorMessage = 'Transcripts are disabled for this video.';
        } else if (error.message.includes('No transcript found')) {
            errorMessage = 'No transcript could be found for this video.';
        } else if (error.message.includes('is not a valid video Id')) {
            errorMessage = 'Invalid YouTube video ID extracted from URL.';
        }
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
