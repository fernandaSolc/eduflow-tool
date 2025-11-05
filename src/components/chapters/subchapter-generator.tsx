'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateChapterFromOutlineAction, generateSubchapterAction } from '@/lib/actions';
import type { Course, Chapter } from '@/lib/definitions';
import { Loader2, Plus, Play, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type SubchapterGeneratorProps = {
  course: Course;
  chapter?: Chapter;
  chapterNumber: number;
  onUpdate: () => void;
};

export function SubchapterGenerator({
  course,
  chapter,
  chapterNumber,
  onUpdate,
}: SubchapterGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSubchapter, setIsGeneratingSubchapter] = useState(false);
  
  // Validação: verifica se o curso tem template de subcapítulos
  const hasSubchapterTemplate = course.subchapterTemplate?.structure && 
    course.subchapterTemplate.structure.length >= 20;

  const chapterOutline = course.chapterOutlines?.find(
    outline => outline.number === chapterNumber
  );

  if (!chapterOutline) {
    return (
      <Alert>
        <AlertDescription>
          Capítulo {chapterNumber} não encontrado na ementa do curso.
        </AlertDescription>
      </Alert>
    );
  }

  // Se o capítulo não existe ainda, mostra botão para criar estrutura
  if (!chapter) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Capítulo {chapterNumber}: {chapterOutline.title}</CardTitle>
          <CardDescription>
            {chapterOutline.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Palavras esperadas:</strong> {chapterOutline.wordCount.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Este capítulo será gerado em subcapítulos incrementais. Clique em "Iniciar Capítulo" para criar a estrutura inicial.
              </p>
              {!hasSubchapterTemplate && (
                <Alert>
                  <AlertDescription>
                    ⚠️ O curso precisa ter um template de subcapítulos configurado para gerar capítulos.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <Button
              onClick={handleStartChapter}
              disabled={isGenerating || !hasSubchapterTemplate}
              size="lg"
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando Estrutura...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Iniciar Capítulo
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se o capítulo existe, mostra subcapítulos e permite gerar mais
  const subchapters = chapter.subchapters || [];
  const nextSubchapterNumber = subchapters.length + 1;
  const totalWordCount = subchapters.reduce((sum, sub) => sum + (sub.wordCount || 0), 0);
  const progressPercentage = chapterOutline.wordCount > 0 
    ? Math.min((totalWordCount / chapterOutline.wordCount) * 100, 100)
    : 0;

  const canGenerateMore = !course.subchapterTemplate?.maxSubchapters || 
    subchapters.length < course.subchapterTemplate.maxSubchapters;

  async function handleStartChapter() {
    if (isGenerating) return; // Previne múltiplos cliques
    
    if (!hasSubchapterTemplate) {
      toast({
        variant: 'destructive',
        title: 'Template Necessário',
        description: 'O curso precisa ter um template de subcapítulos configurado para gerar capítulos.',
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      const result = await generateChapterFromOutlineAction(course, chapterNumber);
      if (result.success) {
        toast({
          title: 'Capítulo Iniciado!',
          description: 'A estrutura do capítulo foi criada. Agora você pode gerar subcapítulos.',
        });
        // Pequeno atraso para garantir persistência no backend antes de refetch
        setTimeout(() => {
          onUpdate();
        }, 500);
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: result.error || 'Falha ao iniciar capítulo.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao iniciar capítulo.',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateSubchapter() {
    if (isGeneratingSubchapter || !chapter) return; // Previne múltiplos cliques e valida chapter
    
    if (!hasSubchapterTemplate) {
      toast({
        variant: 'destructive',
        title: 'Template Necessário',
        description: 'O curso precisa ter um template de subcapítulos configurado.',
      });
      return;
    }
    
    setIsGeneratingSubchapter(true);
    try {
      const result = await generateSubchapterAction(course, chapter.id, chapterNumber);
      if (result.success) {
        toast({
          title: 'Subcapítulo Gerado!',
          description: `Subcapítulo ${nextSubchapterNumber} foi gerado com sucesso.`,
        });
        // Aguarda um pouco antes de atualizar para garantir que o backend processou
        setTimeout(() => {
          onUpdate();
        }, 500);
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao Gerar Subcapítulo',
          description: result.error || 'Falha ao gerar subcapítulo.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao gerar subcapítulo.',
      });
    } finally {
      setIsGeneratingSubchapter(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Capítulo {chapterNumber}: {chapterOutline.title}</CardTitle>
        <CardDescription>
          {chapterOutline.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso do Capítulo</span>
            <span className="font-medium">
              {totalWordCount.toLocaleString()} / {chapterOutline.wordCount.toLocaleString()} palavras
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {subchapters.length} subcapítulo{subchapters.length !== 1 ? 's' : ''} gerado{subchapters.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Lista de Subcapítulos */}
        {subchapters.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Subcapítulos Gerados</h4>
            <div className="space-y-2">
              {subchapters
                .sort((a, b) => a.subchapter_number - b.subchapter_number)
                .map((subchapter) => (
                  <div
                    key={subchapter.id}
                    className="flex items-start gap-3 p-3 border rounded-lg bg-card"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {subchapter.subchapter_number}. {subchapter.title}
                      </p>
                      {subchapter.wordCount && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {subchapter.wordCount.toLocaleString()} palavras
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Botão Gerar Próximo Subcapítulo */}
        {canGenerateMore ? (
          <Button
            onClick={handleGenerateSubchapter}
            disabled={isGeneratingSubchapter || !hasSubchapterTemplate}
            size="lg"
            className="w-full"
          >
            {isGeneratingSubchapter ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando Subcapítulo {nextSubchapterNumber}...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Gerar Subcapítulo {nextSubchapterNumber}
              </>
            )}
          </Button>
        ) : (
          <Alert>
            <AlertDescription>
              Limite máximo de subcapítulos atingido ({course.subchapterTemplate?.maxSubchapters || 'N/A'}). 
              {subchapters.length > 0 && ' Você pode continuar editando o conteúdo gerado.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Alerta se não tem template */}
        {!hasSubchapterTemplate && (
          <Alert variant="destructive">
            <AlertDescription>
              ⚠️ O curso precisa ter um template de subcapítulos configurado para gerar novos subcapítulos.
            </AlertDescription>
          </Alert>
        )}

        {/* Informações do Template */}
        {course.subchapterTemplate && (
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p>
              <strong>Template:</strong> {course.subchapterTemplate.structure.substring(0, 100)}
              {course.subchapterTemplate.structure.length > 100 && '...'}
            </p>
            {course.subchapterTemplate.wordCountPerSubchapter && (
              <p>
                <strong>Palavras por subcapítulo:</strong>{' '}
                {course.subchapterTemplate.wordCountPerSubchapter.toLocaleString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

