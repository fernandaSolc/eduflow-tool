import type { Course, Chapter } from './definitions';
import { backendService } from './services';


export const getCourses = async (): Promise<Course[]> => {
    try {
        const response = await backendService.getCourses();
        return response.data;
    } catch (error) {
        console.error("Failed to fetch courses, returning empty array:", error);
        return [];
    }
}

export const getCourseById = async (id: string): Promise<Course | undefined> => {
    if (!id) return undefined;
    try {
        const response = await backendService.getCourseById(id);
        const course = response.data;
        
        // Fetch chapters separately and attach them to the course
        const chaptersResponse = await backendService.getCourseChapters(id);
        course.chapters = chaptersResponse.data;

        return course;
    } catch (error) {
        console.error(`Failed to fetch course ${id}:`, error);
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
