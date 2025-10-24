'use server';

import type { Course, Chapter } from './definitions';
import { backendService } from './services';
import { mockCourse, mockCourses } from './mock-data';

export const getCourses = async (): Promise<Course[]> => {
    // try {
    //     const response = await backendService.getCourses();
    //     // A API retorna um objeto com 'data' e 'pagination', pegamos apenas 'data'
    //     return response.data;
    // } catch (error) {
    //     console.error("Failed to fetch courses:", error);
    //     // Em caso de erro, retorna um array vazio para não quebrar a UI
    //     return [];
    // }
    console.log("Usando dados mocados para getCourses");
    return Promise.resolve(mockCourses);
}

export const getCourseById = async (id: string): Promise<Course | undefined> => {
    if (!id) return undefined;
    // try {
    //     // A API retorna um objeto com 'success' e 'data'
    //     const { data: course } = await backendService.getCourseById(id);
        
    //     if (course) {
    //         // Fetch chapters separadamente e anexa ao curso
    //         const { data: chapters } = await backendService.getCourseChapters(id);
    //         course.chapters = chapters;
    //     }

    //     return course;
    // } catch (error) {
    //     console.error(`Failed to fetch course ${id}:`, error);
    //     // Retorna undefined para que a página possa tratar como "não encontrado"
    //     return undefined;
    // }
    console.log(`Usando dados mocados para getCourseById com id: ${id}`);
    const course = mockCourses.find(c => c.id === id);
    return Promise.resolve(course);
}

export async function addChapterToCourse(courseId: string, chapter: Chapter) {
    if (courseId !== 'mock-course-1') return;
    
    if (mockCourse) {
        if (!mockCourse.chapters) {
            mockCourse.chapters = [];
        }
        const existingChapterIndex = mockCourse.chapters.findIndex(c => c.id === chapter.id);
        if (existingChapterIndex > -1) {
            mockCourse.chapters[existingChapterIndex] = chapter;
        } else {
            mockCourse.chapters.push(chapter);
        }
    }
}

export async function updateChapterContent(courseId: string, chapterId: string, oldContent: string, newContent: string) {
    if (courseId !== 'mock-course-1' || !mockCourse.chapters) return;
    
    const chapter = mockCourse.chapters.find(c => c.id === chapterId);
    if (chapter) {
        chapter.content = chapter.content.replace(oldContent, newContent);
    }
}

export async function updateChapter(courseId: string, updatedChapter: Chapter) {
  if (courseId !== 'mock-course-1' || !mockCourse.chapters) return;
  
  const chapterIndex = mockCourse.chapters.findIndex(c => c.id === updatedChapter.id);
  if (chapterIndex !== -1) {
    mockCourse.chapters[chapterIndex] = updatedChapter;
  }
}
