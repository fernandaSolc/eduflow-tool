import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';

export const metadata: Metadata = {
  title: 'Eduflow Tool',
  description: 'AI-powered course content generation tool.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased min-h-screen w-full bg-background text-foreground')}>
        <SidebarProvider>
          <SidebarNav />
          <main className="flex min-h-svh flex-1 flex-col bg-background peer-data-[variant=sidebar]:pl-[--sidebar-width-icon] lg:peer-data-[variant=sidebar]:pl-[--sidebar-width]">
            <Header />
            <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
