'use client';

import { useState, useMemo } from 'react';
import { getCourseById, addChapterToCourse, updateChapterContent } from '@/lib/data';
import type { Course, Chapter } from '@/lib/definitions';
import { notFound } from 'next/navigation';
import { ChapterList } from '@/components/chapters/chapter-list';
import { ChapterContent } from '@/components/chapters/chapter-content';
import { useLocalStorage } from '@/hooks/use-local-storage';

export default function CoursePage({ params }: { params: { id: string } }) {
  const initialCourse = useMemo(() => getCourseById(params.id), [params.id]);
  
  if (!initialCourse) {
    notFound();
  }
  
  // Use state to manage course data to reflect updates from AI actions
  const [course, setCourse] = useState<Course>(initialCourse);
  const [activeChapterId, setActiveChapterId] = useLocalStorage<string | null>(
    `activeChapter_${params.id}`,
    course.chapters[0]?.id ?? null
  );

  const activeChapter = useMemo(
    () => course.chapters.find((c) => c.id === activeChapterId),
    [course.chapters, activeChapterId]
  );
  
  const handleChapterSelect = (chapterId: string) => {
    setActiveChapterId(chapterId);
  };

  const handleAddChapter = (newChapter: Chapter) => {
    addChapterToCourse(course.id, newChapter); // This mutates the mock data
    const updatedCourse = getCourseById(course.id)!; // Re-fetch to get the updated data
    setCourse({ ...updatedCourse });
    setActiveChapterId(newChapter.id);
  };

  const handleUpdateChapter = (chapterId: string, newContent: string) => {
    updateChapterContent(course.id, chapterId, newContent); // Mutates mock data
    const updatedCourse = getCourseById(course.id)!;
    setCourse({ ...updatedCourse });
  };

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
