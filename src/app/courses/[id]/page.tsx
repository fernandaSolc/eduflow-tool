'use client';

import { useState, useMemo, useEffect, useCallback, useRef, use } from 'react';
import { getCourseById } from '@/lib/data';
import type { Course, Chapter } from '@/lib/definitions';
import { notFound } from 'next/navigation';
import { ChapterList } from '@/components/chapters/chapter-list';
import { ChapterContent } from '@/components/chapters/chapter-content';
import { SubchapterGenerator } from '@/components/chapters/subchapter-generator';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExportButtons } from '@/components/export/export-buttons';

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  // Desempacota params usando React.use() (Next.js 15)
  const { id: courseId } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const silentFetchDebounceRef = useRef<number | null>(null);
  const lastFetchAtRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [activeChapterId, setActiveChapterId] = useLocalStorage<string | null>(
    `activeChapter_${courseId}`,
    null
  );

  const fetchCourseData = useCallback(async (showLoading = true) => {
    if (!courseId) return;
    // Previene reentrância/concorrência
    if (isFetchingRef.current) return;
    // Throttle: no mínimo 1500ms entre fetches
    const now = Date.now();
    if (now - lastFetchAtRef.current < 1500) return;
    lastFetchAtRef.current = now;

    // Cancela requisição anterior se ainda ativa
    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch {}
    }
    abortControllerRef.current = new AbortController();
    isFetchingRef.current = true;
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
        const fetchedCourse = await getCourseById(courseId);
        if (!fetchedCourse) {
            notFound();
        } else {
            setCourse(fetchedCourse);
             // Auto-select first chapter if no chapter is active or the active one is not in the list
            if (fetchedCourse.chapters && fetchedCourse.chapters.length > 0) {
              const currentActiveChapter = window.localStorage.getItem(`activeChapter_${courseId}`);
              const activeChapterExists = fetchedCourse.chapters.some(c => {
                try {
                  const storedId = JSON.parse(currentActiveChapter || 'null');
                  return c.id === storedId;
                } catch {
                  return false;
                }
              });
              
              if (!currentActiveChapter || !activeChapterExists) {
                const firstId = fetchedCourse.chapters[0].id;
                // Evita setar o mesmo valor e disparar re-render desnecessário
                if (firstId !== activeChapterId) {
                  setActiveChapterId(firstId);
                }
              }
            } else {
                // Se não há capítulos, limpa o activeChapterId apenas se estava setado
                const currentActive = window.localStorage.getItem(`activeChapter_${courseId}`);
                if (currentActive) {
                  setActiveChapterId(null);
                }
            }
        }
    } catch (err) {
        console.error("Failed to fetch course data:", err);
        setError(err instanceof Error ? err.message : 'Falha ao carregar os dados do curso.');
        setCourse(null);
    } finally {
        if (showLoading) {
          setLoading(false);
        }
        isFetchingRef.current = false;
    }
  // Somente courseId como dependência para evitar re-criação desnecessária
  }, [courseId, activeChapterId, setActiveChapterId]);


  useEffect(() => {
    fetchCourseData();
    return () => {
      if (silentFetchDebounceRef.current) {
        window.clearTimeout(silentFetchDebounceRef.current);
      }
      if (abortControllerRef.current) {
        try { abortControllerRef.current.abort(); } catch {}
      }
    };
  }, [courseId]);

  const activeChapter = useMemo(
    () => course?.chapters?.find((c) => c.id === activeChapterId),
    [course?.chapters, activeChapterId]
  );

  // Encontra o número do capítulo baseado na ementa
  const activeChapterNumber = useMemo(() => {
    if (!activeChapter || !course?.chapterOutlines) return null;
    return course.chapterOutlines.findIndex(
      outline => outline.title === activeChapter.title
    ) + 1;
  }, [activeChapter, course?.chapterOutlines]);
  
  const handleChapterSelect = (chapterId: string) => {
    setActiveChapterId(chapterId);
  };

  const handleAddChapter = (newChapter: Chapter) => {
    fetchCourseData(true); // Refetch course data to include the new chapter
    setActiveChapterId(newChapter.id);
  };

  const handleUpdateChapter = () => {
    // Debounce para evitar rajadas de requests
    if (silentFetchDebounceRef.current) {
      window.clearTimeout(silentFetchDebounceRef.current);
    }
    silentFetchDebounceRef.current = window.setTimeout(() => {
      // Evita refetch se um fetch acabou de ocorrer
      const now = Date.now();
      if (now - lastFetchAtRef.current < 1500 || isFetchingRef.current) return;
      fetchCourseData(false); // Refetch silencioso
    }, 500);
  };

  if (loading) {
    return <div className="text-center p-8">Carregando curso...</div>;
  }
  
  if (error) {
    return <div className="text-center p-8 text-destructive">{error}</div>;
  }

  if (!course) {
    return <div className="text-center p-8">Curso não encontrado.</div>;
  }

  // Se o curso tem ementa estruturada, mostra modo de geração incremental
  const hasStructuredOutline = course.chapterOutlines && course.chapterOutlines.length > 0;

  return (
    <div className="flex h-[calc(100vh-8.5rem)] -m-4 sm:-m-6 lg:-m-8">
      <aside className="h-full w-full max-w-xs border-r border-border">
        <ChapterList
          course={course}
          activeChapterId={activeChapterId}
          onChapterSelect={handleChapterSelect}
          onAddChapter={handleAddChapter}
        />
      </aside>
      <main className="h-full flex-1 overflow-y-auto">
        <div className="p-4 flex justify-end"><ExportButtons course={course} /></div>
        {hasStructuredOutline ? (
          <Tabs defaultValue="generate" className="h-full">
            <TabsList className="mx-4 mt-4">
              <TabsTrigger value="generate">Gerar Subcapítulos</TabsTrigger>
              <TabsTrigger value="view">Visualizar Conteúdo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="generate" className="p-4 space-y-4">
              {course.chapterOutlines?.map((outline) => {
                // Busca o capítulo correspondente - prioriza número, depois título
                const chapter = course.chapters?.find(ch => {
                  // Primeiro tenta por número (mais confiável)
                  if (ch.chapter_number === outline.number) return true;
                  // Se não encontrou, tenta por título (fallback)
                  if (ch.title === outline.title) return true;
                  return false;
                });
                return (
                  <SubchapterGenerator
                    key={`${outline.number}-${outline.title}`}
                    course={course}
                    chapter={chapter}
                    chapterNumber={outline.number}
                    onUpdate={handleUpdateChapter}
                  />
                );
              })}
            </TabsContent>

            <TabsContent value="view" className="h-full">
              <ChapterContent 
                key={activeChapter?.id}
                course={course}
                chapter={activeChapter} 
                onUpdateChapter={handleUpdateChapter}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <ChapterContent 
            key={activeChapter?.id}
            course={course}
            chapter={activeChapter} 
            onUpdateChapter={handleUpdateChapter}
          />
        )}
      </main>
    </div>
  );
}
