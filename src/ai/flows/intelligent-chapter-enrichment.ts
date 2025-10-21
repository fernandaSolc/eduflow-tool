'use server';

/**
 * @fileOverview A Genkit flow for intelligent chapter enrichment based on existing content.
 *
 * - intelligentChapterEnrichment - A function that enriches chapter content using AI based on the existing content.
 * - IntelligentChapterEnrichmentInput - The input type for the intelligentChapterEnrichment function.
 * - IntelligentChapterEnrichmentOutput - The return type for the intelligentChapterEnrichment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentChapterEnrichmentInputSchema = z.object({
  existingContent: z.string().describe('The existing content of the chapter.'),
  userQuery: z.string().describe('The user query for enriching the chapter.'),
});
export type IntelligentChapterEnrichmentInput = z.infer<
  typeof IntelligentChapterEnrichmentInputSchema
>;

const IntelligentChapterEnrichmentOutputSchema = z.object({
  enrichedContent: z.string().describe('The enriched content of the chapter.'),
  aiUsed: z.boolean().describe('Whether AI was used to enrich the content.'),
});
export type IntelligentChapterEnrichmentOutput = z.infer<
  typeof IntelligentChapterEnrichmentOutputSchema
>;

export async function intelligentChapterEnrichment(
  input: IntelligentChapterEnrichmentInput
): Promise<IntelligentChapterEnrichmentOutput> {
  return intelligentChapterEnrichmentFlow(input);
}

const shouldEnrichWithAiTool = ai.defineTool({
  name: 'shouldEnrichWithAi',
  description:
    'Determines if AI should be used to enrich the chapter content based on the existing content and user query.',
  inputSchema: z.object({
    existingContent: z
      .string()
      .describe('The existing content of the chapter.'),
    userQuery: z.string().describe('The user query for enriching the chapter.'),
  }),
  outputSchema: z.boolean().describe('Whether AI should be used to enrich content.'),
},
async input => {
  // Simple heuristic: use AI if the existing content is short or the user query is complex.
    return input.existingContent.length < 200 || input.userQuery.length > 50;
});

const chapterEnrichmentPrompt = ai.definePrompt({
  name: 'chapterEnrichmentPrompt',
  input: {schema: IntelligentChapterEnrichmentInputSchema},
  output: {schema: IntelligentChapterEnrichmentOutputSchema},
  tools: [shouldEnrichWithAiTool],
  prompt: `You are an AI assistant helping to enrich chapter content.

  The user has provided the following existing content:
  {{existingContent}}

  The user wants to enrich the chapter with the following query:
  {{userQuery}}

  First, use the shouldEnrichWithAi tool to determine if AI should be used to enrich the content.
  If the tool returns true, enrich the content using AI. Otherwise, return the existing content.
  `,
});

const intelligentChapterEnrichmentFlow = ai.defineFlow(
  {
    name: 'intelligentChapterEnrichmentFlow',
    inputSchema: IntelligentChapterEnrichmentInputSchema,
    outputSchema: IntelligentChapterEnrichmentOutputSchema,
  },
  async input => {
    const {output} = await chapterEnrichmentPrompt(input);
    return output!;
  }
);
