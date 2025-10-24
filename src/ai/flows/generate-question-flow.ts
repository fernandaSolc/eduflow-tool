'use server';

/**
 * @fileOverview Genkit flow for generating a question for a chapter.
 *
 * - generateQuestion - A function that generates a question based on a selection.
 * - GenerateQuestionInput - The input type for the generateQuestion function.
 * - GenerateQuestionOutput - The return type for the generateQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuestionInputSchema = z.object({
  selection: z.string().describe('The selected text to generate a question for.'),
  additionalDetails: z
    .string()
    .optional()
    .describe('Additional details for generating the question.'),
});
export type GenerateQuestionInput = z.infer<typeof GenerateQuestionInputSchema>;

const GenerateQuestionOutputSchema = z.object({
  question: z.string().describe('The generated question.'),
});
export type GenerateQuestionOutput = z.infer<
  typeof GenerateQuestionOutputSchema
>;

export async function generateQuestion(
  input: GenerateQuestionInput
): Promise<GenerateQuestionOutput> {
  return generateQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuestionPrompt',
  input: {schema: GenerateQuestionInputSchema},
  output: {schema: GenerateQuestionOutputSchema},
  prompt: `You are an expert in creating educational content.

  Based on the selected text and additional details, generate a question.

  Selected Text: {{{selection}}}
  Additional Details: {{{additionalDetails}}}

  Question:`,
});

const generateQuestionFlow = ai.defineFlow(
  {
    name: 'generateQuestionFlow',
    inputSchema: GenerateQuestionInputSchema,
    outputSchema: GenerateQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
