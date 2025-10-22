import type { Course, Chapter } from './definitions';
import { backendService } from './services';

const mockChapters: Chapter[] = [
    {
        id: 'chapter-1',
        courseId: '1',
        chapterNumber: 1,
        title: 'Capítulo 1: Introdução ao Empreendedorismo',
        content: '<h1>Introdução ao Empreendedorismo</h1><p>Este é o conteúdo do primeiro capítulo...</p>',
        sections: [],
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metrics: {
            readabilityScore: 85,
            durationMin: 15,
            coverage: 90,
        },
        suggestions: ['Adicionar mais exemplos práticos.'],
        canContinue: true,
        availableContinueTypes: ['expand', 'add_section', 'add_activities', 'add_assessments'],
    },
    {
        id: 'chapter-2',
        courseId: '1',
        chapterNumber: 2,
        title: 'Capítulo 2: Plano de Negócios',
        content: '<h1>Plano de Negócios</h1><p>Aprenda a criar um plano de negócios sólido...</p>',
        sections: [],
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metrics: {
            readabilityScore: 80,
            durationMin: 25,
            coverage: 85,
        },
        suggestions: ['Incluir um template de plano de negócios.'],
        canContinue: true,
        availableContinueTypes: ['expand', 'add_section'],
    },
];

const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Empreendedorismo no Maranhão',
    description: 'Um curso completo sobre como iniciar um negócio de sucesso no estado do Maranhão, abordando desde a ideia inicial até a gestão do dia a dia.',
    subject: 'Empreendedorismo',
    educationalLevel: 'Ensino Médio',
    targetAudience: 'Estudantes e futuros empreendedores',
    template: 'empreendedorismo_maranhao',
    philosophy: 'Foco em exemplos práticos e na realidade local.',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    chapters: mockChapters,
  },
    {
    id: '2',
    title: 'Culinária Nordestina',
    description: 'Aprenda os segredos da culinária nordestina, com receitas tradicionais e dicas de chefs renomados.',
    subject: 'Culinária',
    educationalLevel: 'Livre',
    targetAudience: 'Amantes da gastronomia',
    template: 'culinaria_regional',
    philosophy: 'Mão na massa e muito sabor.',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    chapters: [],
  }
];


export const getCourses = async (): Promise<Course[]> => {
    // try {
    //     const response = await backendService.getCourses();
    //     return response.data;
    // } catch (error) {
    //     console.error("Failed to fetch courses, returning empty array:", error);
    //     return [];
    // }
    return Promise.resolve(mockCourses);
}

export const getCourseById = async (id: string): Promise<Course | undefined> => {
    if (!id) return undefined;
    // try {
    //     const response = await backendService.getCourseById(id);
    //     const course = response.data;
        
    //     // Fetch chapters separately and attach them to the course
    //     const chaptersResponse = await backendService.getCourseChapters(id);
    //     course.chapters = chaptersResponse.data;

    //     return course;
    // } catch (error) {
    //     console.error(`Failed to fetch course ${id}:`, error);
    //     return undefined;
    // }
    const course = mockCourses.find(c => c.id === id);
    return Promise.resolve(course);
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
