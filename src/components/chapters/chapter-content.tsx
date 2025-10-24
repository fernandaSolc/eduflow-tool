'use client';

import type { Course, Chapter } from '@/lib/definitions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookText, Pencil } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { EditorToolbar } from './editor-toolbar';
import { AiActionForm } from './ai-action-form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { expandChapterAction, simplifyChapterAction, updateChapterContentAction } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { ImagePlaceholderDialog } from './image-placeholder-dialog';

type ChapterContentProps = {
  course: Course;
  chapter: Chapter | undefined;
  onUpdateChapter: () => void;
};

type ToolbarAction = 'edit' | 'ai-expand' | 'ai-simplify' | 'add-image';

export function ChapterContent({ course, chapter, onUpdateChapter }: ChapterContentProps) {
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [highlightedContent, setHighlightedContent] = useState<string | null>(null);
  const [popoverAction, setPopoverAction] = useState<ToolbarAction | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  // State for full edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [fullEditContent, setFullEditContent] = useState('');
  const [isSubmittingFullEdit, setIsSubmittingFullEdit] = useState(false);

  // State for snippet edit mode
  const [manualEditContent, setManualEditContent] = useState('');
  const [isSubmittingManualEdit, setIsSubmittingManualEdit] = useState(false);
  
  // State for image placeholder
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  // Reset state when chapter changes
  useEffect(() => {
    handlePopoverClose();
    setHighlightedContent(null);
    setIsEditing(false); // Exit edit mode on chapter change
  }, [chapter?.id]);


  const getCleanedHtml = (html: string) => {
    return html
      .replace(/<mark>/g, '')
      .replace(/<\/mark>/g, '');
  }
  
  const handleMouseUp = () => {
    if (isPopoverOpen || isEditing || !contentRef.current) return;
  
    const sel = window.getSelection();
    const selectedText = sel?.toString().trim();
  
    if (selectedText && selectedText.length > 10) {
      const range = sel.getRangeAt(0);
      const clonedRange = range.cloneRange();
      const tempDiv = document.createElement("div");
      tempDiv.appendChild(clonedRange.cloneContents());
      
      if(chapter) {
         const originalContent = getCleanedHtml(chapter.content);
         const highlighted = originalContent.replace(selectedText, `<mark>${selectedText}</mark>`);
         setHighlightedContent(highlighted);
         setSelection(selectedText);
      }
    } else {
      setSelection(null);
      setHighlightedContent(null);
    }
  };

  const handleToolbarAction = (action: ToolbarAction, selectedText: string) => {
    if (action === 'add-image') {
      setIsImageDialogOpen(true);
      return;
    }
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

  const handleEnterEditMode = () => {
    if (!chapter) return;
    // Convert HTML to plain text for Textarea
    const plainText = chapter.content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p>/gi, '')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<h2>/gi, '## ')
      .replace(/<\/h2>/gi, '\n')
      .replace(/<h3>/gi, '### ')
      .replace(/<\/h3>/gi, '\n')
      .replace(/<li>/gi, '- ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<div class="image-placeholder".*?data-image-description="(.*?)".*?>.*?<\/div>/gs, '[IMAGEM: $1]')
      .replace(/<[^>]+>/g, ''); // Strip remaining tags
    setFullEditContent(plainText.trim());
    setIsEditing(true);
  };

  const handleFullEditSave = async () => {
    if (!chapter) return;
    setIsSubmittingFullEdit(true);

    const imagePlaceholderHtml = (description: string) => 
      `<div class="image-placeholder" contenteditable="false">
         <div class="placeholder-icon">🖼️</div>
         <div class="placeholder-text">
           <strong>Imagem Sugerida:</strong>
           <p>${description}</p>
         </div>
       </div>`;

    const newHtmlContent = fullEditContent
      .replace(/## (.*)/g, '<h2>$1</h2>')
      .replace(/### (.*)/g, '<h3>$1</h3>')
      .replace(/\[IMAGEM: (.*?)\]/g, (match, description) => imagePlaceholderHtml(description))
      .split('\n')
      .map(line => line.trim() ? `<p>${line}</p>` : '<br />')
      .join('');
      
    const result = await updateChapterContentAction(
      course.id,
      chapter.id,
      chapter.content,
      newHtmlContent
    );

    setIsSubmittingFullEdit(false);

    if (result.success) {
      toast({
        title: "Capítulo Salvo!",
        description: "O conteúdo foi atualizado com sucesso.",
      });
      onUpdateChapter();
      setIsEditing(false);
    } else {
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: result?.error || "Não foi possível salvar o capítulo.",
      });
    }
  };
  
  const handleImagePlaceholderInsert = async (description: string) => {
    if (!chapter || !selection) return;

    const placeholderHtml = `
      <div class="image-placeholder" contenteditable="false" data-image-description="${description}">
        <div class="placeholder-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        </div>
        <div class="placeholder-text">
          <strong>Imagem Sugerida:</strong>
          <p>${description}</p>
        </div>
      </div>
    `;

    const newContent = chapter.content.replace(selection, `${selection}${placeholderHtml}`);
    
    const result = await updateChapterContentAction(
      course.id,
      chapter.id,
      chapter.content,
      newContent
    );

    if (result.success) {
      toast({
        title: "Espaço para Imagem Adicionado",
        description: "A sugestão de imagem foi inserida no conteúdo.",
      });
      onUpdateChapter();
    } else {
       toast({
        variant: "destructive",
        title: "Erro ao Inserir Imagem",
        description: result?.error || "Não foi possível adicionar o espaço para imagem.",
      });
    }
    handlePopoverClose();
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
        <ScrollArea className="h-full bg-background">
        <div ref={contentRef} className="p-4 sm:p-6 lg:p-12 prose prose-lg dark:prose-invert max-w-4xl mx-auto prose-headings:font-headline prose-code:font-code prose-code:bg-muted prose-code:p-1 prose-code:rounded">
            <header className="not-prose mb-12 flex justify-between items-start">
              <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl mb-0">
                    {chapter.title}
                </h1>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={handleEnterEditMode}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              )}
            </header>

            {isEditing ? (
              <div className="not-prose space-y-4">
                <Textarea 
                  value={fullEditContent}
                  onChange={(e) => setFullEditContent(e.target.value)}
                  className="h-[calc(100vh-30rem)] min-h-[20rem] text-base"
                  disabled={isSubmittingFullEdit}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSubmittingFullEdit}>Cancelar</Button>
                  <Button onClick={handleFullEditSave} disabled={isSubmittingFullEdit}>
                    {isSubmittingFullEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            ) : (
              <div onMouseUp={handleMouseUp}>
                <div dangerouslySetInnerHTML={{ __html: finalHtml }} />
              </div>
            )}
            
        </div>
        {selection && !isPopoverOpen && !isEditing && (
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
        <ImagePlaceholderDialog
          open={isImageDialogOpen}
          onOpenChange={setIsImageDialogOpen}
          onSubmit={handleImagePlaceholderInsert}
          onClose={() => setIsImageDialogOpen(false)}
        />
    </Popover>
  );
}
