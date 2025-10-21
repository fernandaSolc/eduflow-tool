'use client';

import type { Course, Chapter } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NewChapterForm } from './new-chapter-form';
import { useState } from 'react';

type ChapterListProps = {
  course: Course;
  activeChapterId: string | null;
  onChapterSelect: (chapterId: string) => void;
  onAddChapter: (newChapter: Chapter) => void;
};

export function ChapterList({
  course,
  activeChapterId,
  onChapterSelect,
  onAddChapter,
}: ChapterListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-headline text-lg font-semibold">{course.title}</h2>
        <NewChapterForm
          courseId={course.id}
          onChapterCreated={onAddChapter}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        >
          <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="h-5 w-5 text-primary" />
            <span className="sr-only">Add New Chapter</span>
          </Button>
        </NewChapterForm>
      </header>
      <ScrollArea className="flex-1">
        <nav className="p-2">
          {course.chapters.length > 0 ? (
            <ul className="space-y-1">
              {course.chapters.map((chapter) => (
                <li key={chapter.id}>
                  <button
                    onClick={() => onChapterSelect(chapter.id)}
                    className={cn(
                      'w-full rounded-md p-2 text-left text-sm transition-colors',
                      chapter.id === activeChapterId
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {chapter.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No chapters yet.
            </div>
          )}
        </nav>
      </ScrollArea>
    </div>
  );
}
