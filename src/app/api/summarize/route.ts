
import { NextResponse } from 'next/server';
import { type SummarizeTranscriptGroqInput,
} from '@/ai/schemas/transcript-summary-schemas';
import { summarizeTranscript as summarizeTranscriptGroq } from '@/ai/flows/summarize-transcript-flow';
import { summarizeTranscriptGemini } from '@/ai/flows/summarize-transcript-gemini-flow';
import { type SummarizeTranscriptGeminiInput } from '@/ai/schemas/transcript-summary-schemas'
import type { SummarizeTranscriptOutput } from '@/ai/schemas/transcript-summary-schemas';
import { GROQ_MODELS, Model } from '@/ai/model';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transcript = body.transcript;
    const selectedModelFromRequest = body.model as Model;

    console.log(`[API /api/summarize] Received request. Transcript length: ${transcript?.length}, Model: ${selectedModelFromRequest}`);
    console.log(`[API /api/summarize] Full body received:`, JSON.stringify(body));


    if (!transcript || typeof transcript !== 'string') {
      console.error("[API /api/summarize] Error: Transcript is required and must be a string.", { transcript });
      return NextResponse.json({ error: 'Transcript is required and must be a string.' }, { status: 400 });
    }

    if (transcript.trim().length === 0) {
      console.error("[API /api/summarize] Error: Transcript cannot be empty.");
      return NextResponse.json({ error: 'Transcript cannot be empty.' }, { status: 400 });
    }
    
    if (!selectedModelFromRequest || typeof selectedModelFromRequest !== 'string' || selectedModelFromRequest.trim().length === 0) {
      console.error(`[API /api/summarize] Error: Model selection is required and must be a non-empty string. Received model: '${selectedModelFromRequest}' (type: ${typeof selectedModelFromRequest})`);
      return NextResponse.json({ error: 'Model selection is required and must be a non-empty string.' }, { status: 400 });
    }

    console.log(`[API /api/summarize] Passed model check. Model: '${selectedModelFromRequest}'`);

    let result: SummarizeTranscriptOutput | null = null;

    if (selectedModelFromRequest === "gemini-flash") {
      console.log("[API /api/summarize] Using Gemini model for summarization");
      const inputForGemini: SummarizeTranscriptGeminiInput = { transcript };
      console.log("[API /api/summarize] Input for Gemini:", JSON.stringify(inputForGemini).substring(0, 200) + "...");
      result = await summarizeTranscriptGemini(inputForGemini);
    } else if (GROQ_MODELS.has(selectedModelFromRequest)) {
      result = await summarizeTranscriptGroq({
        transcript,
        modelName: selectedModelFromRequest,
      });
    } else {
      console.error(`[API /api/summarize] Error: Unsupported model: '${selectedModelFromRequest}'`);
      return NextResponse.json({ error: `Unsupported model: ${selectedModelFromRequest}` }, { status: 400 });
    }

    if (!result || typeof result !== 'object' || Object.keys(result).length === 0 || !result.topikUtama) {
      console.error("[API /api/summarize] Error: Failed to generate summary content or unexpected format from AI.", { result });
      return NextResponse.json({ error: 'Failed to generate summary content from AI or unexpected format.' }, { status: 500 });
    }

    console.log("[API /api/summarize] Successfully generated summary. Result snippet:", JSON.stringify(result).substring(0, 200) + "...");
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[API /api/summarize] Unhandled error generating summary:', error);
    let message = 'Failed to generate summary.';
    if (error.message) {
        message = `Failed to generate summary: ${error.message}`;
    }
    return NextResponse.json({ error: message, details: error.stack || String(error) }, { status: 500 });
  }
}
