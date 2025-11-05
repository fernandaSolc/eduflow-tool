'use server';

import type { Course, Chapter } from './definitions';
import { backendService } from './services';
import { normalizeCourse, normalizeCourses } from './utils/normalize';

export const getCourses = async (): Promise<Course[]> => {
    try {
        const response = await backendService.getCourses();
        // Normaliza e mantém shape completo (sem mutar)
        return normalizeCourses(response.data);
    } catch (error) {
        console.error("Failed to fetch courses:", error);
        return [];
    }
}

export const getCourseById = async (id: string): Promise<Course | undefined> => {
    if (!id) return undefined;
    try {
        const { data: rawCourse } = await backendService.getCourseById(id);
        if (!rawCourse) return undefined;

        // Busca capítulos separadamente
        const { data: rawChapters } = await backendService.getCourseChapters(id);
        // Normaliza curso e capítulos sem mutar o original
        const normalized = normalizeCourse({ ...rawCourse, chapters: rawChapters });
        return normalized;
    } catch (error) {
        console.error(`Failed to fetch course ${id}:`, error);
        return undefined;
    }
}

export async function addChapterToCourse(courseId: string, chapter: Chapter) {
    try {
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
        const { data: chapter } = await backendService.getChapterById(chapterId);
        if (chapter) {
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
