'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { ServiceStatus } from './service-status';
import Link from 'next/link';
import { BookOpenCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <Link href="/" className="flex items-center gap-2 font-headline text-lg font-semibold text-primary">
          <BookOpenCheck className="h-6 w-6" />
          <span className="hidden sm:inline-block">Eduflow Tool</span>
      </Link>
      <div className="ml-auto flex items-center gap-4">
        <ServiceStatus serviceName="AI Service" />
        <ServiceStatus serviceName="Backend" />
      </div>
    </header>
  );
}
