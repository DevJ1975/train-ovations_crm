import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Plus_Jakarta_Sans, Sora } from 'next/font/google';

import { Toaster } from 'sonner';

import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { CommandPalette } from '@/components/ui/command-palette';
import { NavigationProgress } from '@/components/ui/navigation-progress';

import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Trainovations CRM',
  description: 'Enterprise CRM for Trainovations rep landing pages and lead management.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} ${sora.variable} font-sans`}>
        <ThemeProvider>
          <QueryProvider>
            <NavigationProgress />
            <AppSidebar />
            <CommandPalette />
            {children}
            <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast: 'font-sans text-sm rounded-xl border shadow-lg',
                success: 'border-success/30 bg-success/5 text-foreground',
                error: 'border-destructive/30 bg-destructive/5 text-foreground',
                info: 'border-primary/20 bg-primary/5 text-foreground',
              },
            }}
          />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
