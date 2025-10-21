'use server';

/**
 * @fileOverview Genkit flow for expanding existing chapter content.
 *
 * This file defines a Genkit flow that allows users to expand an existing chapter by selecting a continuation type
 * and providing additional details. The flow uses the IA Service to generate iterative content based on user input.
 *
 * @exports {
 *   expandExistingChapterContent,
 *   ExpandExistingChapterContentInput,
 *   ExpandExistingChapterContentOutput,
 * }
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the expandExistingChapterContent flow
const ExpandExistingChapterContentInputSchema = z.object({
  chapterContent: z
    .string()
    .describe('The existing content of the chapter to be expanded.'),
  continuationType: z
    .string()
    .describe(
      'The type of continuation for the chapter (e.g., more examples, deeper explanation, related topics).' // shortened for brevity
    ),
  additionalDetails: z
    .string()
    .optional()
    .describe('Any additional details or context to guide the content generation.'),
});

export type ExpandExistingChapterContentInput = z.infer<
  typeof ExpandExistingChapterContentInputSchema
>;

// Define the output schema for the expandExistingChapterContent flow
const ExpandExistingChapterContentOutputSchema = z.object({
  expandedContent: z
    .string()
    .describe('The expanded content of the chapter, including the original content and the new additions.'),
});

export type ExpandExistingChapterContentOutput = z.infer<
  typeof ExpandExistingChapterContentOutputSchema
>;

// Define the main function that calls the flow
export async function expandExistingChapterContent(
  input: ExpandExistingChapterContentInput
): Promise<ExpandExistingChapterContentOutput> {
  return expandExistingChapterContentFlow(input);
}

// Define the prompt for expanding the chapter content
const expandChapterContentPrompt = ai.definePrompt({
  name: 'expandChapterContentPrompt',
  input: {schema: ExpandExistingChapterContentInputSchema},
  output: {schema: ExpandExistingChapterContentOutputSchema},
  prompt: `You are an expert in creating educational content.

  Given the existing content of a chapter, expand it based on the specified continuation type and additional details.

  Existing Content:
  {{chapterContent}}

  Continuation Type: {{continuationType}}

  Additional Details: {{additionalDetails}}

  Expanded Content:`, // shortened for brevity
});

// Define the Genkit flow for expanding the chapter content
const expandExistingChapterContentFlow = ai.defineFlow(
  {
    name: 'expandExistingChapterContentFlow',
    inputSchema: ExpandExistingChapterContentInputSchema,
    outputSchema: ExpandExistingChapterContentOutputSchema,
  },
  async input => {
    const {output} = await expandChapterContentPrompt(input);
    return output!;
  }
);
