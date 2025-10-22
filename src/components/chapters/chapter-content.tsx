'use client';

import type { Course, Chapter } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '../ui/button';
import { Sparkles, StretchHorizontal, Wand2 } from 'lucide-react';
import { ExpandChapterForm } from './expand-chapter-form';
import { EnrichChapterForm } from './enrich-chapter-form';

type ChapterContentProps = {
  course: Course;
  chapter: Chapter | undefined;
  onUpdateChapter: (chapterId: string, newContent: string) => void;
};

export function ChapterContent({ course, chapter, onUpdateChapter }: ChapterContentProps) {
  if (!chapter) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <Sparkles className="h-16 w-16 text-primary" />
        <h2 className="mt-6 font-headline text-2xl font-semibold">
          Bem-vindo a {course.title}
        </h2>
        <p className="mt-2 text-muted-foreground">
          Selecione um capítulo à esquerda para começar a visualizar ou crie um novo capítulo para começar.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 sm:p-6 lg:p-8">
        <header>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {chapter.title}
          </h1>
        </header>

        <div className="prose prose-sm dark:prose-invert mt-8 max-w-none prose-headings:font-headline prose-code:font-code prose-code:bg-muted prose-code:p-1 prose-code:rounded">
            <div dangerouslySetInnerHTML={{ __html: chapter.content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>').replace(/\n/g, '<br />') }} />
        </div>

        <div className="mt-12 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <div className="rounded-full border border-border bg-background p-2">
                    <StretchHorizontal className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <CardTitle className="font-headline text-lg">Expandir Conteúdo</CardTitle>
                    <CardDescription>Gere conteúdo adicional para este capítulo.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <ExpandChapterForm chapter={chapter} courseId={course.id} onUpdateChapter={onUpdateChapter} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <div className="rounded-full border border-border bg-background p-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <CardTitle className="font-headline text-lg">Enriquecer Conteúdo</CardTitle>
                    <CardDescription>Use IA para enriquecer inteligentemente este capítulo.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <EnrichChapterForm chapter={chapter} courseId={course.id} onUpdateChapter={onUpdateChapter} />
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}
