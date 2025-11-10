'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Pill, Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // The useEffect will handle the redirect
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };
  
  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Pill className="h-12 w-12 text-primary" />
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-tighter text-foreground sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            MEDIC REMINDER
          </h1>
          <p className="mt-4 text-muted-foreground">
            Sign in to manage your medications.
          </p>
        </div>
        <div className="flex flex-col items-center space-y-4">
            <Button onClick={handleSignIn} className="w-full max-w-xs" size="lg">
                <FcGoogle className="mr-2 h-5 w-5" />
                Sign In with Google
            </Button>
        </div>
        <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
            </a>
            .
        </p>
      </div>
    </div>
  );
}
