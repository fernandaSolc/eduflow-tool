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
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }),
  subject: z.string().min(3, { message: 'Subject is required.' }),
  educationalLevel: z.string().min(3, { message: 'Educational level is required.' }),
  targetAudience: z.string().min(3, { message: 'Target audience is required.' }),
  template: z.string().min(3, { message: 'Template is required.' }),
  philosophy: z.string().min(10, { message: 'Philosophy must be at least 10 characters.' }),
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
        title: 'Course Created Successfully!',
        description: `The course "${result.data.title}" was created.`,
      });
      router.push(`/courses/${result.data.id}`);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Creating Course',
        description: result.error,
      });
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
       <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Create New Course</CardTitle>
          <CardDescription>
            Fill in the details below to create a new course. The AI will use this information to generate the content.
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
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Entrepreneurship in Maranhão" {...field} />
                    </FormControl>
                    <FormDescription>The main title of your course.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what students will learn in this course."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>A concise summary of the content and objectives.</FormDescription>
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
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Entrepreneurship" {...field} />
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
                      <FormLabel>Educational Level</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: High School" {...field} />
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
                      <FormLabel>Target Audience</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: High school students" {...field} />
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
                      <FormLabel>Template</FormLabel>
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
                    <FormLabel>Educational Philosophy</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the pedagogical approach of the course."
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
                  Create Course and Go to Chapters
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
       </Card>
    </div>
  );
}
