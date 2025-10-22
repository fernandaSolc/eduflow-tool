'use client';

import Link from 'next/link';
import { BookOpenCheck } from 'lucide-react';
import { ServiceStatus } from './service-status';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2 font-headline text-lg font-semibold text-primary">
          <BookOpenCheck className="h-6 w-6" />
          <span className="hidden sm:inline-block">Eduflow Tool</span>
      </Link>
      <div className="ml-auto flex items-center gap-4">
        <ServiceStatus serviceName="Serviço de IA" />
        <ServiceStatus serviceName="Backend" />
      </div>
    </header>
  );
}
