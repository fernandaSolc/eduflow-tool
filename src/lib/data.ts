'use server';

import type { Course, Chapter } from './definitions';
import { backendService } from './services';

export const getCourses = async (): Promise<Course[]> => {
    try {
        const response = await backendService.getCourses();
        // A API retorna um objeto com 'data' e 'pagination', pegamos apenas 'data'
        return response.data;
    } catch (error) {
        console.error("Failed to fetch courses:", error);
        // Em caso de erro, retorna um array vazio para não quebrar a UI
        return [];
    }
}

export const getCourseById = async (id: string): Promise<Course | undefined> => {
    if (!id) return undefined;
    try {
        // A API retorna um objeto com 'success' e 'data'
        const { data: course } = await backendService.getCourseById(id);

        if (course) {
            // Fetch chapters separadamente e anexa ao curso
            const { data: chapters } = await backendService.getCourseChapters(id);
            course.chapters = chapters;
        }

        return course;
    } catch (error) {
        console.error(`Failed to fetch course ${id}:`, error);
        // Retorna undefined para que a página possa tratar como "não encontrado"
        return undefined;
    }
}

export async function addChapterToCourse(courseId: string, chapter: Chapter) {
    try {
        // Atualizar o capítulo no backend
        const result = await backendService.updateChapter(chapter.id, chapter);
        if (result.success) {
            console.log(`Chapter ${chapter.id} updated in backend`);
        }
    } catch (error) {
        console.error(`Failed to update chapter ${chapter.id}:`, error);
    }
}

export async function updateChapterContent(courseId: string, chapterId: string, oldContent: string, newContent: string) {
    try {
        // Buscar o capítulo atual
        const { data: chapter } = await backendService.getChapterById(chapterId);
        if (chapter) {
            // Atualizar o conteúdo
            const updatedContent = chapter.content.replace(oldContent, newContent);
            const result = await backendService.updateChapter(chapterId, { content: updatedContent });

            if (result.success) {
                console.log(`Chapter ${chapterId} content updated in backend`);
            }
        }
    } catch (error) {
        console.error(`Failed to update chapter content ${chapterId}:`, error);
    }
}

export async function updateChapter(courseId: string, updatedChapter: Chapter) {
    try {
        const result = await backendService.updateChapter(updatedChapter.id, updatedChapter);
        if (result.success) {
            console.log(`Chapter ${updatedChapter.id} updated in backend`);
        }
    } catch (error) {
        console.error(`Failed to update chapter ${updatedChapter.id}:`, error);
    }
}
