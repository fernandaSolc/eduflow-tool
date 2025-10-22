'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { enrichChapterAction } from '@/lib/actions';
import type { Chapter } from '@/lib/definitions';
import { useState } from 'react';
import { Loader2, Wand2 } from 'lucide-react';

const formSchema = z.object({
  userQuery: z.string().min(10, {
    message: 'Por favor, forneça uma consulta mais detalhada para enriquecimento.',
  }),
});

type EnrichChapterFormProps = {
  chapter: Chapter;
  onUpdateChapter: () => void;
};

export function EnrichChapterForm({
  chapter,
  onUpdateChapter,
}: EnrichChapterFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userQuery: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const result = await enrichChapterAction(chapter, {
      userQuery: values.userQuery,
    });
    setIsSubmitting(false);

    if (result.success && result.data) {
      onUpdateChapter();
      toast({
        title: 'Capítulo Enriquecido!',
        description: `A assistência da IA foi usada para este enriquecimento.`,
      });
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="userQuery"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Consulta de Enriquecimento</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: 'Adicione um exemplo do mundo real para este conceito'"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Enriquecer
        </Button>
      </form>
    </Form>
  );
}
