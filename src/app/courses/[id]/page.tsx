'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { getCourseById } from '@/lib/data';
import type { Course, Chapter } from '@/lib/definitions';
import { notFound } from 'next/navigation';
import { ChapterList } from '@/components/chapters/chapter-list';
import { ChapterContent } from '@/components/chapters/chapter-content';
import { useLocalStorage } from '@/hooks/use-local-storage';

export default function CoursePage({ params }: { params: { id: string } }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeChapterId, setActiveChapterId] = useLocalStorage<string | null>(
    `activeChapter_${params.id}`,
    null
  );

  const fetchCourseData = useCallback(async () => {
    setLoading(true);
    const fetchedCourse = await getCourseById(params.id);
    if (!fetchedCourse) {
      notFound();
    } else {
      setCourse(fetchedCourse);
       // Auto-select first chapter if none is active
      if (fetchedCourse.chapters && fetchedCourse.chapters.length > 0 && !activeChapterId) {
        setActiveChapterId(fetchedCourse.chapters[0].id);
      } else if (fetchedCourse.chapters && !fetchedCourse.chapters.some(c => c.id === activeChapterId)) {
        // If active chapter is not in the list, reset it
        setActiveChapterId(fetchedCourse.chapters.length > 0 ? fetchedCourse.chapters[0].id : null);
      }
    }
    setLoading(false);
  }, [params.id, activeChapterId, setActiveChapterId]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);


  const activeChapter = useMemo(
    () => course?.chapters?.find((c) => c.id === activeChapterId),
    [course?.chapters, activeChapterId]
  );
  
  const handleChapterSelect = (chapterId: string) => {
    setActiveChapterId(chapterId);
  };

  const handleAddChapter = async (newChapter: Chapter) => {
    await fetchCourseData();
    setActiveChapterId(newChapter.id);
  };

  const handleUpdateChapter = useCallback(async () => {
    // Just refetch the data to get the latest version
    await fetchCourseData();
  }, [fetchCourseData]);

  if (loading || !course) {
    return <div className="text-center p-8">Carregando curso...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] -m-4 sm:-m-6 lg:-m-8">
      <aside className="h-full w-full max-w-sm border-r border-border bg-card/50">
        <ChapterList
          course={course}
          activeChapterId={activeChapterId}
          onChapterSelect={handleChapterSelect}
          onAddChapter={handleAddChapter}
        />
      </aside>
      <main className="h-full flex-1 overflow-y-auto">
        <ChapterContent 
          key={activeChapter?.id} // Force re-mount on chapter change
          course={course}
          chapter={activeChapter} 
          onUpdateChapter={handleUpdateChapter}
        />
      </main>
    </div>
  );
}
