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
    message: 'Please provide a more detailed query for enrichment.',
  }),
});

type EnrichChapterFormProps = {
  chapter: Chapter;
  courseId: string;
  onUpdateChapter: (chapterId: string, newContent: string) => void;
};

export function EnrichChapterForm({
  chapter,
  courseId,
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
    const result = await enrichChapterAction(courseId, chapter.id, {
      existingContent: chapter.content,
      userQuery: values.userQuery,
    });
    setIsSubmitting(false);

    if (result.success && result.data) {
      onUpdateChapter(result.data.id, result.data.content);
      toast({
        title: 'Chapter Enriched!',
        description: `AI assistance was ${
          result.data.aiUsed ? 'used' : 'not used'
        } for this enrichment.`,
      });
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
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
              <FormLabel>Enrichment Query</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., 'Add a real-world example for this concept'"
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
          Enrich
        </Button>
      </form>
    </Form>
  );
}
