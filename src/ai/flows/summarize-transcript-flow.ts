
'use server';
/**
 * @fileOverview Summarizes a YouTube transcript using Groq's LLaMA models.
 * - summarizeTranscript - A function that summarizes a given transcript using a specified LLaMA model on Groq.
 */
import Groq from 'groq-sdk';
import {ai} from '@/ai/genkit';
import {
  SummarizeTranscriptGroqInputSchema,
  type SummarizeTranscriptGroqInput,
  SummarizeTranscriptOutputSchema,
  type SummarizeTranscriptOutput,
} from '@/ai/schemas/transcript-summary-schemas';
import { z } from 'zod';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Helper to clean and parse JSON, potentially wrapped in markdown
function cleanAndParseJson(jsonString: string): any {
  console.log("[Groq Flow] Attempting to clean and parse JSON. Raw string received:", jsonString.substring(0, 500) + (jsonString.length > 500 ? "..." : ""));

  let cleanedString = jsonString.trim();

  // Remove potential markdown code block fences (```json ... ``` or ``` ... ```)
  if (cleanedString.startsWith("```json")) {
    cleanedString = cleanedString.substring(7, cleanedString.length - 3).trim();
    console.log("[Groq Flow] Removed ```json wrapper. String now:", cleanedString.substring(0, 200) + "...");
  } else if (cleanedString.startsWith("```") && cleanedString.endsWith("```")) {
    cleanedString = cleanedString.substring(3, cleanedString.length - 3).trim();
    console.log("[Groq Flow] Removed ``` wrapper. String now:", cleanedString.substring(0, 200) + "...");
  }

  // If not a valid JSON object, try to extract content between first { and last }
  if (!cleanedString.startsWith("{") || !cleanedString.endsWith("}")) {
    console.warn("[Groq Flow] Cleaned string does not appear to be a simple JSON object. Attempting to extract from first '{' to last '}'. Current cleaned string:", cleanedString.substring(0,200) + "...");
    const firstBrace = cleanedString.indexOf("{");
    const lastBrace = cleanedString.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedString = cleanedString.substring(firstBrace, lastBrace + 1);
      console.log("[Groq Flow] Substring extraction result:", cleanedString.substring(0,200) + "...");
    } else {
      console.error("[Groq Flow] Could not find valid JSON structure for substring extraction. Original cleaned string fragment:", cleanedString.substring(0,200) + "...");
      // Fallback or throw error if even substring extraction fails
      throw new Error(`Could not extract a valid JSON object from the AI response. Content started with: ${cleanedString.substring(0, 50)}...`);
    }
  }

  console.log("[Groq Flow] String after all cleaning, before parsing:", cleanedString.substring(0, 500) + (cleanedString.length > 500 ? "..." : ""));
  try {
    const parsed = JSON.parse(cleanedString);
    console.log("[Groq Flow] Successfully parsed JSON.");
    return parsed;
  } catch (e: any) {
    console.error("[Groq Flow] Failed to parse JSON even after cleaning. Error:", e.message, "String was:", cleanedString.substring(0, 500) + (cleanedString.length > 500 ? "..." : ""));
    throw new Error(`Failed to parse JSON response from AI: ${e.message}. Attempted to parse: ${cleanedString.substring(0, 200)}...`);
  }
}


export async function summarizeTranscript(input: SummarizeTranscriptGroqInput): Promise<SummarizeTranscriptOutput> {
  console.log("[Groq Flow] summarizeTranscript called with input:", JSON.stringify(input));
  if (!input.modelName || typeof input.modelName !== 'string' || input.modelName.trim() === '') {
    console.error("[Groq Flow] Error: Groq model name is required and must be a non-empty string. Received:", input.modelName);
    throw new Error("Groq model name is required.");
  }
  try {
    const result = await summarizeTranscriptFlow(input);
    if (!result || typeof result !== 'object' || !result.topikUtama) {
        console.error("[Groq Flow] Flow returned invalid or empty result:", result);
        throw new Error('Failed to generate summary content from Groq AI or unexpected format.');
    }
    console.log("[Groq Flow] summarizeTranscript returning successfully.");
    return result;
  } catch (error: any) {
    console.error("[Groq Flow] Error in summarizeTranscript:", error);
    throw new Error(`Groq summarization failed: ${error.message}`);
  }
}

const summarizeTranscriptFlow = ai.defineFlow(
  {
    name: 'summarizeTranscriptGroqFlow',
    inputSchema: SummarizeTranscriptGroqInputSchema,
    outputSchema: SummarizeTranscriptOutputSchema,
  },
  async (input) => {
    console.log("[Groq Flow] summarizeTranscriptFlow started with input:", JSON.stringify(input));
    if (!process.env.GROQ_API_KEY) {
      console.error("[Groq Flow] GROQ_API_KEY is not set.");
      throw new Error("GROQ_API_KEY environment variable is not set.");
    }

    const systemMessage = `Anda adalah seorang ahli analisis konten yang bertugas meringkas transkrip video YouTube.
Tugas Anda adalah menghasilkan ringkasan yang terstruktur dan sangat detail berdasarkan transkrip yang diberikan.
Pastikan output Anda HANYA berupa objek JSON yang valid, sesuai dengan skema yang akan dijelaskan. Jangan sertakan teks atau markdown lain di luar objek JSON.

Skema JSON yang diharapkan:
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
${input.transcript}

Mohon berikan ringkasan dalam format JSON di atas. Jangan awali respons Anda dengan frasa seperti "Berikut adalah ringkasan...". Langsung ke objek JSON. Pastikan semua string dalam JSON di-escape dengan benar. Berikan contoh spesifik dari transkrip jika relevan untuk memperjelas poin. Output harus berupa objek JSON tunggal yang valid.`;

    try {
      console.log(`[Groq Flow] Making Groq API call with model: ${input.modelName}`);
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: `Tolong ringkas transkrip berikut sesuai dengan instruksi dan format JSON yang telah diberikan:\n\n${input.transcript}`,
          },
        ],
        model: input.modelName,
        temperature: 0.3, // Lowered temperature for more structured output
        max_tokens: 4000, // Adjusted based on typical needs for detailed summaries
        top_p: 0.8,
        response_format: { type: "json_object" }, // Ensure JSON mode
        stream: false,
      });

      console.log("[Groq Flow] Raw response from Groq API:", JSON.stringify(chatCompletion).substring(0, 500) + (JSON.stringify(chatCompletion).length > 500 ? "..." : ""));

      const rawContent = chatCompletion.choices[0]?.message?.content;
      if (!rawContent) {
        console.error("[Groq Flow] No content in Groq API response choice.");
        throw new Error('No content returned from Groq AI.');
      }

      console.log("[Groq Flow] Raw content string from Groq choice:", rawContent.substring(0, 500) + (rawContent.length > 500 ? "..." : ""));
      const parsedOutput = cleanAndParseJson(rawContent);

      const validationResult = SummarizeTranscriptOutputSchema.safeParse(parsedOutput);
      if (!validationResult.success) {
        console.error("[Groq Flow] Output failed Zod validation:", validationResult.error.errors);
        console.error("[Groq Flow] Data that failed validation:", JSON.stringify(parsedOutput, null, 2));
        throw new Error(`Groq AI output did not match expected schema: ${validationResult.error.message}`);
      }

      console.log("[Groq Flow] Flow successfully processed and validated output.");
      return validationResult.data;

    } catch (error: any) {     
      console.error('[Groq Flow] Error during Groq API call or processing:', error.message, error.stack);
      if (error.response) {
        console.error('[Groq Flow] Groq API Error Response:', error.response.data);
      }
      let errorMessage = `Failed to get summary from Groq: ${error.message}`;
      if (error.code === 'json_validate_failed' && error.failed_generation) {
        errorMessage += ` Groq failed to generate valid JSON. Attempted generation: ${String(error.failed_generation).substring(0, 300)}...`;
      }
      throw new Error(errorMessage);
    }
  }
);
