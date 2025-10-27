'use client';

import { useForm } from 'react-hook-form';
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
import { Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  title: z.string().min(5, { message: 'O título deve ter pelo menos 5 caracteres.' }),
  description: z.string().min(20, { message: 'A ementa deve ter pelo menos 20 caracteres.' }),
  subject: z.string().min(3, { message: 'A disciplina é obrigatória.' }),
  educationalLevel: z.string().optional(),
  targetAudience: z.string().optional(),
  template: z.string().min(3, { message: 'O modelo é obrigatório.' }),
  philosophy: z.string().min(10, { message: 'A filosofia deve ter pelo menos 10 caracteres.' }),
});

export default function NewCoursePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      subject: 'empreendedorismo',
      educationalLevel: 'ensino médio',
      targetAudience: 'estudantes do ensino médio',
      template: 'empreendedorismo_maranhao',
      philosophy: 'Educação inclusiva e acessível para todos os estudantes',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const result = await createCourseAction(values);
    setIsSubmitting(false);

    if (result.success && result.data) {
      toast({
        title: 'Curso Criado com Sucesso!',
        description: `O curso "${result.data.title}" foi criado e a IA já gerou o conteúdo inicial.`,
      });
      router.push(`/courses/${result.data.id}`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro ao Criar Curso',
        description: result.error,
      });
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
       <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Criar Novo Curso</CardTitle>
          <CardDescription>
            Preencha os detalhes abaixo. A IA usará essas informações para criar o curso e gerar os capítulos iniciais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Curso</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Empreendedorismo no Maranhão" {...field} />
                    </FormControl>
                    <FormDescription>O título principal do seu curso.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ementa</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o que os alunos aprenderão neste curso."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>Um resumo conciso do conteúdo e dos objetivos.</FormDescription>
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
                      <FormLabel>Disciplina</FormLabel>
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
                 <FormField
                  control={form.control}
                  name="template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: empreendedorismo_maranhao" {...field} />
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
                    <FormLabel>Filosofia Educacional</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva a abordagem pedagógica do curso."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} size="lg">
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Criar Curso com IA
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
       </Card>
    </div>
  );
}
