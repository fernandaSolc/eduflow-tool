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
import { expandChapterAction, simplifyChapterAction, updateChapterContentAction, generateQuestionAction, createExampleAction } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { ImagePlaceholderDialog } from './image-placeholder-dialog';

type ChapterContentProps = {
  course: Course;
  chapter: Chapter | undefined;
  onUpdateChapter: () => void;
};

type ToolbarAction = 'edit' | 'ai-expand' | 'ai-simplify' | 'insert-image' | 'ai-question' | 'ai-example';

export function ChapterContent({ course, chapter, onUpdateChapter }: ChapterContentProps) {
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [selectionNode, setSelectionNode] = useState<Node | null>(null);
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

  // State for image placeholder dialog
  const [isImageDialogVisible, setIsImageDialogVisible] = useState(false);
  

  // Reset state when chapter changes
  useEffect(() => {
    handlePopoverClose();
    setHighlightedContent(null);
    setIsEditing(false); // Exit edit mode on chapter change
    setIsImageDialogVisible(false);
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
  
    if (selectedText && selectedText.length > 0) {
      const range = sel.getRangeAt(0);
      setSelectionNode(range.commonAncestorContainer);
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
      setSelectionNode(null);
      setHighlightedContent(null);
    }
  };

  const handleToolbarAction = (action: ToolbarAction, selectedText: string) => {
    if (action === 'insert-image') {
      setIsImageDialogVisible(true);
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
    setSelectionNode(null);
    setHighlightedContent(null);
  };
  
  const handleAiActionSubmit = async (prompt: string) => {
    if (!selection || !popoverAction || !chapter) return;

    let result;
    const cleanSelection = getCleanedHtml(selection);
    const values = { selection: cleanSelection, additionalDetails: prompt };

    try {
        let actionResponse;
        let toastTitle = 'Ação Concluída';

        switch (popoverAction) {
            case 'ai-expand':
                actionResponse = await expandChapterAction(course.id, chapter.id, values);
                toastTitle = 'Capítulo Expandido!';
                break;
            case 'ai-simplify':
                actionResponse = await simplifyChapterAction(course.id, chapter.id, values);
                toastTitle = 'Capítulo Simplificado!';
                break;
            case 'ai-question':
                actionResponse = await generateQuestionAction(course.id, chapter.id, values);
                toastTitle = 'Questão Gerada!';
                break;
            case 'ai-example':
                actionResponse = await createExampleAction(course.id, chapter.id, values);
                toastTitle = 'Exemplo Criado!';
                break;
            default:
                throw new Error('Ação de IA desconhecida.');
        }

      if (actionResponse?.success) {
        toast({
          title: toastTitle,
          description: "O conteúdo foi atualizado com a resposta da IA.",
        });
        onUpdateChapter();
      } else {
        throw new Error(actionResponse?.error || 'Uma falha desconhecida ocorreu');
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
      manualEditContent,
      false // is not a point insert
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
    const plainText = chapter.content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<ul>/gi, '')
      .replace(/<\/ul>/gi, '')
      .replace(/<ol>/gi, '')
      .replace(/<\/ol>/gi, '')
      .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<div class="image-placeholder".*?data-image-description="(.*?)".*?<\/div>/gs, '\n[IMAGEM: $1]\n')
      .replace(/<[^>]+>/g, '')
      .trim();

    setFullEditContent(plainText);
    setIsEditing(true);
  };

  const imagePlaceholderHtml = (description: string) => 
    `<div class="image-placeholder" contenteditable="false" data-image-description="${description.replace(/"/g, '&quot;')}">`+
      `<div class="placeholder-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>`+
      `<div class="placeholder-text"><strong>Imagem Sugerida:</strong><p>${description}</p></div>`+
    `</div>`;

  const handleImagePlaceholderSubmit = async (description: string) => {
    if (!chapter || !selectionNode) return;
    
    // Find the parent paragraph of the selection
    let parentElement = selectionNode.nodeType === 1 ? selectionNode as Element : selectionNode.parentElement;
    while(parentElement && parentElement.nodeName !== 'P') {
      parentElement = parentElement.parentElement;
    }

    if (!parentElement) {
      toast({
        variant: "destructive",
        title: "Erro ao Inserir Imagem",
        description: "Não foi possível encontrar um parágrafo para inserir a imagem. Tente selecionar um texto dentro de um parágrafo.",
      });
      return;
    }

    const placeholder = imagePlaceholderHtml(description);
    const newContent = chapter.content.replace(parentElement.outerHTML, parentElement.outerHTML + placeholder);

    const result = await updateChapterContentAction(
      course.id,
      chapter.id,
      chapter.content,
      newContent,
      true // full edit to replace the whole content
    );

    if (result.success) {
      toast({
        title: "Placeholder de Imagem Inserido!",
        description: "O espaço para imagem foi adicionado ao conteúdo.",
      });
      onUpdateChapter();
    } else {
      toast({
        variant: "destructive",
        title: "Erro ao Inserir",
        description: result?.error || "Não foi possível adicionar o placeholder.",
      });
    }
  }


  const handleFullEditSave = async () => {
    if (!chapter) return;
    setIsSubmittingFullEdit(true);
    
    const newHtmlContent = fullEditContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`;
        if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`;
        if (line.startsWith('- ')) return `<li>${line.substring(2)}</li>`;
        const imageMatch = line.match(/^\[IMAGEM:\s*(.*?)\]$/);
        if (imageMatch) {
          return imagePlaceholderHtml(imageMatch[1]);
        }
        return `<p>${line}</p>`;
      })
      .join('')
      .replace(/<\/li><p>/g, '</li>') // Clean up potential paragraphs after list items
      .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>') // Wrap li tags in ul
      .replace(/<\/ul><ul>/g, ''); // Merge adjacent ul tags

    const result = await updateChapterContentAction(
      course.id,
      chapter.id,
      chapter.content, 
      newHtmlContent,
      true // is full edit
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

    const config = {
        'ai-expand': { title: 'Expandir com IA', placeholder: 'Ex: Adicione mais detalhes sobre o impacto histórico...', buttonText: 'Expandir' },
        'ai-simplify': { title: 'Simplificar com IA', placeholder: 'Ex: Simplifique para um público iniciante...', buttonText: 'Simplificar' },
        'ai-question': { title: 'Gerar Questão com IA', placeholder: 'Ex: Crie uma questão de múltipla escolha...', buttonText: 'Gerar Questão' },
        'ai-example': { title: 'Criar Exemplo com IA', placeholder: 'Ex: Gere um exemplo prático sobre este conceito...', buttonText: 'Criar Exemplo' },
    };

    const { title, placeholder, buttonText } = config[popoverAction as keyof typeof config] || {};
    
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
  const finalHtml = finalContent.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

  return (
    <>
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
                  className="h-[calc(100vh-30rem)] min-h-[20rem] text-base font-mono"
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
    </Popover>

    <ImagePlaceholderDialog
      open={isImageDialogVisible}
      onOpenChange={setIsImageDialogVisible}
      onSubmit={handleImagePlaceholderSubmit}
      onClose={() => {
        setIsImageDialogVisible(false);
        handlePopoverClose();
      }}
    />
  </>
  );
}
