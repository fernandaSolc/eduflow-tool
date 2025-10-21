import { courses } from '@/lib/data';
import { CourseCard } from '@/components/courses/course-card';

export default function Home() {
  return (
    <div>
      <h1 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Courses
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Browse and manage your AI-powered courses.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
