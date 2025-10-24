'use client';

import type { Course, Chapter } from '@/lib/definitions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookText } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [highlightedContent, setHighlightedContent] = useState<string | null>(null);
  const [popoverAction, setPopoverAction] = useState<ToolbarAction | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [manualEditContent, setManualEditContent] = useState('');
  const [isSubmittingManualEdit, setIsSubmittingManualEdit] = useState(false);

  // Reset state when chapter changes
  useEffect(() => {
    handlePopoverClose(); // Close any open popovers
    setHighlightedContent(null); // Clear highlights
  }, [chapter?.id]);


  const getCleanedHtml = (html: string) => {
    return html
      .replace(/<mark>/g, '')
      .replace(/<\/mark>/g, '');
  }
  
  const handleMouseUp = () => {
    if (isPopoverOpen || !contentRef.current) return;
  
    const sel = window.getSelection();
    const selectedText = sel?.toString().trim();
  
    if (selectedText && selectedText.length > 10) {
      const range = sel.getRangeAt(0);
      const clonedRange = range.cloneRange();
      const tempDiv = document.createElement("div");
      tempDiv.appendChild(clonedRange.cloneContents());
      const selectedHtml = tempDiv.innerHTML;

      if(chapter) {
         // Create a regex that is more robust to HTML tags inside the selection
         const pattern = selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').split(/\s+/).join('\\s+(<[^>]+>\\s*)*');
         const regex = new RegExp(pattern, 'i');
         const originalContent = getCleanedHtml(chapter.content);
         const match = originalContent.match(regex);
         
         if (match) {
            const highlighted = originalContent.replace(match[0], `<mark>${match[0]}</mark>`);
            setHighlightedContent(highlighted);
            setSelection(match[0]); // Store the exact matched HTML
         } else {
             // Fallback for plain text
            const highlighted = originalContent.replace(selectedText, `<mark>${selectedText}</mark>`);
            setHighlightedContent(highlighted);
            setSelection(selectedText);
         }
      }
    } else {
      setSelection(null);
      setHighlightedContent(null);
    }
  };

  const handleToolbarAction = (action: ToolbarAction, selectedText: string) => {
    setPopoverAction(action);
    setIsPopoverOpen(true);
    if(action === 'edit') {
      setManualEditContent(getCleanedHtml(selectedText));
    }
  };

  const handlePopoverClose = () => {
    setIsPopoverOpen(false);
    setPopoverAction(null);
    setSelection(null);
    setHighlightedContent(null);
  };
  
  const handleAiActionSubmit = async (prompt: string) => {
    if (!selection || !popoverAction || !chapter) return;

    let result;
    const cleanSelection = getCleanedHtml(selection);
    const values = { selection: cleanSelection, additionalDetails: prompt };

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
    const cleanSelection = getCleanedHtml(selection);

    const result = await updateChapterContentAction(
      course.id,
      chapter.id,
      cleanSelection,
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
            selection={getCleanedHtml(selection)}
            placeholder={placeholder}
            buttonText={buttonText}
            onSubmit={handleAiActionSubmit}
            onClose={handlePopoverClose}
        />
    )
  }

  const finalContent = highlightedContent || chapter.content.replace(/<mark>|<\/mark>/g, '');
  const finalHtml = finalContent.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>').replace(/\n/g, '<br />');

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <ScrollArea className="h-full bg-background" onMouseUp={handleMouseUp}>
        <div ref={contentRef} className="p-4 sm:p-6 lg:p-12 prose prose-lg dark:prose-invert max-w-4xl mx-auto prose-headings:font-headline prose-code:font-code prose-code:bg-muted prose-code:p-1 prose-code:rounded">
            <header className="not-prose mb-12">
            <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {chapter.title}
            </h1>
            </header>

            <div dangerouslySetInnerHTML={{ __html: finalHtml }} />
            
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
