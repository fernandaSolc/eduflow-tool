'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Settings,
  BookOpenCheck,
  LifeBuoy,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Separator } from '../ui/separator';

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <Sidebar variant="sidebar" collapsible="icon" side="left">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex w-full items-center gap-2 p-2">
            <BookOpenCheck className="size-6 text-primary" />
            <span className="font-headline text-lg font-semibold text-primary">
              Eduflow
            </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === '/'}
              tooltip={{ children: 'Dashboard' }}
            >
              <Link href="/">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/settings')}
              tooltip={{ children: 'Settings' }}
            >
              <Link href="#">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
         <Separator className="my-2 bg-sidebar-border" />
         <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={{ children: 'Support' }} asChild>
              <Link href="#">
                <LifeBuoy />
                <span>Support</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
