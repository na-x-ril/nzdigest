'use server';

/**
 * @fileOverview Summarizes a YouTube transcript using an LLM with a detailed, structured format.
 *
 * - summarizeTranscript - A function that summarizes a given transcript.
 * - SummarizeTranscriptInput - The input type for the summarizeTranscript function.
 * - SummarizeTranscriptOutput - The return type for the summarizeTranscript function, including detailed sections.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTranscriptInputSchema = z.object({
  transcript: z.string().describe('The transcript of the YouTube video.'),
});

export type SummarizeTranscriptInput = z.infer<typeof SummarizeTranscriptInputSchema>;

const SummarizeTranscriptOutputSchema = z.object({
  topikUtama: z.string().describe('Penjelasan detail konteks dan latar belakang topik utama.'),
  kronologiAlur: z.string().describe('Poin-poin penting yang terjadi secara berurutan, diformat sebagai daftar bernomor atau berpoin.'),
  poinPoinKunci: z.string().describe('Beberapa poin kunci dengan penjelasan detail untuk setiap poin, diformat sebagai daftar.'),
  pembelajaranInsight: z.string().describe('Minimal 3 pembelajaran atau wawasan penting, masing-masing dengan penjelasan, diformat sebagai daftar.'),
  kesimpulan: z.string().describe('Ringkasan mendalam tentang keseluruhan konten.'),
});

export type SummarizeTranscriptOutput = z.infer<typeof SummarizeTranscriptOutputSchema>;

export async function summarizeTranscript(input: SummarizeTranscriptInput): Promise<SummarizeTranscriptOutput> {
  return summarizeTranscriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTranscriptPrompt',
  input: {schema: SummarizeTranscriptInputSchema},
  output: {schema: SummarizeTranscriptOutputSchema},
  prompt: `Anda adalah seorang ahli analisis konten yang bertugas meringkas transkrip video YouTube.
Tugas Anda adalah menghasilkan ringkasan yang terstruktur dan sangat detail berdasarkan transkrip yang diberikan.

Transkrip Video:
{{{transcript}}}

Mohon berikan ringkasan dalam format berikut, dengan penjelasan yang sangat detail untuk setiap bagian. Jangan awali respons Anda dengan frasa seperti "Berikut adalah ringkasan...". Langsung ke poin pertama. Berikan contoh spesifik dari transkrip jika relevan untuk memperjelas poin.

1.  **Topik Utama**: Jelaskan secara detail konteks dan latar belakang dari topik utama yang dibahas dalam video.
2.  **Kronologi/Alur**: Paparkan poin-poin penting yang terjadi atau dibahas secara berurutan dalam video. Jika video menjelaskan suatu proses atau cerita, urutkan kejadiannya.
3.  **Poin-poin Kunci**: Identifikasi beberapa poin paling penting dari video. Untuk setiap poin kunci, berikan penjelasan yang detail dan mendalam.
4.  **Pembelajaran/Insight**: Ekstrak minimal 3 pembelajaran atau wawasan penting yang dapat diambil dari konten video. Berikan penjelasan untuk setiap pembelajaran/insight.
5.  **Kesimpulan**: Buatlah ringkasan akhir yang mendalam dan mencakup keseluruhan esensi dari konten video.`,
});

const summarizeTranscriptFlow = ai.defineFlow(
  {
    name: 'summarizeTranscriptFlow',
    inputSchema: SummarizeTranscriptInputSchema,
    outputSchema: SummarizeTranscriptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);