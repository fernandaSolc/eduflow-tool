'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { getCourseById } from '@/lib/data';
import type { Course, Chapter } from '@/lib/definitions';
import { notFound } from 'next/navigation';
import { ChapterList } from '@/components/chapters/chapter-list';
import { ChapterContent } from '@/components/chapters/chapter-content';
import { useLocalStorage } from '@/hooks/use-local-storage';

export default function CoursePage({ params }: { params: { id: string } }) {
  const { id: courseId } = params;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeChapterId, setActiveChapterId] = useLocalStorage<string | null>(
    `activeChapter_${courseId}`,
    null
  );

  const fetchCourseData = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
        const fetchedCourse = await getCourseById(courseId);
        if (!fetchedCourse) {
            notFound();
        } else {
            setCourse(fetchedCourse);
             // Auto-select first chapter if no chapter is active or the active one is not in the list
            if (fetchedCourse.chapters && fetchedCourse.chapters.length > 0) {
              const chapterExists = fetchedCourse.chapters.some(c => c.id === activeChapterId);
              if (!activeChapterId || !chapterExists) {
                setActiveChapterId(fetchedCourse.chapters[0].id);
              }
            } else if (activeChapterId) {
                setActiveChapterId(null);
            }
        }
    } catch (err) {
        console.error("Failed to fetch course data:", err);
        setError(err instanceof Error ? err.message : 'Falha ao carregar os dados do curso.');
        setCourse(null);
    } finally {
        setLoading(false);
    }
  }, [courseId, activeChapterId, setActiveChapterId]);


  useEffect(() => {
    fetchCourseData();
  }, [courseId, fetchCourseData]);

  const activeChapter = useMemo(
    () => course?.chapters?.find((c) => c.id === activeChapterId),
    [course?.chapters, activeChapterId]
  );
  
  const handleChapterSelect = (chapterId: string) => {
    setActiveChapterId(chapterId);
  };

  const handleAddChapter = (newChapter: Chapter) => {
    fetchCourseData(); // Refetch course data to include the new chapter
    setActiveChapterId(newChapter.id);
  };

  const handleUpdateChapter = () => {
    fetchCourseData(); // Just refetch the data to get the latest version
  };

  if (loading) {
    return <div className="text-center p-8">Carregando curso...</div>;
  }
  
  if (error) {
    return <div className="text-center p-8 text-destructive">{error}</div>;
  }

  if (!course) {
    return <div className="text-center p-8">Curso não encontrado.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] -m-4 sm:-m-6 lg:-m-8">
      <aside className="h-full w-full max-w-xs border-r border-border">
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