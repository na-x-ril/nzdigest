
'use server';
/**
 * @fileOverview Summarizes a YouTube transcript using Google's Gemini model via Genkit.
 * - summarizeTranscriptGemini - A function that summarizes a given transcript using Gemini.
 */
import {ai} from '@/ai/genkit';
import {
  SummarizeTranscriptGeminiInputSchema,
  type SummarizeTranscriptGeminiInput,
  SummarizeTranscriptOutputSchema,
  type SummarizeTranscriptOutput,
} from '@/ai/schemas/transcript-summary-schemas';
import { z } from 'zod';

export async function summarizeTranscriptGemini(input: SummarizeTranscriptGeminiInput): Promise<SummarizeTranscriptOutput> {
  console.log("[Gemini Flow] summarizeTranscriptGemini called with input:", JSON.stringify(input).substring(0, 200) + "...");
  try {
    const result = await geminiSummarizeFlow(input);
     if (!result || typeof result !== 'object' || !result.topikUtama) { // Basic check
        console.error("[Gemini Flow] Flow returned invalid or empty result:", result);
        throw new Error('Failed to generate summary content from Gemini AI or unexpected format.');
    }
    console.log("[Gemini Flow] summarizeTranscriptGemini successfully processed output.");
    return result;
  } catch (error: any) {
    console.error("[Gemini Flow] Error in summarizeTranscriptGemini:", error);
    throw new Error(`Gemini summarization failed: ${error.message}`);
  }
}

const geminiPrompt = ai.definePrompt({
  name: 'geminiTranscriptSummarizer',
  input: { schema: SummarizeTranscriptGeminiInputSchema },
  output: { schema: SummarizeTranscriptOutputSchema }, // Genkit uses this schema to guide the output format
  prompt: `You are an expert content analyst tasked with summarizing a YouTube video transcript.
Your task is to generate a structured, highly detailed summary based on the provided transcript.
The final output language MUST be '{{language}}'. For example, if the language is 'id', use Bahasa Indonesia. If the language is 'en', use English.

Ensure your output is ONLY a valid JSON object that follows the provided schema. Do not include any other text or markdown outside the JSON object.

The JSON schema you must follow is:
{
  "topikUtama": "Detailed explanation of the main topic's context and background.",
  "kronologiAlur": ["Array of strings containing key points that occurred sequentially."],
  "poinPoinKunci": [{ "judul": "Title of Key Point", "penjelasan": "Detailed explanation for the key point." }],
  "pembelajaranInsight": [{ "judul": "Title of Learning/Insight", "penjelasan": "Explanation for the learning or insight." }],
  "kesimpulan": "In-depth summary of the entire video content."
}

Video Transcript:
{{{transcript}}}

Please provide the summary in the specified language and JSON format. Go directly to the JSON object.`,
  config: {
    temperature: 0.3,
    topP: 0.8,
    maxOutputTokens: 12000,
    responseMimeType: 'application/json',
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
});

const geminiSummarizeFlow = ai.defineFlow(
  {
    name: 'geminiSummarizeFlow',
    inputSchema: SummarizeTranscriptGeminiInputSchema,
    outputSchema: SummarizeTranscriptOutputSchema,
  },
  async (input) => {
    console.log("[Gemini Flow] geminiSummarizeFlow started with input:", JSON.stringify(input).substring(0, 200) + "...");
    try {
      // Provide a default language if not specified
      const flowInput = { ...input, language: input.language || 'en' };
      const { output } = await geminiPrompt(flowInput);
      if (!output) {
        console.error("[Gemini Flow] Gemini prompt returned no output.");
        throw new Error('Gemini prompt returned no output.');
      }
      console.log("[Gemini Flow] Output from Gemini prompt received and implicitly validated by Genkit against schema.");
      return output;
    } catch (error: any) {
      console.error('[Gemini Flow] Error during Gemini prompt execution:', error.message, error.stack);
      if (error.details) {
        console.error('[Gemini Flow] Error details:', error.details);
      }
      throw new Error(`Failed to get summary from Gemini: ${error.message}`);
    }
  }
);
