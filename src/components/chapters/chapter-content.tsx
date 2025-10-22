'use client';

import type { Course, Chapter } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookText, Sparkles, StretchHorizontal, Wand2, Bot } from 'lucide-react';
import { ExpandChapterForm } from './expand-chapter-form';
import { EnrichChapterForm } from './enrich-chapter-form';
import { useState } from 'react';
import { EditorToolbar } from './editor-toolbar';

type ChapterContentProps = {
  course: Course;
  chapter: Chapter | undefined;
  onUpdateChapter: () => void;
};

export function ChapterContent({ course, chapter, onUpdateChapter }: ChapterContentProps) {
  const [selection, setSelection] = useState<string | null>(null);

  const handleMouseUp = () => {
    const selectedText = window.getSelection()?.toString().trim();
    if (selectedText && selectedText.length > 10) {
      setSelection(selectedText);
    } else {
      setSelection(null);
    }
  };
  
  if (!chapter) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-background">
        <BookText className="h-16 w-16 text-muted-foreground/50" />
        <h2 className="mt-6 font-headline text-2xl font-semibold">
          Bem-vindo a {course.title}
        </h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          Selecione um capítulo à esquerda para começar a ler ou crie um novo para dar vida ao seu curso.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full bg-background" onMouseUp={handleMouseUp}>
      <div className="p-4 sm:p-6 lg:p-12 prose prose-lg dark:prose-invert max-w-4xl mx-auto prose-headings:font-headline prose-code:font-code prose-code:bg-muted prose-code:p-1 prose-code:rounded">
        <header className="not-prose mb-12">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {chapter.title}
          </h1>
        </header>

        <div dangerouslySetInnerHTML={{ __html: chapter.content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>').replace(/\n/g, '<br />') }} />
        
      </div>
       {selection && <EditorToolbar selection={selection} onAction={() => setSelection(null)} />}
    </ScrollArea>
  );
}
