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
  Settings,
  BookOpenCheck,
  LifeBuoy,
} from 'lucide-react';
import Link from 'next/link';
import { Separator } from '../ui/separator';

export function SidebarNav() {

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
        {/* Main navigation has been moved to PageNav */}
      </SidebarContent>
      <SidebarFooter className="p-2">
         <Separator className="my-2 bg-sidebar-border" />
         <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={{ children: 'Settings' }} asChild>
              <Link href="#">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
