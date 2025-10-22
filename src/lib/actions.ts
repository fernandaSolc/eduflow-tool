'use server';

import { revalidatePath } from 'next/cache';
import { backendService } from './services';
import { aiService, type CreateChapterRequest } from './ai-service';
import type { Course, Chapter } from './definitions';

export async function createCourseAction(
  values: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'chapters'>
) {
  try {
    // 1. Criar o curso base no backend
    const { data: newCourse } = await backendService.createCourse(values);

    // 2. Usar o AI Service para gerar os capítulos iniciais (simulando uma chamada)
    // Em um cenário real, você poderia ter um endpoint no AI Service para isso.
    // Aqui, vamos gerar o primeiro capítulo como exemplo.
    const chapterInput: CreateChapterRequest = {
      courseId: newCourse.id,
      courseTitle: newCourse.title,
      courseDescription: newCourse.description,
      subject: newCourse.subject,
      educationalLevel: newCourse.educationalLevel,
      targetAudience: newCourse.targetAudience,
      template: newCourse.template,
      philosophy: newCourse.philosophy,
      chapterNumber: 1,
      additionalContext: `Título do Capítulo: Introdução\n\nInstruções: Gere um capítulo introdutório para o curso.`
    };
    await aiService.createChapter(chapterInput);
    
    revalidatePath('/');
    revalidatePath(`/courses/${newCourse.id}`);
    
    return { success: true, data: newCourse };
  } catch (error) {
    console.error('Erro ao criar curso:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao criar o curso.';
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
      educationalLevel: course.educationalLevel,
      targetAudience: course.targetAudience,
      template: course.template,
      philosophy: course.philosophy,
      chapterNumber: (course.chapters?.length || 0) + 1,
      additionalContext: `Título do Capítulo: ${values.title}\n\nInstruções: ${values.prompt}`
    };

    const newChapter = await aiService.createChapter(input);

    revalidatePath(`/courses/${course.id}`);
    return {
      success: true,
      data: newChapter,
    };
  } catch (error) {
    console.error('Erro ao gerar capítulo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao gerar capítulo.';
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
    // Monta um contexto mais rico para a IA
    const context = `Expanda o seguinte trecho de texto: "${values.selection}".\nInstruções adicionais: ${values.additionalDetails || 'Nenhuma.'}`;

    const updatedChapter = await aiService.continueChapter(
        chapterId, 
        'expand', // Ação de expansão
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
    // Monta um contexto mais rico para a IA
    const context = `Simplifique o seguinte trecho de texto: "${values.selection}".\nInstruções adicionais: ${values.additionalDetails || 'Nenhuma.'}`;

    // Reutilizando o `continueChapter` com um tipo de ação diferente
    // O AI Service precisará saber como lidar com 'simplify'
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


export async function enrichChapterAction(
  chapter: Chapter,
  values: {
    userQuery: string;
  }
) {
  try {
    const updatedChapter = await aiService.continueChapter(
        chapter.id, 
        'expand', // Ação de enriquecer pode ser mapeada para expandir com um contexto específico
        `Enriquecer o seguinte conteúdo com base na consulta do usuário: "${values.userQuery}". Conteúdo existente: "${chapter.content}"`
    );
    
    revalidatePath(`/courses/${updatedChapter.courseId}`);
    return {
      success: true,
      data: {
        ...updatedChapter,
        aiUsed: true // Assumindo que o serviço de IA foi usado
      },
    };
  } catch (error) {
    console.error('Erro ao enriquecer capítulo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao enriquecer capítulo.';
    return { success: false, error: errorMessage };
  }
}
