import type { Course } from './definitions';
import { backendService } from './services';

export const getCourses = async (): Promise<Course[]> => {
    try {
        const response = await backendService.getCourses();
        return response.data;
    } catch (error) {
        console.error("Failed to fetch courses:", error);
        return [];
    }
}

export const getCourseById = async (id: string): Promise<Course | undefined> => {
    if (!id) return undefined;
    try {
        const response = await backendService.getCourseById(id);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch course ${id}:`, error);
        return undefined;
    }
}

// These functions below are now connecting to the real backend.
// Note: The chapter logic still uses the AI service flow, which then hits the backend.
// The functions here are mainly for fetching data to display.

// This is a mock function to simulate updating data. In a real app, this would be a database call.
export async function addChapterToCourse(courseId: string, chapter: Course['chapters'][0]) {
    const course = await getCourseById(courseId);
    if (course) {
        // In a real scenario, we would post the new chapter to the backend
        // For now, we will just push it to the local object for UI updates.
        // The actual creation happens via AI service.
        if (!course.chapters) {
            course.chapters = [];
        }
        course.chapters.push(chapter);
    }
}

export async function updateChapterContent(courseId: string, chapterId: string, newContent: string) {
    const course = await getCourseById(courseId);
    if (course && course.chapters) {
        const chapter = course.chapters.find(c => c.id === chapterId);
        if (chapter) {
            // Similarly, this would be a PUT/PATCH request to the backend.
            chapter.content = newContent;
        }
    }
}
