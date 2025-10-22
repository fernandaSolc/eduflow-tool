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
    const course = await getCourseById(courseId);
    if (course) {
        if (!course.chapters) {
            course.chapters = [];
        }
        const existingChapterIndex = course.chapters.findIndex(c => c.id === chapter.id);
        if (existingChapterIndex > -1) {
            course.chapters[existingChapterIndex] = chapter;
        } else {
            course.chapters.push(chapter);
        }
    }
}

export async function updateChapterContent(courseId: string, chapterId: string, newContent: string) {
    const course = await getCourseById(courseId);
    if (course && course.chapters) {
        const chapter = course.chapters.find(c => c.id === chapterId);
        if (chapter) {
            chapter.content = newContent;
        }
    }
}

export async function updateChapter(courseId: string, updatedChapter: Chapter) {
  const course = await getCourseById(courseId);
  if (course && course.chapters) {
    const chapterIndex = course.chapters.findIndex(c => c.id === updatedChapter.id);
    if (chapterIndex !== -1) {
      course.chapters[chapterIndex] = updatedChapter;
    }
  }
}
