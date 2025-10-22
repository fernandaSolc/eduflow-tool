'use client';

import type { Course, Chapter } from '@/lib/definitions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookText } from 'lucide-react';
import { useState, useMemo } from 'react';
import { EditorToolbar } from './editor-toolbar';
import { AiActionForm } from './ai-action-form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type ChapterContentProps = {
  course: Course;
  chapter: Chapter | undefined;
  onUpdateChapter: () => void;
};

type ToolbarAction = 'edit' | 'ai-expand' | 'ai-simplify';

export function ChapterContent({ course, chapter, onUpdateChapter }: ChapterContentProps) {
  const [selection, setSelection] = useState<string | null>(null);
  const [popoverAction, setPopoverAction] = useState<ToolbarAction | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [manualEditContent, setManualEditContent] = useState('');

  const chapterKey = useMemo(() => chapter?.id, [chapter]);

  const handleMouseUp = () => {
    if (isPopoverOpen) return;

    const selectedText = window.getSelection()?.toString().trim();
    if (selectedText && selectedText.length > 10) {
      setSelection(selectedText);
    } else {
      setSelection(null);
    }
  };

  const handleToolbarAction = (action: ToolbarAction, selectedText: string) => {
    setSelection(selectedText);
    setPopoverAction(action);
    setIsPopoverOpen(true);
    if(action === 'edit') {
      setManualEditContent(selectedText);
    }
  };

  const handlePopoverClose = () => {
    setIsPopoverOpen(false);
    setPopoverAction(null);
    setSelection(null);
  };
  
  const handleAiActionSubmit = async (prompt: string) => {
    console.log(`AI Action: ${popoverAction}, Prompt: ${prompt}, Selection: ${selection}`);
    // Here you would call your AI service and then onUpdateChapter
    // For now, we'll just close the popover
    handlePopoverClose();
  };

  const handleManualEditSubmit = async () => {
    console.log(`Manual Edit:`, manualEditContent);
    // Here you would find and replace the text in the chapter content and save it.
    // For now, we'll just close the popover
    handlePopoverClose();
  }


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
  
  const PopoverContentComponent = () => {
    if (!popoverAction || !selection) return null;
    
    if (popoverAction === 'edit') {
        return (
            <div className="space-y-4 p-4">
                <h4 className="font-medium leading-none">Editar Trecho</h4>
                <Textarea 
                    value={manualEditContent}
                    onChange={(e) => setManualEditContent(e.target.value)}
                    className="h-48"
                />
                 <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={handlePopoverClose}>Cancelar</Button>
                    <Button onClick={handleManualEditSubmit}>Salvar Alterações</Button>
                </div>
            </div>
        );
    }

    const isExpand = popoverAction === 'ai-expand';
    const title = isExpand ? 'Expandir com IA' : 'Simplificar com IA';
    const placeholder = isExpand 
      ? 'Ex: Adicione mais detalhes sobre o impacto histórico...' 
      : 'Ex: Simplifique para um público iniciante...';
    const buttonText = isExpand ? 'Expandir' : 'Simplificar';
    
    return (
        <AiActionForm
            title={title}
            selection={selection}
            placeholder={placeholder}
            buttonText={buttonText}
            onSubmit={handleAiActionSubmit}
            onClose={handlePopoverClose}
        />
    )
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <ScrollArea className="h-full bg-background" onMouseUp={handleMouseUp} key={chapterKey}>
        <div className="p-4 sm:p-6 lg:p-12 prose prose-lg dark:prose-invert max-w-4xl mx-auto prose-headings:font-headline prose-code:font-code prose-code:bg-muted prose-code:p-1 prose-code:rounded">
            <header className="not-prose mb-12">
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {chapter.title}
            </h1>
            </header>

            <div dangerouslySetInnerHTML={{ __html: chapter.content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>').replace(/\n/g, '<br />') }} />
            
        </div>
        {selection && !isPopoverOpen && (
             <PopoverTrigger asChild>
                <EditorToolbar selection={selection} onAction={handleToolbarAction} />
             </PopoverTrigger>
        )}
        </ScrollArea>
        <PopoverContent className="w-96 p-0" side="top" align="center" sideOffset={10} onInteractOutside={handlePopoverClose}>
            <PopoverContentComponent />
        </PopoverContent>
    </Popover>
  );
}
