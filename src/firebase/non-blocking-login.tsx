'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, writeBatch, collection } from 'firebase/firestore';
import { getSdks } from '@/firebase';


// This function will be called after a user signs up successfully
async function createUserProfile(userCredential: UserCredential): Promise<void> {
  const user = userCredential.user;
  const { firestore } = getSdks(user.providerData[0] as any); // Bit of a hack to get firestore instance
  if (!firestore) return;

  const userRef = doc(firestore, "users", user.uid);

  // Check if user profile already exists
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return; // Profile already created
  }

  // Create a new basic subscription for the user
  const subscriptionRef = doc(collection(firestore, "subscriptions"));
  const basicSubscription = {
    subscriptionType: "Basic",
    maxMedicines: 5,
    bloodPressureManager: false,
    diabeticManager: false
  };

  const userProfile = {
    email: user.email,
    subscriptionId: subscriptionRef.id,
  };
  
  // Use a batch write to create user and subscription atomically
  const batch = writeBatch(firestore);
  batch.set(subscriptionRef, basicSubscription);
  batch.set(userRef, userProfile);

  await batch.commit();
}


/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance)
    .then(createUserProfile)
    .catch((error) => {
        console.error("Anonymous sign in error", error);
    });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(createUserProfile)
    .catch((error) => {
      // Error is handled by the form's error handler
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password)
    .catch((error) => {
        // Error is handled by the form's error handler
    });
}

    