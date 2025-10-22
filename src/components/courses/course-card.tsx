import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookCopy } from 'lucide-react';
import type { Course } from '@/lib/definitions';

type CourseCardProps = {
  course: Course;
};

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 bg-card hover:bg-secondary/50">
      <CardHeader>
        <div className='flex items-start gap-4'>
            <div className='p-2 rounded-lg bg-primary/10'>
                <BookCopy className="h-6 w-6 text-primary" />
            </div>
            <div>
                <CardTitle className="font-headline text-lg leading-tight">
                <Link href={`/courses/${course.id}`} className="hover:text-primary transition-colors">
                    {course.title}
                </Link>
                </CardTitle>
                <p className="text-sm text-muted-foreground pt-1">{course.subject}</p>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-4 pt-0">
        <CardDescription className="mt-2 flex-grow text-muted-foreground line-clamp-3">
          {course.description}
        </CardDescription>
      </CardContent>
       <CardFooter className="p-4 pt-0">
         <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/courses/${course.id}`}>
              Abrir Curso
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
      </CardFooter>
    </Card>
  );
}
