'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createCourseAction } from '@/lib/actions';
import { useState } from 'react';
import { Loader2, Sparkles, Plus, Trash2, BookOpen, FileText, BookMarked, Library } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Schema de validação
const chapterOutlineSchema = z.object({
  number: z.number().min(1),
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres.' }),
  description: z.string().min(50, { message: 'A descrição deve ter pelo menos 50 caracteres.' }),
  wordCount: z.number().min(100, { message: 'O número de palavras deve ser pelo menos 100.' }),
  order: z.number().min(1).optional(), // Campo order é opcional no form, mas será garantido antes de enviar
});

const bibliographyItemSchema = z.object({
  id: z.string(),
  title: z.string().min(3, { message: 'O título é obrigatório.' }),
  author: z.string().optional(),
  year: z.string().optional(),
  url: z.string().url({ message: 'URL inválida.' }).optional().or(z.literal('')),
});

const formSchema = z.object({
  title: z.string().min(5, { message: 'O título deve ter pelo menos 5 caracteres.' }),
  chapterOutlines: z.array(chapterOutlineSchema).min(1, { message: 'Adicione pelo menos um capítulo na ementa.' }),
  subject: z.string().min(3, { message: 'A disciplina é obrigatória.' }),
  educationalLevel: z.string().optional(),
  targetAudience: z.string().optional(),
  subchapterTemplate: z.object({
    structure: z.string().min(20, { message: 'Descreva como devem ser os subcapítulos (mínimo 20 caracteres).' }),
    minSubchapters: z.number().min(1).optional(),
    maxSubchapters: z.number().min(1).optional(),
    wordCountPerSubchapter: z.number().min(50).optional(),
  }),
  philosophy: z.string().min(10, { message: 'A filosofia deve ter pelo menos 10 caracteres.' }),
  bibliography: z.array(bibliographyItemSchema).optional(),
});

export default function NewCoursePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      chapterOutlines: [],
      subject: 'empreendedorismo',
      educationalLevel: 'ensino médio',
      targetAudience: 'estudantes do ensino médio',
      philosophy: 'Educação inclusiva e acessível para todos os estudantes',
      bibliography: [],
      subchapterTemplate: {
        structure: 'Os subcapítulos devem ser estruturados, didáticos e progressivos. Cada subcapítulo deve construir sobre o anterior, apresentando conceitos de forma clara e prática, com exemplos relevantes e exercícios práticos quando apropriado.',
        minSubchapters: 3,
        maxSubchapters: 8,
        wordCountPerSubchapter: 500,
      },
    },
  });

  const { fields: chapterFields, append: appendChapter, remove: removeChapter } = useFieldArray({
    control: form.control,
    name: 'chapterOutlines',
  });

  const { fields: bibliographyFields, append: appendBibliography, remove: removeBibliography } = useFieldArray({
    control: form.control,
    name: 'bibliography',
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Validações antes de submeter
    if (values.chapterOutlines.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Ementa Incompleta',
        description: 'Adicione pelo menos um capítulo na ementa.',
      });
      form.setFocus('chapterOutlines');
      return;
    }

    // Valida números duplicados
    const chapterNumbers = values.chapterOutlines.map(outline => outline.number);
    const duplicates = chapterNumbers.filter((num, index) => chapterNumbers.indexOf(num) !== index);
    if (duplicates.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Números Duplicados',
        description: `Os capítulos não podem ter números duplicados. Encontrados: ${[...new Set(duplicates)].join(', ')}`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Ordena capítulos por número, remove duplicatas e reordena sequencialmente
      const sortedOutlines = [...values.chapterOutlines]
        .filter(outline => outline && outline.number && outline.title) // Remove inválidos
        .sort((a, b) => a.number - b.number)
        // Remove duplicatas mantendo o primeiro de cada número
        .filter((outline, index, self) =>
          index === self.findIndex(o => o.number === outline.number)
        )
        // Reordena os números sequencialmente para garantir unicidade
        .map((outline, index) => ({
          ...outline,
          number: index + 1, // Garante números sequenciais únicos
          order: index + 1, // Garante que order existe e é >= 1
        }));

      // Gera descrição da ementa a partir dos capítulos
      // Garante que tenha pelo menos 50 caracteres adicionando descrições dos capítulos
      const description = sortedOutlines
        .map(outline => `${outline.number}. ${outline.title}${outline.description ? ` - ${outline.description.substring(0, 100)}` : ''}`)
        .join('\n');

      // Garante que a descrição tenha pelo menos 50 caracteres
      const finalDescription = description.length >= 50
        ? description
        : description + '\n\n' + sortedOutlines.map(o => o.description || '').join(' ').substring(0, 100);

      // Usa a estrutura do template de subcapítulos como template do curso
      const template = values.subchapterTemplate.structure;

      const result = await createCourseAction({
        ...values,
        description: finalDescription, // Descrição gerada da ementa (garantindo mínimo de 50 caracteres)
        template, // Template unificado (vem do subchapterTemplate.structure)
        chapterOutlines: sortedOutlines,
      });

      if (result.success && result.data) {
        toast({
          title: 'Curso Criado com Sucesso!',
          description: `O curso "${result.data.title}" foi criado e a introdução está sendo gerada.`,
        });
        router.push(`/courses/${result.data.id}`);
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao Criar Curso',
          description: result.error || 'Falha desconhecida ao criar curso.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Criar Curso',
        description: error instanceof Error ? error.message : 'Falha ao criar curso.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const addChapterOutline = () => {
    const nextNumber = chapterFields.length + 1;
    const newChapterIndex = chapterFields.length; // Índice do novo capítulo que será adicionado

    appendChapter({
      number: nextNumber,
      title: '',
      description: '',
      wordCount: 1000,
      order: nextNumber, // Campo order é obrigatório para o AI Service
    });

    // Scroll suave para o novo capítulo após um pequeno delay para garantir renderização
    setTimeout(() => {
      const chapterElement = document.querySelector(`[data-chapter-index="${newChapterIndex}"]`);
      if (chapterElement) {
        chapterElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Foca no campo de título do novo capítulo
        const titleInput = chapterElement.querySelector('input[placeholder*="Introdução"]') as HTMLInputElement;
        if (titleInput) {
          setTimeout(() => titleInput.focus(), 300);
        }
      }
    }, 150);
  };

  const addBibliographyItem = () => {
    appendBibliography({
      id: `bib-${Date.now()}`,
      title: '',
      author: '',
      year: '',
      url: '',
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Criar Novo Curso</CardTitle>
          <CardDescription>
            Preencha todos os campos abaixo. O AI Service gerará automaticamente a <strong>introdução completa</strong> do curso após a criação.
            Todos os conteúdos (introdução, capítulos e subcapítulos) são gerados pelo serviço de IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* SEÇÃO 1: Informações Básicas do Curso */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Informações Básicas</h3>
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do Curso *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Empreendedorismo no Maranhão" {...field} />
                      </FormControl>
                      <FormDescription>O título principal do seu curso.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disciplina *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Empreendedorismo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="educationalLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nível Educacional</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Ensino Médio" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Público-Alvo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Estudantes do ensino médio" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="philosophy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filosofia Educacional *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva a abordagem pedagógica do curso."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Esta filosofia será usada pela IA para guiar a geração de conteúdo.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* SEÇÃO 2: Estrutura dos Capítulos (Ementa) */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <BookMarked className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Estrutura dos Capítulos (Ementa) *</h3>
                </div>

                <p className="text-sm text-muted-foreground">
                  Adicione os capítulos que compõem o curso. Cada capítulo será gerado em subcapítulos incrementais pela IA.
                </p>

                {chapterFields.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-lg">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Nenhum capítulo adicionado ainda.</p>
                    <Button type="button" onClick={addChapterOutline} variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Primeiro Capítulo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chapterFields.map((field, index) => (
                      <Card key={field.id} className="border-l-4 border-l-primary" data-chapter-index={index}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base flex items-center gap-2">
                              <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-bold">
                                Capítulo {form.watch(`chapterOutlines.${index}.number`) || index + 1}
                              </span>
                            </CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeChapter(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`chapterOutlines.${index}.number`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Número</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`chapterOutlines.${index}.wordCount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Palavras Esperadas</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={100}
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name={`chapterOutlines.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Título do Capítulo *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Introdução ao Empreendedorismo" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`chapterOutlines.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descrição do Capítulo *</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Descreva o que será abordado neste capítulo, os tópicos principais e objetivos. (mínimo 50 caracteres)"
                                    className="resize-none"
                                    rows={4}
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Esta descrição será usada pela IA para gerar os subcapítulos. Deve ter pelo menos 50 caracteres.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    ))}

                    {/* Botão de adicionar capítulo na parte inferior */}
                    <div className="flex justify-center pt-4 border-t">
                      <Button type="button" onClick={addChapterOutline} variant="outline" size="lg" className="w-full md:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Novo Capítulo
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* SEÇÃO 3: Template/Modelo de Subcapítulos */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Template/Modelo de Subcapítulos *</h3>
                </div>

                <p className="text-sm text-muted-foreground">
                  Descreva como os subcapítulos devem ser estruturados e escritos. Esta informação será usada pela IA como modelo/template para gerar cada subcapítulo.
                </p>

                <FormField
                  control={form.control}
                  name="subchapterTemplate.structure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template/Modelo de Escrita dos Subcapítulos *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Os subcapítulos devem ser estruturados, didáticos e progressivos. Cada subcapítulo deve construir sobre o anterior, apresentando conceitos de forma clara e prática, com exemplos relevantes e exercícios práticos quando apropriado."
                          className="resize-none"
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Descreva detalhadamente como devem ser os subcapítulos: estilo de escrita, abordagem pedagógica, profundidade, tom, formatação, etc. Este será o modelo usado pela IA para gerar todo o conteúdo.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="subchapterTemplate.minSubchapters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mínimo de Subcapítulos</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="3"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Por capítulo</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subchapterTemplate.maxSubchapters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Máximo de Subcapítulos</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="8"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Por capítulo</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subchapterTemplate.wordCountPerSubchapter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Palavras por Subcapítulo</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={50}
                            placeholder="500"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Aproximado</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* SEÇÃO 4: Bibliografia */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Library className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Bibliografia</h3>
                  </div>
                  <Button type="button" onClick={addBibliographyItem} variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Referência
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  Adicione títulos de livros, artigos e referências que a IA deve usar como contexto para gerar o conteúdo.
                </p>

                {bibliographyFields.length === 0 ? (
                  <div className="text-center py-6 border border-dashed rounded-lg">
                    <p className="text-muted-foreground mb-4">Nenhuma referência adicionada ainda. (Opcional)</p>
                    <Button type="button" onClick={addBibliographyItem} variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Primeira Referência
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bibliographyFields.map((field, index) => (
                      <Card key={field.id}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base">Referência {index + 1}</CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBibliography(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`bibliography.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Título *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Título do livro, artigo ou referência" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`bibliography.${index}.author`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Autor</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Nome do autor" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`bibliography.${index}.year`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ano</FormLabel>
                                  <FormControl>
                                    <Input placeholder="2024" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name={`bibliography.${index}.url`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>URL (opcional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Botão de Submissão */}
              <div className="flex justify-end pt-4">
                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                  <p className="text-sm text-muted-foreground text-center md:text-right">
                    A introdução completa será gerada automaticamente pelo AI Service
                  </p>
                  <Button type="submit" disabled={isSubmitting} size="lg" className="w-full md:w-auto">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando Curso e Gerando Introdução...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Criar Curso (AI gerará introdução automaticamente)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
