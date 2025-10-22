'use client';

import { useState, useMemo, useEffect } from 'react';
import { getCourseById, addChapterToCourse, updateChapterContent } from '@/lib/data';
import type { Course, Chapter } from '@/lib/definitions';
import { notFound } from 'next/navigation';
import { ChapterList } from '@/components/chapters/chapter-list';
import { ChapterContent } from '@/components/chapters/chapter-content';
import { useLocalStorage } from '@/hooks/use-local-storage';

export default function CoursePage({ params }: { params: { id: string } }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourse() {
      setLoading(true);
      const fetchedCourse = await getCourseById(params.id);
      if (!fetchedCourse) {
        notFound();
      } else {
        setCourse(fetchedCourse);
      }
      setLoading(false);
    }
    loadCourse();
  }, [params.id]);
  
  const [activeChapterId, setActiveChapterId] = useLocalStorage<string | null>(
    `activeChapter_${params.id}`,
    null
  );

  useEffect(() => {
    if (course && course.chapters && course.chapters.length > 0 && !activeChapterId) {
      setActiveChapterId(course.chapters[0].id);
    }
  }, [course, activeChapterId, setActiveChapterId]);


  const activeChapter = useMemo(
    () => course?.chapters?.find((c) => c.id === activeChapterId),
    [course?.chapters, activeChapterId]
  );
  
  const handleChapterSelect = (chapterId: string) => {
    setActiveChapterId(chapterId);
  };

  const handleAddChapter = async (newChapter: Chapter) => {
    if (!course) return;
    await addChapterToCourse(course.id, newChapter);
    const updatedCourse = await getCourseById(course.id);
    if(updatedCourse) {
      setCourse({ ...updatedCourse });
    }
    setActiveChapterId(newChapter.id);
  };

  const handleUpdateChapter = async (chapterId: string, newContent: string) => {
    if (!course) return;
    await updateChapterContent(course.id, chapterId, newContent); 
    const updatedCourse = await getCourseById(course.id);
    if(updatedCourse) {
      setCourse({ ...updatedCourse });
    }
  };

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
