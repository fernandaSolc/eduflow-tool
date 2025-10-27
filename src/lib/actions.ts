'use server';

import { revalidatePath } from 'next/cache';
import { backendService } from './services';
import { aiService, type CreateChapterRequest } from './ai-service';
import { aiServiceClient, type TransformRequest } from './ai-service-client';
import type { Course, Chapter } from './definitions';

export async function createCourseAction(
  values: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'chapters'>
) {
  try {
    const { data: newCourse } = await backendService.createCourse(values);

    const chapterInput: CreateChapterRequest = {
      courseId: newCourse.id,
      courseTitle: newCourse.title,
      courseDescription: newCourse.description,
      subject: newCourse.subject,
      educationalLevel: newCourse.educationalLevel || 'Ensino Médio',
      targetAudience: newCourse.targetAudience || 'Estudantes',
      template: newCourse.template,
      philosophy: newCourse.philosophy,
      title: 'Introdução',
      prompt: 'Gere um capítulo introdutório para o curso.',
      chapterNumber: 1,
      additionalContext: `Título do Capítulo: Introdução\n\nInstruções: Gere um capítulo introdutório para o curso.`
    };

    // O AI Service agora salva automaticamente no backend
    const newChapter = await aiService.createChapter(chapterInput);
    console.log('Capítulo criado e salvo no backend:', newChapter.id);

    revalidatePath('/');
    revalidatePath(`/courses/${newCourse.id}`);

    return { success: true, data: newCourse };
  } catch (error) {
    console.error('Erro ao criar curso:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao criar o curso.';
    console.error('Detalhes do erro:', {
      error: errorMessage,
      courseData: values,
      timestamp: new Date().toISOString()
    });
    return { success: false, error: errorMessage };
  }
}


export async function generateChapterAction(
  course: Course,
  values: { title: string; prompt: string }
) {
  try {
    const input: CreateChapterRequest = {
      courseId: course.id,
      courseTitle: course.title,
      courseDescription: course.description,
      subject: course.subject,
      educationalLevel: course.educationalLevel || 'Ensino Médio',
      targetAudience: course.targetAudience || 'Estudantes',
      template: course.template,
      philosophy: course.philosophy,
      title: values.title,
      prompt: values.prompt,
      chapterNumber: (course.chapters?.length || 0) + 1,
      additionalContext: `Título do Capítulo: ${values.title}\n\nInstruções: ${values.prompt}`
    };

    const newChapter = await aiService.createChapter(input);
    console.log('Capítulo gerado e salvo no backend:', newChapter.id);

    revalidatePath(`/courses/${course.id}`);
    return {
      success: true,
      data: newChapter,
    };
  } catch (error) {
    console.error('Erro ao gerar capítulo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao gerar capítulo.';
    console.error('Detalhes do erro:', {
      error: errorMessage,
      courseId: course.id,
      chapterData: values,
      timestamp: new Date().toISOString()
    });
    return { success: false, error: errorMessage };
  }
}

export async function expandChapterAction(
  courseId: string,
  chapterId: string,
  values: {
    selection: string;
    additionalDetails?: string;
  }
) {
  try {
    const context = `Expanda o seguinte trecho de texto: "${values.selection}".\nInstruções adicionais: ${values.additionalDetails || 'Nenhuma.'}`;

    const updatedChapter = await aiService.continueChapter(
      chapterId,
      'expand',
      context
    );

    revalidatePath(`/courses/${courseId}`);
    return {
      success: true,
      data: updatedChapter,
    };
  } catch (error) {
    console.error('Erro ao expandir capítulo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao expandir capítulo.';
    return { success: false, error: errorMessage };
  }
}


export async function simplifyChapterAction(
  courseId: string,
  chapterId: string,
  values: {
    selection: string;
    additionalDetails?: string;
  }
) {
  try {
    const context = `Simplifique o seguinte trecho de texto: "${values.selection}".\nInstruções adicionais: ${values.additionalDetails || 'Nenhuma.'}`;
    const updatedChapter = await aiService.continueChapter(
      chapterId,
      'simplify',
      context
    );

    revalidatePath(`/courses/${courseId}`);
    return {
      success: true,
      data: updatedChapter,
    };
  } catch (error) {
    console.error('Erro ao simplificar capítulo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao simplificar capítulo.';
    return { success: false, error: errorMessage };
  }
}

export async function generateQuestionAction(
  courseId: string,
  chapterId: string,
  values: {
    selection: string;
    additionalDetails?: string;
  }
) {
  try {
    const context = `Gere uma questão de avaliação (múltipla escolha ou dissertativa) sobre o seguinte trecho: "${values.selection}".\nInstruções adicionais: ${values.additionalDetails || 'Nenhuma.'}`;
    const updatedChapter = await aiService.continueChapter(
      chapterId,
      'assess',
      context
    );

    revalidatePath(`/courses/${courseId}`);
    return {
      success: true,
      data: updatedChapter,
    };
  } catch (error) {
    console.error('Erro ao gerar questão:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao gerar questão.';
    return { success: false, error: errorMessage };
  }
}

export async function createExampleAction(
  courseId: string,
  chapterId: string,
  values: {
    selection: string;
    additionalDetails?: string;
  }
) {
  try {
    const context = `Crie um exemplo prático, uma analogia ou um estudo de caso sobre o seguinte conceito: "${values.selection}".\nInstruções adicionais: ${values.additionalDetails || 'Nenhuma.'}`;
    const updatedChapter = await aiService.continueChapter(
      chapterId,
      'exemplify',
      context
    );

    revalidatePath(`/courses/${courseId}`);
    return {
      success: true,
      data: updatedChapter,
    };
  } catch (error) {
    console.error('Erro ao criar exemplo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao criar exemplo.';
    return { success: false, error: errorMessage };
  }
}


export async function enrichChapterAction(
  chapter: Chapter,
  values: {
    userQuery: string;
  }
) {
  try {
    const updatedChapter = await aiService.continueChapter(
      chapter.id,
      'expand',
      `Enriquecer o seguinte conteúdo com base na consulta do usuário: "${values.userQuery}". Conteúdo existente: "${chapter.content}"`
    );

    revalidatePath(`/courses/${updatedChapter.courseId}`);
    return {
      success: true,
      data: {
        ...updatedChapter,
        aiUsed: true
      },
    };
  } catch (error) {
    console.error('Erro ao enriquecer capítulo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao enriquecer capítulo.';
    return { success: false, error: errorMessage };
  }
}

export async function updateChapterContentAction(
  courseId: string,
  chapterId: string,
  oldContent: string,
  newContent: string,
  isFullEdit: boolean
) {
  try {
    const { data: chapter } = await backendService.getChapterById(chapterId);
    if (!chapter) {
      throw new Error("Capítulo não encontrado.");
    }

    const updatedContent = isFullEdit ? newContent : chapter.content.replace(oldContent, newContent);

    const result = await backendService.updateChapter(chapterId, { content: updatedContent });

    if (result.success) {
      revalidatePath(`/courses/${courseId}`);
      return { success: true, data: result.data };
    }

    return { success: false, error: 'Falha ao atualizar capítulo' };

  } catch (error) {
    console.error('Erro ao atualizar conteúdo do capítulo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao atualizar o conteúdo.';
    return { success: false, error: errorMessage };
  }
}

// ===== NOVAS FUNCIONALIDADES DE TRANSFORMAÇÃO INTELIGENTE =====

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
}

export async function transformChapterContent(
  chapterId: string,
  continueType: 'expand' | 'simplify' | 'exemplify' | 'assess' | 'add_section' | 'add_activities' | 'add_assessments',
  selectedText: string,
  additionalContext?: string
): Promise<ActionResult> {
  try {
    if (!chapterId || !continueType || !selectedText) {
      return {
        success: false,
        error: 'Parâmetros obrigatórios não fornecidos',
        message: 'Erro de validação: chapterId, continueType e selectedText são obrigatórios'
      };
    }

    const cleanText = selectedText.replace(/<[^>]*>/g, '').trim();
    
    if (cleanText.length < 10) {
      return {
        success: false,
        error: 'Texto muito curto',
        message: 'O texto selecionado deve ter pelo menos 10 caracteres'
      };
    }

    const request: TransformRequest = {
      chapterId,
      continueType,
      selectedText: cleanText,
      additionalContext
    };

    const result = await aiServiceClient.transformContent(request);

    revalidatePath(`/courses/[id]`);
    revalidatePath(`/courses/[id]/chapters/[chapterId]`);

    return {
      success: true,
      data: result,
      message: 'Conteúdo transformado com sucesso'
    };

  } catch (error) {
    console.error('Erro ao transformar conteúdo:', error);
    
    return {
      success: false,
      error: error.message,
      message: 'Erro ao transformar conteúdo. Tente novamente.'
    };
  }
}

export async function expandSelectedContent(
  chapterId: string,
  selectedText: string,
  additionalDetails?: string
): Promise<ActionResult> {
  return transformChapterContent(chapterId, 'expand', selectedText, additionalDetails);
}

export async function simplifySelectedContent(
  chapterId: string,
  selectedText: string,
  additionalDetails?: string
): Promise<ActionResult> {
  return transformChapterContent(chapterId, 'simplify', selectedText, additionalDetails);
}

export async function createExampleForContent(
  chapterId: string,
  selectedText: string,
  additionalDetails?: string
): Promise<ActionResult> {
  return transformChapterContent(chapterId, 'exemplify', selectedText, additionalDetails);
}

export async function generateQuestionForContent(
  chapterId: string,
  selectedText: string,
  additionalDetails?: string
): Promise<ActionResult> {
  return transformChapterContent(chapterId, 'assess', selectedText, additionalDetails);
}
