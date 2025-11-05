import type { Course, Chapter, Subchapter, ChapterOutline, SubchapterTemplate, BibliographyItem } from '@/lib/definitions';

function normalizeOutline(o: any, index: number): ChapterOutline {
  const number = typeof o?.number === 'number' ? o.number : index + 1;
  const wordCount = Number(o?.wordCount ?? o?.word_count ?? 0) || 0;
  const order = (o?.order ?? o?.number ?? (index + 1)) as number;
  return {
    number,
    title: String(o?.title ?? ''),
    description: String(o?.description ?? ''),
    wordCount,
    order: Number(order) || number,
  };
}

function normalizeSubchapterTemplate(s: any): SubchapterTemplate | undefined {
  if (!s && !s?.structure) return undefined;
  return {
    structure: String(s?.structure ?? ''),
    minSubchapters: s?.minSubchapters ?? s?.min_subchapters ?? undefined,
    maxSubchapters: s?.maxSubchapters ?? s?.max_subchapters ?? undefined,
    wordCountPerSubchapter: s?.wordCountPerSubchapter ?? s?.word_count_per_subchapter ?? undefined,
  };
}

function normalizeBibliographyItem(b: any): BibliographyItem {
  return {
    id: String(b?.id ?? ''),
    title: String(b?.title ?? ''),
    author: b?.author ?? null ?? undefined,
    year: b?.year ?? null ?? undefined,
    url: b?.url ?? null ?? undefined,
  };
}

function normalizeSubchapter(s: any): Subchapter {
  return {
    id: String(s?.id ?? ''),
    chapter_id: String(s?.chapterId ?? s?.chapter_id ?? ''),
    subchapter_number: Number(s?.subchapterNumber ?? s?.subchapter_number ?? 0) || 0,
    title: String(s?.title ?? ''),
    content: String(s?.content ?? ''),
    status: (s?.status as any) ?? 'completed',
    created_at: String(s?.createdAt ?? s?.created_at ?? ''),
    updated_at: String(s?.updatedAt ?? s?.updated_at ?? ''),
    wordCount: Number(s?.wordCount ?? s?.word_count ?? 0) || 0,
    orderIndex: Number(s?.orderIndex ?? s?.subchapterNumber ?? s?.subchapter_number ?? 0) || 0,
  };
}

function normalizeChapter(ch: any): Chapter {
  const subchapters: Subchapter[] = Array.isArray(ch?.subchapters)
    ? ch.subchapters.map(normalizeSubchapter)
    : [];

  return {
    id: String(ch?.id ?? ''),
    course_id: String(ch?.courseId ?? ch?.course_id ?? ''),
    chapter_number: Number(ch?.chapterNumber ?? ch?.chapter_number ?? 0) || 0,
    title: String(ch?.title ?? ''),
    content: String(ch?.content ?? ''),
    sections: ch?.sections ?? [],
    subchapters,
    currentSubchapterNumber: Number(ch?.currentSubchapterNumber ?? ch?.current_subchapter_number ?? 1) || 1,
    isIntroduction: !!(ch?.isIntroduction ?? ch?.is_introduction ?? false),
    status: ch?.status ?? 'draft',
    created_at: String(ch?.createdAt ?? ch?.created_at ?? ''),
    updated_at: String(ch?.updatedAt ?? ch?.updated_at ?? ''),
    metrics: ch?.metrics ?? {
      readabilityScore: 0,
      durationMinutes: 0,
      coveragePercentage: 0,
      qualityScore: 0,
      wordCount: 0,
      sectionCompleteness: 0,
    },
    suggestions: ch?.suggestions ?? [],
    can_continue: ch?.can_continue ?? false,
    available_continue_types: ch?.available_continue_types ?? [],
    workflow_id: ch?.workflow_id,
    execution_meta: ch?.execution_meta,
  } as Chapter;
}

export function normalizeCourse(raw: any): Course {
  const c = raw || {};
  const outlines: ChapterOutline[] = Array.isArray(c?.chapterOutlines || c?.chapter_outlines)
    ? (c.chapterOutlines || c.chapter_outlines).map((o: any, i: number) => normalizeOutline(o, i))
    : [];

  const chapters: Chapter[] = Array.isArray(c?.chapters) ? c.chapters.map(normalizeChapter) : [];

  const bibliography: BibliographyItem[] = Array.isArray(c?.bibliography)
    ? c.bibliography.map(normalizeBibliographyItem)
    : [];

  return {
    id: String(c?.id ?? ''),
    title: String(c?.title ?? ''),
    description: String(c?.description ?? ''),
    subject: String(c?.subject ?? ''),
    educationalLevel: c?.educationalLevel ?? c?.educational_level ?? undefined,
    targetAudience: c?.targetAudience ?? c?.target_audience ?? undefined,
    template: String(c?.template ?? ''),
    philosophy: String(c?.philosophy ?? ''),
    chapterOutlines: outlines,
    subchapterTemplate: normalizeSubchapterTemplate(c?.subchapterTemplate ?? c?.subchapter_template),
    bibliography,
    status: String(c?.status ?? ''),
    createdAt: String(c?.createdAt ?? c?.created_at ?? ''),
    updatedAt: String(c?.updatedAt ?? c?.updated_at ?? ''),
    chapters,
  } as Course;
}

export function normalizeCourses(rawCourses: any[]): Course[] {
  if (!Array.isArray(rawCourses)) return [];
  return rawCourses.map(normalizeCourse);
}
