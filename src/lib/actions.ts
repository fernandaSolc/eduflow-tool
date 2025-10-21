'use server';

import {
  generateNewChapterContent,
  GenerateNewChapterContentInput,
} from '@/ai/flows/generate-new-chapter-content';
import {
  expandExistingChapterContent,
  ExpandExistingChapterContentInput,
} from '@/ai/flows/expand-existing-chapter-content';
import {
  intelligentChapterEnrichment,
  IntelligentChapterEnrichmentInput,
} from '@/ai/flows/intelligent-chapter-enrichment';
import { revalidatePath } from 'next/cache';

export async function generateChapterAction(
  courseId: string,
  values: { title: string; prompt: string }
) {
  try {
    const input: GenerateNewChapterContentInput = {
      courseTitle: courseId, // Assuming courseId is the title for simplicity
      chapterPrompt: `Title: ${values.title}\nPrompt: ${values.prompt}`,
    };
    const { chapterContent } = await generateNewChapterContent(input);

    // In a real app, you'd save this to your database.
    // For now, we'll just log it and revalidate.
    console.log('Generated Chapter Content:', chapterContent);

    revalidatePath(`/courses/${courseId}`);
    return {
      success: true,
      data: {
        id: `ch-${Date.now()}`,
        title: values.title,
        content: chapterContent,
        sections: [],
        suggestions: [],
      },
    };
  } catch (error) {
    console.error('Error generating chapter:', error);
    return { success: false, error: 'Failed to generate chapter.' };
  }
}

export async function expandChapterAction(
  courseId: string,
  chapterId: string,
  values: {
    existingContent: string;
    continuationType: string;
    additionalDetails: string;
  }
) {
  try {
    const input: ExpandExistingChapterContentInput = {
      chapterContent: values.existingContent,
      continuationType: values.continuationType,
      additionalDetails: values.additionalDetails,
    };
    const { expandedContent } = await expandExistingChapterContent(input);

    // In a real app, you'd update this in your database.
    console.log('Expanded Chapter Content:', expandedContent);

    revalidatePath(`/courses/${courseId}`);
    return {
      success: true,
      data: {
        id: chapterId,
        content: expandedContent,
      },
    };
  } catch (error) {
    console.error('Error expanding chapter:', error);
    return { success: false, error: 'Failed to expand chapter.' };
  }
}

export async function enrichChapterAction(
  courseId: string,
  chapterId: string,
  values: {
    existingContent: string;
    userQuery: string;
  }
) {
  try {
    const input: IntelligentChapterEnrichmentInput = {
      existingContent: values.existingContent,
      userQuery: values.userQuery,
    };
    const { enrichedContent, aiUsed } = await intelligentChapterEnrichment(input);
    
    console.log('Enriched Chapter Content:', enrichedContent, 'AI Used:', aiUsed);
    
    revalidatePath(`/courses/${courseId}`);
    return {
      success: true,
      data: {
        id: chapterId,
        content: enrichedContent,
        aiUsed: aiUsed
      },
    };
  } catch (error) {
    console.error('Error enriching chapter:', error);
    return { success: false, error: 'Failed to enrich chapter.' };
  }
}
