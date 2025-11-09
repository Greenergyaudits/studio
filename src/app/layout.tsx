import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'MEDIC REMINDER',
  description: 'Your personal assistant for staying on top of your medication schedule and supplies.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <div className="flex-grow">{children}</div>
        <Toaster />
        <footer className="py-4 px-6 text-center text-sm text-muted-foreground bg-background border-t">
          <p>&copy; {new Date().getFullYear()} Greenergy Innovations (smc) Pvt. Ltd. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
