
/**
 * @fileOverview Zod schemas and TypeScript types for transcript summarization.
 *
 * Exports:
 * - SummarizeTranscriptOutputSchema: Zod schema for the structured summary output.
 * - SummarizeTranscriptOutput: TypeScript type for the structured summary output.
 * - SummarizeTranscriptBaseInputSchema: Base Zod schema for transcript input.
 * - SummarizeTranscriptBaseInput: TypeScript type for the base transcript input.
 * - SummarizeTranscriptGeminiInputSchema: Zod schema for Gemini summarization input.
 * - SummarizeTranscriptGeminiInput: TypeScript type for Gemini summarization input.
 * - SummarizeTranscriptGroqInputSchema: Zod schema for Groq summarization input (includes modelName).
 * - SummarizeTranscriptGroqInput: TypeScript type for Groq summarization input.
 */
import { z } from 'zod';

export const SummarizeTranscriptOutputSchema = z.object({
  topikUtama: z.string().describe("Penjelasan detail konteks dan latar belakang topik utama."),
  kronologiAlur: z.string().describe("Poin-poin penting yang terjadi secara berurutan, diformat sebagai daftar bernomor atau berpoin."),
  poinPoinKunci: z.string().describe("Beberapa poin kunci dengan penjelasan detail untuk setiap poin, diformat sebagai daftar."),
  pembelajaranInsight: z.string().describe("Minimal 3 pembelajaran atau wawasan penting, masing-masing dengan penjelasan, diformat sebagai daftar."),
  kesimpulan: z.string().describe("Ringkasan mendalam tentang keseluruhan konten."),
});
export type SummarizeTranscriptOutput = z.infer<typeof SummarizeTranscriptOutputSchema>;

export const SummarizeTranscriptBaseInputSchema = z.object({
  transcript: z.string().min(1, { message: "Transcript cannot be empty." }),
});
export type SummarizeTranscriptBaseInput = z.infer<typeof SummarizeTranscriptBaseInputSchema>;

// Schema for Gemini model input (doesn't need modelName as it's often set in Genkit config or the flow)
export const SummarizeTranscriptGeminiInputSchema = SummarizeTranscriptBaseInputSchema;
export type SummarizeTranscriptGeminiInput = z.infer<typeof SummarizeTranscriptGeminiInputSchema>;

// Schema for Groq model input (requires modelName)
export const SummarizeTranscriptGroqInputSchema = SummarizeTranscriptBaseInputSchema.extend({
  modelName: z.string().min(1, { message: "Groq model name is required." }),
});
export type SummarizeTranscriptGroqInput = z.infer<typeof SummarizeTranscriptGroqInputSchema>;
