import { NextResponse } from 'next/server';
import { summarizeTranscript, type SummarizeTranscriptInput } from '@/ai/flows/summarize-transcript-flow';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transcript = body.transcript;

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Transcript is required and must be a string.' }, { status: 400 });
    }

    if (transcript.trim().length === 0) {
      return NextResponse.json({ error: 'Transcript cannot be empty.' }, { status: 400 });
    }

    const input: SummarizeTranscriptInput = { transcript };
    const result = await summarizeTranscript(input);

    if (!result || !result.summary) {
        return NextResponse.json({ error: 'Failed to generate summary content from AI.' }, { status: 500 });
    }

    return NextResponse.json({ summary: result.summary });
  } catch (error: any) {
    console.error('Error generating summary:', error);
    let message = 'Failed to generate summary.';
    if (error.message) {
        message = `Failed to generate summary: ${error.message}`;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
