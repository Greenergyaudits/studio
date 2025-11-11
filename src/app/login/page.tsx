'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithPopup,
  GoogleAuthProvider,
  AuthError,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pill, Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useToast } from '@/hooks/use-toast';
import { getFirestore, doc, getDoc, setDoc, writeBatch, collection } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = getFirestore(auth.app);
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const createUserProfile = async (user: import('firebase/auth').User) => {
    const userRef = doc(firestore, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        const subscriptionRef = doc(collection(firestore, "subscriptions"));
        
        const batch = writeBatch(firestore);

        batch.set(subscriptionRef, {
            subscriptionType: "Basic",
            maxMedicines: 5,
            bloodPressureManager: false,
            diabeticManager: false
        });

        batch.set(userRef, {
            email: user.email,
            subscriptionId: subscriptionRef.id
        });
        
        await batch.commit();
    }
  };


  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await createUserProfile(result.user);
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request') {
        console.error('Error signing in with Google', error);
        toast({
          variant: 'destructive',
          title: 'Sign-in failed',
          description: 'Could not sign in with Google. Please try again.',
        });
      }
    }
  };
  
  const handleAnonymousSignIn = async () => {
    setIsSubmitting(true);
    try {
      const result = await signInAnonymously(auth);
      await createUserProfile(result.user);
    } catch (error) {
       handleAuthError(error as AuthError);
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleAuthError = (error: AuthError) => {
    let description = 'An unexpected error occurred. Please try again.';
    switch (error.code) {
      case 'auth/email-already-in-use':
        description = 'This email address is already in use by another account.';
        break;
      case 'auth/invalid-email':
        description = 'The email address is not valid.';
        break;
      case 'auth/operation-not-allowed':
        description = 'Email/password accounts are not enabled.';
        break;
      case 'auth/weak-password':
        description = 'The password is not strong enough.';
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        description = 'Invalid email or password. Please try again.';
        break;
      default:
        console.error('Authentication Error:', error);
    }
    toast({
      variant: 'destructive',
      title: 'Authentication Failed',
      description,
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(result.user);
    } catch (error) {
      handleAuthError(error as AuthError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      handleAuthError(error as AuthError);
    } finally {
      setIsSubmitting(false);
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
      <div className="w-full max-w-md space-y-6">
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

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email-signin">Email</Label>
                <Input
                  id="email-signin"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signin">Password</Label>
                <Input
                  id="password-signin"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email-signup">Email</Label>
                <Input
                  id="email-signup"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup">Password</Label>
                <Input
                  id="password-signup"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button onClick={handleGoogleSignIn} className="w-full" variant="outline" size="lg" disabled={isSubmitting}>
            <FcGoogle className="mr-2 h-5 w-5" />
            Sign In with Google
          </Button>

          <Button onClick={handleAnonymousSignIn} className="w-full" variant="secondary" size="lg" disabled={isSubmitting}>
              Skip for now and use Test Version
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

    