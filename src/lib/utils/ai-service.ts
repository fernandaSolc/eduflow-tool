/**
 * Utilitários para preparar payloads para o AI Service
 * Conforme guia de integração completo
 */

import type { CreateChapterRequest, GenerateSubchapterRequest } from '@/lib/ai-service';

// ChapterOutline shape used in requests
export type ChapterOutline = {
  number: number;
  title: string;
  description: string;
  wordCount: number;
  order: number;
};

/**
 * Normaliza um ChapterOutline garantindo tipos corretos
 */
export function normalizeChapterOutline(outline: any, index: number = 0): ChapterOutline {
  const num = Number(outline?.number);
  const number = Number.isFinite(num) && num >= 1 ? num : index + 1;

  const wcRaw = Number(outline?.wordCount);
  const wordCount = Number.isFinite(wcRaw) && wcRaw >= 100 ? wcRaw : 100;

  const ordRaw = Number(outline?.order ?? outline?.number ?? number);
  const order = Number.isFinite(ordRaw) && ordRaw >= 1 ? ordRaw : number;

  return {
    number,
    title: String(outline?.title ?? ''),
    description: String(outline?.description ?? ''),
    wordCount,
    order,
  };
}

/**
 * Normaliza e valida unicidade de numbers em ChapterOutlines
 */
export function normalizeChapterOutlines(outlines: any[]): ChapterOutline[] {
  if (!Array.isArray(outlines) || outlines.length === 0) {
    throw new Error('chapterOutlines deve ser um array não vazio');
  }

  const normalized = outlines.map((o, i) => normalizeChapterOutline(o, i));

  const numbers = normalized.map((o) => o.number);
  const uniqueNumbers = new Set(numbers);
  if (numbers.length !== uniqueNumbers.size) {
    const duplicates = numbers.filter((n, i) => numbers.indexOf(n) !== i);
    throw new Error(`Números de capítulos devem ser únicos. Duplicados: ${[...new Set(duplicates)].join(', ')}`);
  }

  return normalized;
}

/**
 * Prepara payload para gerar introdução completa
 */
export function prepareIntroductionPayload(course: any): CreateChapterRequest {
  if (!course?.id) throw new Error('course.id é obrigatório');
  if (!course?.title || String(course.title).trim().length < 3) throw new Error('course.title deve ter pelo menos 3 caracteres');
  if (!course?.subject || String(course.subject).trim().length < 2) throw new Error('course.subject deve ter pelo menos 2 caracteres');
  if (!course?.template || String(course.template).trim().length < 10) throw new Error('course.template deve ter pelo menos 10 caracteres');
  if (!course?.philosophy || String(course.philosophy).trim().length < 10) throw new Error('course.philosophy deve ter pelo menos 10 caracteres');

  const chapterOutlines = normalizeChapterOutlines(course?.chapterOutlines || []);

  if (!course?.subchapterTemplate?.structure || String(course.subchapterTemplate.structure).trim().length < 20) {
    throw new Error('subchapterTemplate.structure deve ter pelo menos 20 caracteres');
  }

  const subchapterTemplate = {
    structure: String(course.subchapterTemplate.structure),
    minSubchapters: course.subchapterTemplate.minSubchapters ? Number(course.subchapterTemplate.minSubchapters) : undefined,
    maxSubchapters: course.subchapterTemplate.maxSubchapters ? Number(course.subchapterTemplate.maxSubchapters) : undefined,
    wordCountPerSubchapter: course.subchapterTemplate.wordCountPerSubchapter ? Number(course.subchapterTemplate.wordCountPerSubchapter) : undefined,
  };

  const bibliography = Array.isArray(course?.bibliography)
    ? course.bibliography.map((b: any) => ({
      title: String(b?.title ?? ''),
      author: b?.author ? String(b.author) : undefined,
      year: b?.year ? String(b.year) : undefined,
      url: b?.url ? String(b.url) : undefined,
    }))
    : undefined;

  const payload: CreateChapterRequest = {
    courseId: String(course.id),
    courseTitle: String(course.title),
    courseDescription: String(course?.description || ''),
    subject: String(course.subject),
    educationalLevel: String(course.educationalLevel || ''),
    targetAudience: String(course.targetAudience || ''),
    template: String(course.template),
    philosophy: String(course.philosophy),
    isIntroduction: true,
    chapterNumber: 0,
    chapterOutlines,
    subchapterTemplate,
    bibliography,
    title: 'Introdução',
  };

  return payload;
}

/**
 * Prepara payload para geração de subcapítulo incremental
 */
export function prepareSubchapterPayload(course: any, chapter: any, subchapterNumber: number): GenerateSubchapterRequest {
  if (!course?.id) throw new Error('course.id é obrigatório');
  if (!chapter?.id) throw new Error('chapter.id é obrigatório');

  const outline = (course?.chapterOutlines || []).find((o: any) => Number(o?.number) === Number(chapter?.chapterNumber));
  if (!outline) throw new Error(`Outline para capítulo ${chapter?.chapterNumber} não encontrado`);

  const chapterOutline: GenerateSubchapterRequest['chapterOutline'] = {
    number: Number(outline.number),
    title: String(outline.title || chapter.title || ''),
    description: String(outline.description || ''),
    wordCount: Number(outline.wordCount || 1000),
    order: Number(outline.order || outline.number || chapter.chapterNumber || 1),
  };

  const bibliography = Array.isArray(course?.bibliography)
    ? course.bibliography.map((b: any) => ({
      title: String(b?.title ?? ''),
      author: b?.author ? String(b.author) : undefined,
      year: b?.year ? String(b.year) : undefined,
      url: b?.url ? String(b.url) : undefined,
    }))
    : undefined;

  const payload: GenerateSubchapterRequest = {
    courseId: String(course.id),
    chapterId: String(chapter.id),
    chapterNumber: Number(chapter.chapterNumber || chapter.chapter_number || 0),
    chapterTitle: String(chapter.title || ''),
    subchapterNumber: Number.isFinite(Number(subchapterNumber)) && Number(subchapterNumber) >= 1
      ? Number(subchapterNumber)
      : ((Array.isArray(chapter?.subchapters) ? chapter.subchapters.length : 0) + 1),
    chapterOutline,
    existingSubchapters: Array.isArray(chapter?.subchapters)
      ? chapter.subchapters.map((s: any) => ({
        number: Number(s?.subchapter_number || s?.subchapterNumber || 0),
        title: String(s?.title || ''),
        content: String(s?.content || ''),
      }))
      : undefined,
    courseTitle: String(course.title || ''),
    courseDescription: String(course.description || ''),
    subject: String(course.subject || ''),
    educationalLevel: String(course.educationalLevel || ''),
    targetAudience: String(course.targetAudience || ''),
    template: String(course.template || ''),
    subchapterTemplate: {
      structure: String(course?.subchapterTemplate?.structure || ''),
      minSubchapters: course?.subchapterTemplate?.minSubchapters ? Number(course.subchapterTemplate.minSubchapters) : undefined,
      maxSubchapters: course?.subchapterTemplate?.maxSubchapters ? Number(course.subchapterTemplate.maxSubchapters) : undefined,
      wordCountPerSubchapter: course?.subchapterTemplate?.wordCountPerSubchapter ? Number(course.subchapterTemplate.wordCountPerSubchapter) : undefined,
    },
    philosophy: String(course.philosophy || ''),
    bibliography,
    introductionContent: String(course?.introduction?.content || ''),
  };

  return payload;
}

