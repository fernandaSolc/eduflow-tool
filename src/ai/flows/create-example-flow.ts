'use server';

/**
 * @fileOverview Genkit flow for creating an example for a chapter.
 *
 * - createExample - A function that creates an example based on a selection.
 * - CreateExampleInput - The input type for the createExample function.
 * - CreateExampleOutput - The return type for the createExample function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateExampleInputSchema = z.object({
  selection: z.string().describe('The selected text to create an example for.'),
  additionalDetails: z
    .string()
    .optional()
    .describe('Additional details for creating the example.'),
});
export type CreateExampleInput = z.infer<typeof CreateExampleInputSchema>;

const CreateExampleOutputSchema = z.object({
  example: z.string().describe('The generated example.'),
});
export type CreateExampleOutput = z.infer<typeof CreateExampleOutputSchema>;

export async function createExample(
  input: CreateExampleInput
): Promise<CreateExampleOutput> {
  return createExampleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createExamplePrompt',
  input: {schema: CreateExampleInputSchema},
  output: {schema: CreateExampleOutputSchema},
  prompt: `You are an expert in creating educational content.

  Based on the selected text and additional details, create a practical example.

  Selected Text: {{{selection}}}
  Additional Details: {{{additionalDetails}}}

  Example:`,
});

const createExampleFlow = ai.defineFlow(
  {
    name: 'createExampleFlow',
    inputSchema: CreateExampleInputSchema,
    outputSchema: CreateExampleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
