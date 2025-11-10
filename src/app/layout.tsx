import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});


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
      <body className={cn("font-body antialiased flex flex-col min-h-screen", ptSans.variable)}>
        <FirebaseClientProvider>
          <FirebaseErrorListener />
          <div className="flex-grow">{children}</div>
          <Toaster />
          <footer className="py-4 px-6 text-center text-sm text-muted-foreground bg-background border-t">
            <p>&copy; {new Date().getFullYear()} Greenergy Innovations (smc) Pvt. Ltd. All rights reserved.</p>
          </footer>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
