import type { Course, Chapter } from './definitions';
import { backendService } from './services';

const MOCK_CHAPTERS: Chapter[] = [
  {
    id: 'ch-1',
    title: 'Chapter 1: Introduction to Entrepreneurship',
    content: '<p>This is the introductory content about entrepreneurship. We will cover the fundamental concepts and the importance of the entrepreneurial mindset.</p><p>We will explore how to identify opportunities and turn ideas into viable businesses. The chapter includes practical examples and case studies.</p><h2>Main Topics:</h2><ul><li>What is entrepreneurship?</li><li>The entrepreneur profile</li><li>Innovation and Creativity</li></ul>',
    sections: [],
    suggestions: [],
  },
  {
    id: 'ch-2',
    title: 'Chapter 2: Business Plan',
    content: '<h2>Building Your Business Plan</h2><p>In this chapter, you will learn how to structure a solid business plan, essential for the success of any venture. We will cover everything from market analysis to financial projections.</p><p>A good business plan serves as a roadmap for your company and is a vital tool for attracting investors.</p>',
    sections: [],
    suggestions: [],
  }
];


const MOCK_COURSES: Course[] = [
  {
    id: '1',
    title: 'Entrepreneurship in Maranhão',
    description: 'A complete course on how to start and manage a successful business in the state of Maranhão, exploring local opportunities.',
    subject: 'Entrepreneurship',
    educationalLevel: 'High School',
    targetAudience: 'Students and new entrepreneurs',
    template: 'empreendedorismo_maranhao',
    philosophy: 'Practical education focused on the local market.',
    status: 'active',
    createdAt: '2023-10-26T10:00:00Z',
    updatedAt: '2023-10-26T10:00:00Z',
    chapters: MOCK_CHAPTERS,
  },
  {
    id: '2',
    title: 'Interface Design with Figma',
    description: 'Learn to create modern and functional user interfaces using the most popular design tool on the market, Figma.',
    subject: 'UI/UX Design',
    educationalLevel: 'Free',
    targetAudience: 'Designers and developers',
    template: 'design_figma',
    philosophy: 'Learning by doing, with practical projects.',
    status: 'active',
    createdAt: '2023-10-25T11:00:00Z',
    updatedAt: '2023-10-25T11:00:00Z',
    chapters: [],
  },
];


export const getCourses = async (): Promise<Course[]> => {
    // try {
    //     const response = await backendService.getCourses();
    //     return response.data;
    // } catch (error) {
    //     console.error("Failed to fetch courses:", error);
    //     return [];
    // }
    console.log("Using mock courses");
    return Promise.resolve(MOCK_COURSES);
}

export const getCourseById = async (id: string): Promise<Course | undefined> => {
    if (!id) return undefined;
    // try {
    //     const response = await backendService.getCourseById(id);
    //     return response.data;
    // } catch (error) {
    //     console.error(`Failed to fetch course ${id}:`, error);
    //     return undefined;
    // }
    console.log(`Using mock course for id: ${id}`);
    const course = MOCK_COURSES.find(c => c.id === id);
    return Promise.resolve(course);
}

export async function addChapterToCourse(courseId: string, chapter: Course['chapters'][0]) {
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
