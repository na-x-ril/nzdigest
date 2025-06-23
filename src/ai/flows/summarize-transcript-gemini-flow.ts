
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

const geminiSummarizeFlow = ai.defineFlow(
  {
    name: 'geminiSummarizeFlow',
    inputSchema: SummarizeTranscriptGeminiInputSchema,
    outputSchema: SummarizeTranscriptOutputSchema,
  },
  async (input) => {
    console.log("[Gemini Flow] geminiSummarizeFlow started with input:", JSON.stringify(input).substring(0, 200) + "...");
    
    const lang = input.language || 'en';

    const promptID = `Anda adalah seorang ahli analisis konten yang bertugas meringkas transkrip video YouTube.
Tugas Anda adalah menghasilkan ringkasan yang terstruktur dan sangat detail berdasarkan transkrip yang diberikan.
Pastikan output Anda HANYA berupa objek JSON yang valid, sesuai dengan skema yang akan dijelaskan. Jangan sertakan teks atau markdown lain di luar objek JSON.

Skema JSON yang diharapkan:
{
  "topikUtama": "Penjelasan detail konteks dan latar belakang topik utama.",
  "kronologiAlur": ["Array string berisi poin-poin penting yang terjadi secara berurutan."],
  "poinPoinKunci": [{ "judul": "Judul Poin Kunci", "penjelasan": "Penjelasan detail untuk poin kunci." }],
  "pembelajaranInsight": [{ "judul": "Judul Pembelajaran/Insight", "penjelasan": "Penjelasan untuk pembelajaran atau insight." }],
  "kesimpulan": "Ringkasan mendalam tentang keseluruhan konten video."
}

Transkrip Video:
${input.transcript}

Mohon berikan ringkasan dalam format JSON di atas. Langsung ke objek JSON.`;

    const promptEN = `You are an expert content analyst tasked with summarizing a YouTube video transcript.
Your task is to generate a structured, highly detailed summary based on the provided transcript.
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
${input.transcript}

Please provide the summary in the JSON format above. Go directly to the JSON object.`;

    const prompt = lang === 'id' ? promptID : promptEN;

    try {
      const { output } = await ai.generate({
        model: 'gemini-flash',
        prompt: prompt,
        output: { schema: SummarizeTranscriptOutputSchema },
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
