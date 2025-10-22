'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { generateChapterAction } from '@/lib/actions';
import type { Chapter } from '@/lib/definitions';
import { useState, type ReactNode } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(5, {
    message: 'O título deve ter pelo menos 5 caracteres.',
  }),
  prompt: z.string().min(20, {
    message: 'O prompt deve ter pelo menos 20 caracteres.',
  }),
});

type NewChapterFormProps = {
  courseId: string;
  onChapterCreated: (chapter: Chapter) => void;
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewChapterForm({
  courseId,
  onChapterCreated,
  children,
  open,
  onOpenChange,
}: NewChapterFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      prompt: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const result = await generateChapterAction(courseId, values);
    setIsSubmitting(false);

    if (result.success && result.data) {
      onChapterCreated(result.data);
      toast({
        title: 'Capítulo Gerado!',
        description: `O novo capítulo "${values.title}" foi adicionado.`,
      });
      onOpenChange(false);
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: result.error,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Gerar Novo Capítulo</DialogTitle>
          <DialogDescription>
            Use IA para gerar um novo capítulo para o seu curso. Forneça um título
            e um prompt detalhado.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Capítulo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Introdução a React Hooks"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt do Capítulo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o conteúdo que você quer gerar. Inclua tópicos chave, tom desejado e público-alvo."
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Quanto mais detalhado seu prompt, melhor o resultado.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Gerar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
