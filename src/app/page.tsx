'use client';

import { courses } from '@/lib/data';
import { CourseCard } from '@/components/courses/course-card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col gap-12 sm:gap-16 lg:gap-20">
      <section className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Crie Cursos Memoráveis com IA
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
          Transforme sua expertise em conteúdo educacional de alta qualidade, de forma intuitiva e assistida por nossa inteligência artificial.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
          <Button asChild size="lg">
            <Link href="/courses">
              Começar a Criar
              <Sparkles className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="link" size="lg">
            <Link href="#course-list">
              Ver Cursos Existentes <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section id="course-list">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Seus Cursos
                </h2>
                <p className="mt-2 text-lg text-muted-foreground">
                Continue de onde parou ou explore seus projetos.
                </p>
            </div>
            <Button asChild className="shrink-0">
                <Link href="/courses/new">
                    Criar Novo Curso
                    <PlusCircle className="ml-2 h-5 w-5" />
                </Link>
            </Button>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>
    </div>
  );
}
