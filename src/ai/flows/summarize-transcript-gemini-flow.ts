
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
  prompt: `Anda adalah seorang ahli analisis konten yang bertugas meringkas transkrip video YouTube.
Tugas Anda adalah menghasilkan ringkasan yang terstruktur dan sangat detail berdasarkan transkrip yang diberikan.
Pastikan output Anda HANYA berupa objek JSON yang valid, sesuai dengan skema yang telah Anda terima (SummarizeTranscriptOutputSchema). Jangan sertakan teks atau markdown lain di luar objek JSON.

Contoh Skema JSON yang diharapkan (mengikuti struktur SummarizeTranscriptOutputSchema):
{
  "topikUtama": "Penjelasan detail konteks dan latar belakang topik utama.",
  "kronologiAlur": [
    "Poin penting pertama secara berurutan dari transkrip.",
    "Poin penting kedua secara berurutan dari transkrip.",
    "Dan seterusnya..."
  ],
  "poinPoinKunci": [
    {
      "judul": "Judul Poin Kunci 1 (dari transkrip)",
      "penjelasan": "Penjelasan detail untuk poin kunci 1, berdasarkan transkrip."
    },
    {
      "judul": "Judul Poin Kunci 2 (dari transkrip)",
      "penjelasan": "Penjelasan detail untuk poin kunci 2, berdasarkan transkrip."
    }
  ],
  "pembelajaranInsight": [
    {
      "judul": "Judul Pembelajaran/Insight Penting 1 (dari transkrip)",
      "penjelasan": "Penjelasan untuk pembelajaran atau insight penting 1, berdasarkan transkrip."
    },
    {
      "judul": "Judul Pembelajaran/Insight Penting 2 (dari transkrip)",
      "penjelasan": "Penjelasan untuk pembelajaran atau insight penting 2, berdasarkan transkrip."
    },
    {
      "judul": "Judul Pembelajaran/Insight Penting 3 (dari transkrip)",
      "penjelasan": "Penjelasan untuk pembelajaran atau insight penting 3, berdasarkan transkrip."
    }
  ],
  "kesimpulan": "Ringkasan mendalam tentang keseluruhan konten video berdasarkan transkrip."
}

Transkrip Video:
{{{transcript}}}

Mohon berikan ringkasan dalam format JSON seperti contoh di atas. Jangan awali respons Anda dengan frasa seperti "Berikut adalah ringkasan...". Langsung ke objek JSON. Pastikan semua string dalam JSON di-escape dengan benar. Berikan contoh spesifik dari transkrip jika relevan untuk memperjelas poin. Output harus berupa objek JSON tunggal yang valid.`,
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
      const { output } = await geminiPrompt(input);
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
