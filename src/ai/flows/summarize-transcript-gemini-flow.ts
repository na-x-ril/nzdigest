
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
  output: { schema: SummarizeTranscriptOutputSchema },
  prompt: `Anda adalah seorang ahli analisis konten yang bertugas meringkas transkrip video YouTube.
Tugas Anda adalah menghasilkan ringkasan yang terstruktur dan sangat detail berdasarkan transkrip yang diberikan.
Pastikan output Anda HANYA berupa objek JSON yang valid, sesuai dengan skema yang akan dijelaskan. Jangan sertakan teks atau markdown lain di luar objek JSON.

Skema JSON yang diharapkan:
{
  "topikUtama": "Penjelasan detail konteks dan latar belakang topik utama.",
  "kronologiAlur": "Poin-poin penting yang terjadi secara berurutan, diformat sebagai daftar bernomor atau berpoin.",
  "poinPoinKunci": "Beberapa poin kunci dengan penjelasan detail untuk setiap poin, diformat sebagai daftar.",
  "pembelajaranInsight": "Minimal 3 pembelajaran atau wawasan penting, masing-masing dengan penjelasan, diformat sebagai daftar.",
  "kesimpulan": "Ringkasan mendalam tentang keseluruhan konten."
}

Transkrip Video:
{{{transcript}}}

Mohon berikan ringkasan dalam format JSON di atas. Jangan awali respons Anda dengan frasa seperti "Berikut adalah ringkasan...". Langsung ke objek JSON. Berikan contoh spesifik dari transkrip jika relevan untuk memperjelas poin.`,
  config: {
    model: 'googleai/gemini-1.5-flash-latest', // Ensure fully qualified model name
    temperature: 0.3,
    topP: 0.8,
    maxOutputTokens: 4000,
    responseMimeType: 'application/json', // Request JSON output
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
      const { output } = await geminiPrompt(input);
      if (!output) {
        console.error("[Gemini Flow] Gemini prompt returned no output.");
        throw new Error('Gemini prompt returned no output.');
      }
      console.log("[Gemini Flow] Output from Gemini prompt received.");
      return output;
    } catch (error: any) {
      console.error('[Gemini Flow] Error during Gemini prompt execution:', error.message, error.stack);
      throw new Error(`Failed to get summary from Gemini: ${error.message}`);
    }
  }
);
