
import { NextResponse } from 'next/server';
import {
  summarizeTranscript as summarizeTranscriptGroq,
  type SummarizeTranscriptGroqInput,
  type SummarizeTranscriptOutput
} from '@/ai/flows/summarize-transcript-flow';
import {
  summarizeTranscriptGemini,
  type SummarizeTranscriptGeminiInput,
} from '@/ai/flows/summarize-transcript-gemini-flow';
import type { Model } from '@/contexts/ModelContext'; // Assuming Model is correctly defined here

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transcript = body.transcript;
    // Ensure body.model is treated as a string from the start for logging
    const modelFromBody = typeof body.model === 'string' ? body.model : JSON.stringify(body.model);

    console.log(`[API /api/summarize] Received body.model raw: `, body.model);
    console.log(`[API /api/summarize] Type of body.model: ${typeof body.model}`);
    console.log(`[API /api/summarize] modelFromBody (stringified if not string): '${modelFromBody}'`);

    // Explicitly cast after logging, assuming Model type is accurate
    const selectedModelFromRequest = body.model as Model;
    console.log(`[API /api/summarize] selectedModelFromRequest after cast: '${selectedModelFromRequest}'`);
    console.log(`[API /api/summarize] Type of selectedModelFromRequest after cast: ${typeof selectedModelFromRequest}`);


    if (!transcript || typeof transcript !== 'string') {
      console.error("[API /api/summarize] Error: Transcript is required and must be a string.", { transcript });
      return NextResponse.json({ error: 'Transcript is required and must be a string.' }, { status: 400 });
    }

    if (transcript.trim().length === 0) {
      console.error("[API /api/summarize] Error: Transcript cannot be empty.");
      return NextResponse.json({ error: 'Transcript cannot be empty.' }, { status: 400 });
    }

    // Check if selectedModelFromRequest is a non-empty string
    if (!selectedModelFromRequest || typeof selectedModelFromRequest !== 'string' || selectedModelFromRequest.trim().length === 0) {
      console.error(`[API /api/summarize] Error: Model selection is required and must be a non-empty string. selectedModelFromRequest: '${selectedModelFromRequest}' (type: ${typeof selectedModelFromRequest})`);
      return NextResponse.json({ error: 'Model selection is required and must be a non-empty string.' }, { status: 400 });
    }

    console.log(`[API /api/summarize] Passed model check. Model: '${selectedModelFromRequest}'`);

    let result: SummarizeTranscriptOutput | null = null;

    if (selectedModelFromRequest.startsWith("gemini")) {
      console.log("[API /api/summarize] Using Gemini model for summarization");
      const inputForGemini: SummarizeTranscriptGeminiInput = { transcript };
      console.log("[API /api/summarize] Input for Gemini:", JSON.stringify(inputForGemini));
      result = await summarizeTranscriptGemini(inputForGemini);
    } else if (
      selectedModelFromRequest === "llama3-groq" ||
      selectedModelFromRequest === "llama-3.3-70b-versatile" ||
      selectedModelFromRequest === "deepseek-r1-distill-llama-70b" ||
      selectedModelFromRequest === "qwen-qwq-32b"
    ) {
      console.log(`[API /api/summarize] Using Groq model: '${selectedModelFromRequest}' for summarization`);
      const inputForGroq: SummarizeTranscriptGroqInput = { transcript, modelName: selectedModelFromRequest };
      console.log("[API /api/summarize] Input for Groq:", JSON.stringify(inputForGroq));
      result = await summarizeTranscriptGroq(inputForGroq);
    } else {
      console.error(`[API /api/summarize] Error: Unsupported model: '${selectedModelFromRequest}'`);
      return NextResponse.json({ error: `Unsupported model: ${selectedModelFromRequest}` }, { status: 400 });
    }

    if (!result || typeof result !== 'object' || Object.keys(result).length === 0 || !result.topikUtama) {
      console.error("[API /api/summarize] Error: Failed to generate summary content or unexpected format from AI.", { result });
      return NextResponse.json({ error: 'Failed to generate summary content from AI or unexpected format.' }, { status: 500 });
    }

    console.log("[API /api/summarize] Successfully generated summary. Result:", JSON.stringify(result).substring(0, 200) + "...");
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[API /api/summarize] Unhandled error generating summary:', error);
    let message = 'Failed to generate summary.';
    if (error.message) {
        message = `Failed to generate summary: ${error.message}`;
    }
    // Include error details if available, for better debugging from client/logs
    return NextResponse.json({ error: message, details: error.stack || String(error) }, { status: 500 });
  }
}
