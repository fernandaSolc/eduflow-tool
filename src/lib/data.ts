import type { Course, Chapter } from './definitions';
import { backendService } from './services';

const MOCK_CHAPTERS: Chapter[] = [
  {
    id: 'ch-1',
    title: 'Capítulo 1: Introdução ao Empreendedorismo',
    content: '<p>Este é o conteúdo introdutório sobre empreendedorismo. Abordaremos os conceitos fundamentais e a importância do mindset empreendedor.</p><p>Exploraremos como identificar oportunidades e transformar ideias em negócios viáveis. O capítulo inclui exemplos práticos e estudos de caso.</p><h2>Tópicos Principais:</h2><ul><li>O que é empreendedorismo?</li><li>Perfil do empreendedor</li><li>Inovação e Criatividade</li></ul>',
    sections: [],
    suggestions: [],
  },
  {
    id: 'ch-2',
    title: 'Capítulo 2: Plano de Negócios',
    content: '<h2>Construindo seu Plano de Negócios</h2><p>Neste capítulo, você aprenderá a estruturar um plano de negócios sólido, essencial para o sucesso de qualquer empreendimento. Abordaremos desde a análise de mercado até as projeções financeiras.</p><p>Um bom plano de negócios serve como um roteiro para sua empresa e é uma ferramenta vital para atrair investidores.</p>',
    sections: [],
    suggestions: [],
  }
];


const MOCK_COURSES: Course[] = [
  {
    id: '1',
    title: 'Empreendedorismo no Maranhão',
    description: 'Um curso completo sobre como iniciar e gerenciar um negócio de sucesso no estado do Maranhão, explorando as oportunidades locais.',
    subject: 'Empreendedorismo',
    educationalLevel: 'Ensino Médio',
    targetAudience: 'Estudantes e novos empreendedores',
    template: 'empreendedorismo_maranhao',
    philosophy: 'Educação prática e focada no mercado local.',
    status: 'active',
    createdAt: '2023-10-26T10:00:00Z',
    updatedAt: '2023-10-26T10:00:00Z',
    chapters: MOCK_CHAPTERS,
  },
  {
    id: '2',
    title: 'Design de Interfaces com Figma',
    description: 'Aprenda a criar interfaces de usuário modernas e funcionais utilizando a ferramenta de design mais popular do mercado, o Figma.',
    subject: 'UI/UX Design',
    educationalLevel: 'Livre',
    targetAudience: 'Designers e desenvolvedores',
    template: 'design_figma',
    philosophy: 'Aprender fazendo, com projetos práticos.',
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