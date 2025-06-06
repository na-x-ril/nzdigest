
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
  console.log("Attempting to clean and parse JSON. Raw string:", jsonString);

  let cleanedString = jsonString.trim();

  // Remove potential markdown code block fences (```json ... ``` or ``` ... ```)
  if (cleanedString.startsWith("```json")) {
    cleanedString = cleanedString.substring(7, cleanedString.length - 3).trim();
  } else if (cleanedString.startsWith("```")) {
    cleanedString = cleanedString.substring(3, cleanedString.length - 3).trim();
  }

  // If not a valid JSON object, try to extract content between first { and last }
  if (!cleanedString.startsWith("{") || !cleanedString.endsWith("}")) {
    console.warn("Cleaned string does not appear to be a simple JSON object. Attempting to extract from first '{' to last '}'. Original cleaned string:", cleanedString);
    const firstBrace = cleanedString.indexOf("{");
    const lastBrace = cleanedString.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedString = cleanedString.substring(firstBrace, lastBrace + 1);
      console.log("Substring extraction result:", cleanedString);
    } else {
      console.error("Could not find valid JSON structure for substring extraction.");
      // Fallback or throw error if even substring extraction fails
    }
  }

  console.log("String after cleaning, before parsing:", cleanedString);
  try {
    const parsed = JSON.parse(cleanedString);
    console.log("Successfully parsed JSON:", parsed);
    return parsed;
  } catch (e: any) {
    console.error("Failed to parse JSON even after cleaning. Error:", e.message, "String was:", cleanedString);
    throw new Error(`Failed to parse JSON response from AI: ${e.message}. Attempted to parse: ${cleanedString.substring(0, 200)}...`);
  }
}


export async function summarizeTranscript(input: SummarizeTranscriptGroqInput): Promise<SummarizeTranscriptOutput> {
  console.log("Groq summarizeTranscript called with input:", input);
  if (!input.modelName) {
    throw new Error("Groq model name is required.");
  }
  try {
    const result = await summarizeTranscriptFlow(input);
    if (!result || typeof result !== 'object' || !result.topikUtama) {
        console.error("Groq flow returned invalid or empty result:", result);
        throw new Error('Failed to generate summary content from Groq AI or unexpected format.');
    }
    return result;
  } catch (error: any) {
    console.error("Error in Groq summarizeTranscript:", error);
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
    console.log("Groq summarizeTranscriptFlow started with input:", input);
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set.");
      throw new Error("GROQ_API_KEY environment variable is not set.");
    }

    const systemMessage = `Anda adalah seorang ahli analisis konten yang bertugas meringkas transkrip video YouTube.
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
${input.transcript}

Mohon berikan ringkasan dalam format JSON di atas. Jangan awali respons Anda dengan frasa seperti "Berikut adalah ringkasan...". Langsung ke objek JSON. Berikan contoh spesifik dari transkrip jika relevan untuk memperjelas poin.`;

    try {
      console.log(`Making Groq API call with model: ${input.modelName}`);
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
        temperature: 0.3,
        max_tokens: 4000,
        top_p: 0.8,
        response_format: { type: "json_object" },
        stream: false,
      });

      console.log("Raw response from Groq API:", JSON.stringify(chatCompletion, null, 2));

      const rawContent = chatCompletion.choices[0]?.message?.content;
      if (!rawContent) {
        console.error("No content in Groq API response choice.");
        throw new Error('No content returned from Groq AI.');
      }

      console.log("Raw content string from Groq choice:", rawContent);
      const parsedOutput = cleanAndParseJson(rawContent);

      const validationResult = SummarizeTranscriptOutputSchema.safeParse(parsedOutput);
      if (!validationResult.success) {
        console.error("Groq output failed Zod validation:", validationResult.error.errors);
        console.error("Data that failed validation:", parsedOutput);
        throw new Error(`Groq AI output did not match expected schema: ${validationResult.error.message}`);
      }

      console.log("Groq flow successfully processed and validated output.");
      return validationResult.data;

    } catch (error: any) {
      console.error('Error during Groq API call or processing:', error.message, error.stack);
      if (error.response) {
        console.error('Groq API Error Response:', error.response.data);
      }
      throw new Error(`Failed to get summary from Groq: ${error.message}`);
    }
  }
);
