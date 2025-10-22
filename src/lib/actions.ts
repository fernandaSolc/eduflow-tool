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
import { backendService } from './services';
import type { Course } from './definitions';

export async function createCourseAction(
  values: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'status'>
) {
  try {
    const { data: newCourse } = await backendService.createCourse(values);
    revalidatePath('/');
    return { success: true, data: newCourse };
  } catch (error) {
    console.error('Erro ao criar curso:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao criar o curso.';
    return { success: false, error: errorMessage };
  }
}


export async function generateChapterAction(
  courseId: string,
  values: { title: string; prompt: string }
) {
  try {
    const input: GenerateNewChapterContentInput = {
      courseTitle: courseId, // Assumindo que courseId é o título para simplificar
      chapterPrompt: `Título: ${values.title}\nPrompt: ${values.prompt}`,
    };
    const { chapterContent } = await generateNewChapterContent(input);

    // Em um app real, você salvaria isso no seu banco de dados.
    // Por agora, vamos apenas registrar e revalidar.
    console.log('Conteúdo do Capítulo Gerado:', chapterContent);

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
    console.error('Erro ao gerar capítulo:', error);
    return { success: false, error: 'Falha ao gerar capítulo.' };
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

    // Em um app real, você atualizaria isso no seu banco de dados.
    console.log('Conteúdo do Capítulo Expandido:', expandedContent);

    revalidatePath(`/courses/${courseId}`);
    return {
      success: true,
      data: {
        id: chapterId,
        content: expandedContent,
      },
    };
  } catch (error) {
    console.error('Erro ao expandir capítulo:', error);
    return { success: false, error: 'Falha ao expandir capítulo.' };
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
    
    console.log('Conteúdo do Capítulo Enriquecido:', enrichedContent, 'IA Usada:', aiUsed);
    
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
    console.error('Erro ao enriquecer capítulo:', error);
    return { success: false, error: 'Falha ao enriquecer capítulo.' };
  }
}
