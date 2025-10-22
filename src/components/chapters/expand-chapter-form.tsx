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
    required_error: 'Please select a continuation type.',
  }),
  additionalDetails: z.string().optional(),
});

const continuationTypes = [
  'More examples',
  'Deeper explanation',
  'Related topics',
  'Summarize the key points',
  'Create a quiz',
];

type ExpandChapterFormProps = {
  chapter: Chapter;
  courseId: string;
  onUpdateChapter: (chapterId: string, newContent: string) => void;
};

export function ExpandChapterForm({
  chapter,
  courseId,
  onUpdateChapter,
}: ExpandChapterFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      additionalDetails: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const result = await expandChapterAction(courseId, chapter.id, {
      existingContent: chapter.content,
      ...values,
    });
    setIsSubmitting(false);

    if (result.success && result.data) {
      onUpdateChapter(result.data.id, result.data.content);
      toast({
        title: 'Chapter Expanded!',
        description: 'Your chapter has been updated with new content.',
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="continuationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Continuation Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select how to continue..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {continuationTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
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
                <FormLabel>Additional Details (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., 'Focus on performance implications...'"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide extra context to guide the AI.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <StretchHorizontal className="mr-2 h-4 w-4" />
          )}
          Expand
        </Button>
      </form>
    </Form>
  );
}
