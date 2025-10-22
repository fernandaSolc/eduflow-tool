'use client';

import { cn } from "@/lib/utils";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function PageNav() {
  const pathname = usePathname();
  
  const navItems = [
    {
      href: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/',
    },
    // {
    //   href: '/courses',
    //   label: 'Cursos',
    //   icon: BookCopy,
    //   isActive: pathname.startsWith('/courses'),
    // }
  ];

  return (
    <nav className="border-b bg-background">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors",
                item.isActive 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
