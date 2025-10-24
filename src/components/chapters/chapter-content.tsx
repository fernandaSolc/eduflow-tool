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
import { useToast } from '@/hooks/use-toast';
import { expandChapterAction, simplifyChapterAction, updateChapterContentAction } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

type ChapterContentProps = {
  course: Course;
  chapter: Chapter | undefined;
  onUpdateChapter: () => void;
};

type ToolbarAction = 'edit' | 'ai-expand' | 'ai-simplify';

export function ChapterContent({ course, chapter, onUpdateChapter }: ChapterContentProps) {
  const { toast } = useToast();
  const [selection, setSelection] = useState<string | null>(null);
  const [popoverAction, setPopoverAction] = useState<ToolbarAction | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [manualEditContent, setManualEditContent] = useState('');
  const [isSubmittingManualEdit, setIsSubmittingManualEdit] = useState(false);

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
    if (!selection || !popoverAction || !chapter) return;

    let result;
    const values = { selection, additionalDetails: prompt };

    try {
      if (popoverAction === 'ai-expand') {
        result = await expandChapterAction(course.id, chapter.id, values);
      } else if (popoverAction === 'ai-simplify') {
        result = await simplifyChapterAction(course.id, chapter.id, values);
      }

      if (result?.success) {
        toast({
          title: `Capítulo ${popoverAction === 'ai-expand' ? 'Expandido' : 'Simplificado'}!`,
          description: "O conteúdo foi atualizado com sucesso.",
        });
        onUpdateChapter();
      } else {
        throw new Error(result?.error || 'Uma falha desconhecida ocorreu');
      }
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Erro ao Processar Ação",
        description: error instanceof Error ? error.message : "Não foi possível completar a ação de IA.",
      });
    } finally {
      handlePopoverClose();
    }
  };

  const handleManualEditSubmit = async () => {
    if (!selection || !chapter) return;
    setIsSubmittingManualEdit(true);

    const result = await updateChapterContentAction(
      course.id,
      chapter.id,
      selection,
      manualEditContent
    );

    setIsSubmittingManualEdit(false);

    if (result?.success) {
      toast({
        title: "Conteúdo Atualizado",
        description: "Sua edição foi salva com sucesso.",
      });
      onUpdateChapter();
    } else {
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: result?.error || "Não foi possível salvar a sua alteração.",
      });
    }

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
                    disabled={isSubmittingManualEdit}
                />
                 <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={handlePopoverClose} disabled={isSubmittingManualEdit}>Cancelar</Button>
                    <Button onClick={handleManualEditSubmit} disabled={isSubmittingManualEdit}>
                      {isSubmittingManualEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar Alterações
                    </Button>
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
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
                    <EditorToolbar selection={selection} onAction={handleToolbarAction} />
                </div>
             </PopoverTrigger>
        )}
        </ScrollArea>
        <PopoverContent className="w-96 p-0" side="top" align="center" sideOffset={10} onInteractOutside={handlePopoverClose}>
            <PopoverContentComponent />
        </PopoverContent>
    </Popover>
  );
}
