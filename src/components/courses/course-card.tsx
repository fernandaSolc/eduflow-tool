import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { Course } from '@/lib/definitions';

type CourseCardProps = {
  course: Course;
};

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 bg-card hover:bg-secondary/50">
      <CardHeader>
        <CardTitle className="font-headline text-lg">
          <Link href={`/courses/${course.id}`} className="hover:text-primary transition-colors">
            {course.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-4 pt-0">
        <CardDescription className="mt-2 flex-grow text-muted-foreground line-clamp-3">
          {course.description}
        </CardDescription>
        <div className="mt-6 flex justify-end">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/courses/${course.id}`}>
              Abrir Curso
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
