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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { expandChapterAction } from '@/lib/actions';
import type { Chapter } from '@/lib/definitions';
import { useState } from 'react';
import { Loader2, StretchHorizontal } from 'lucide-react';

const formSchema = z.object({
  continuationType: z.string({
    required_error: 'Por favor, selecione um tipo de continuação.',
  }),
  additionalDetails: z.string().optional(),
});

type ExpandChapterFormProps = {
  chapter: Chapter;
  onUpdateChapter: () => void;
};

export function ExpandChapterForm({
  chapter,
  onUpdateChapter,
}: ExpandChapterFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      continuationType: chapter.availableContinueTypes?.[0] || '',
      additionalDetails: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const result = await expandChapterAction(chapter.id, {
      continuationType: values.continuationType,
      additionalDetails: values.additionalDetails,
    });
    setIsSubmitting(false);

    if (result.success && result.data) {
      onUpdateChapter();
      toast({
        title: 'Capítulo Expandido!',
        description: 'Seu capítulo foi atualizado com novo conteúdo.',
      });
      form.reset({
        continuationType: result.data.availableContinueTypes?.[0] || '',
        additionalDetails: '',
      });
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="continuationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Continuação</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!chapter.canContinue || chapter.availableContinueTypes.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione como continuar..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {chapter.availableContinueTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type === 'expand' && 'Expandir Conteúdo'}
                        {type === 'add_section' && 'Adicionar Seção'}
                        {type === 'add_activities' && 'Adicionar Atividades'}
                        {type === 'add_assessments' && 'Adicionar Avaliações'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="additionalDetails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detalhes Adicionais (Opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ex: 'Foque nas implicações de performance...'"
                    className="resize-none"
                    {...field}
                    disabled={!chapter.canContinue}
                  />
                </FormControl>
                <FormDescription>
                  Forneça contexto extra para guiar a IA.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isSubmitting || !chapter.canContinue}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <StretchHorizontal className="mr-2 h-4 w-4" />
          )}
          Expandir
        </Button>
      </form>
    </Form>
  );
}
