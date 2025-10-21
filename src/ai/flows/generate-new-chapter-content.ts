'use server';

/**
 * @fileOverview Flow for generating new chapter content for a course.
 *
 * - generateNewChapterContent - A function that generates new chapter content based on a prompt.
 * - GenerateNewChapterContentInput - The input type for the generateNewChapterContent function.
 * - GenerateNewChapterContentOutput - The return type for the generateNewChapterContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNewChapterContentInputSchema = z.object({
  courseTitle: z.string().describe('The title of the course.'),
  chapterPrompt: z.string().describe('A prompt describing the desired content of the chapter.'),
});
export type GenerateNewChapterContentInput = z.infer<typeof GenerateNewChapterContentInputSchema>;

const GenerateNewChapterContentOutputSchema = z.object({
  chapterContent: z.string().describe('The generated content of the chapter.'),
});
export type GenerateNewChapterContentOutput = z.infer<typeof GenerateNewChapterContentOutputSchema>;

export async function generateNewChapterContent(input: GenerateNewChapterContentInput): Promise<GenerateNewChapterContentOutput> {
  return generateNewChapterContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNewChapterContentPrompt',
  input: {schema: GenerateNewChapterContentInputSchema},
  output: {schema: GenerateNewChapterContentOutputSchema},
  prompt: `You are an expert in creating educational content.

  Based on the course title and the chapter prompt, generate the content for a new chapter.

  Course Title: {{{courseTitle}}}
  Chapter Prompt: {{{chapterPrompt}}}

  Chapter Content:`,
});

const generateNewChapterContentFlow = ai.defineFlow(
  {
    name: 'generateNewChapterContentFlow',
    inputSchema: GenerateNewChapterContentInputSchema,
    outputSchema: GenerateNewChapterContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
