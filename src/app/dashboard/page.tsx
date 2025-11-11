'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Medication, Subscription } from '@/lib/types';
import { WithId, useCollection, useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { MedicationCard } from '@/components/medication-card';
import { Alerts } from '@/components/alerts';
import { Button } from '@/components/ui/button';
import { Pill, Plus, Eye, EyeOff, Users, Menu, Phone, User, MessageSquare, LogOut, Loader2, HeartPulse, Droplets, Gem, Settings, KeyRound } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { MedicationForm } from '@/components/medication-form';
import { EmergencyContact, type EmergencyContactDetails } from '@/components/emergency-contact';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, addDays } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getAuth, signOut, sendPasswordResetEmail, updateProfile, type User as FirebaseUser } from 'firebase/auth';


const DEMO_MEDICATIONS: Omit<Medication, 'id' | 'userId'>[] = [
    {
        name: 'Aspirin',
        quantity: 50,
        dose_times: ['08:00'],
        active: true,
        instructions: 'Take with food.'
    },
    {
        name: 'Vitamin D',
        quantity: 3,
        dose_times: ['09:00'],
        active: true,
        instructions: 'Take with breakfast.'
    },
    {
        name: 'Antibiotic',
        quantity: 14,
        dose_times: ['10:00', '22:00'],
        active: true,
        instructions: 'Finish the full course.',
        course: {
            durationDays: 7,
            startDate: new Date().toISOString()
        }
    }
];


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userProfile } = useDoc(userDocRef);

  const subscriptionDocRef = useMemoFirebase(
    () => (userProfile?.subscriptionId ? doc(firestore, 'subscriptions', userProfile.subscriptionId) : null),
    [userProfile]
  );
  const { data: fetchedSubscription, isLoading: isSubscriptionLoading } = useDoc<Subscription>(subscriptionDocRef);
  
  const subscription = useMemo(() => {
    if (user?.email === 'atif.adeel.1981@gmail.com') {
      return {
        id: 'special-access-sub',
        subscriptionType: 'Premium',
        maxMedicines: 999,
        bloodPressureManager: true,
        diabeticManager: true,
      } as Subscription;
    }
    return fetchedSubscription;
  }, [user, fetchedSubscription]);


  const medicinesQuery = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'medicines') : null),
    [user, firestore]
  );
  const { data: medicines, isLoading: isMedicinesLoading } = useCollection<Medication>(medicinesQuery);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showDisabled, setShowDisabled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContactDetails | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (user?.isAnonymous && medicines?.length === 0 && !isMedicinesLoading) {
        const medRef = collection(firestore, 'users', user.uid, 'medicines');
        DEMO_MEDICATIONS.forEach(async (med) => {
            await addDoc(medRef, {
                ...med,
                userId: user.uid
            });
        });
    }
  }, [user, medicines, isMedicinesLoading, firestore]);

  useEffect(() => {
    const getContact = () => {
      const storedContact = localStorage.getItem('emergencyContact');
      if (storedContact) {
        setEmergencyContact(JSON.parse(storedContact));
      } else {
        setEmergencyContact(null);
      }
    };

    getContact();
    window.addEventListener('storage', getContact);

    return () => {
      window.removeEventListener('storage', getContact);
    };
  }, []);

  const handleAddMedicationAttempt = () => {
    if (subscription && medicines && medicines.length >= subscription.maxMedicines) {
      setIsUpgradeModalOpen(true);
    } else {
      setIsAddOpen(true);
    }
  };

  const handleAddMedication = async (newMedicationData: Partial<Medication>) => {
    if (!user) return;
    const medRef = collection(firestore, 'users', user.uid, 'medicines');
    await addDoc(medRef, {
        ...newMedicationData,
        userId: user.uid,
        active: true,
    });
    setIsAddOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleUpdateMedication = async (updatedMedication: WithId<Medication>) => {
    if (!user) return;
    const medRef = doc(firestore, 'users', user.uid, 'medicines', updatedMedication.id);
    const { id, ...medData } = updatedMedication;
    await updateDoc(medRef, medData);
  };

  const handleDeleteMedication = async (medicationId: string) => {
    if (!user) return;
    const medRef = doc(firestore, 'users', user.uid, 'medicines', medicationId);
    await deleteDoc(medRef);
  };

  const isMedicationVisible = (med: Medication) => {
    if (showDisabled) return true;
    if (med.active === false) return false;
    
    if (med.course) {
      const startDate = new Date(med.course.startDate);
      const endDate = addDays(startDate, med.course.durationDays);
      const remaining = differenceInDays(endDate, new Date());
      if (remaining < 0) return false;
    }
    
    return true;
  }
  
  const visibleMedicines = useMemo(() => (medicines || []).filter(isMedicationVisible), [medicines, showDisabled]);

  const getActiveMedications = () => {
    return (medicines || []).filter(m => {
        if (m.active === false) return false;
        if (m.course) {
            const startDate = new Date(m.course.startDate);
            const endDate = addDays(startDate, m.course.durationDays);
            return differenceInDays(endDate, new Date()) >= 0;
        }
        return true;
    });
  }

  const activeMedications = useMemo(() => getActiveMedications(), [medicines]);
  const lowStockMedicines = useMemo(() => activeMedications.filter(m => m.quantity < 5), [activeMedications]);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col gap-4">
       <Button onClick={handleAddMedicationAttempt}>
        <Plus className="mr-2" />
        Add Medication
      </Button>

      <EmergencyContact />

      <Button variant="outline" onClick={() => setShowDisabled(prev => !prev)}>
        {showDisabled ? <EyeOff className="mr-2" /> : <Eye className="mr-2" />}
        {showDisabled ? 'Hide Inactive' : 'Show Inactive'}
      </Button>

      <hr className="my-2" />
       <h3 className="px-4 text-sm font-semibold text-muted-foreground">Premium Features</h3>
      <Button variant="ghost" className="justify-start" onClick={() => !subscription?.bloodPressureManager && setIsUpgradeModalOpen(true)} disabled={isSubscriptionLoading}>
        <HeartPulse className="mr-2" />
        Blood Pressure
        {!isSubscriptionLoading && !subscription?.bloodPressureManager && <Gem className="ml-auto h-4 w-4 text-accent" />}
      </Button>
       <Button variant="ghost" className="justify-start" onClick={() => !subscription?.diabeticManager && setIsUpgradeModalOpen(true)} disabled={isSubscriptionLoading}>
        <Droplets className="mr-2" />
        Diabetic Manager
        {!isSubscriptionLoading && !subscription?.diabeticManager && <Gem className="ml-auto h-4 w-4 text-accent" />}
      </Button>
    </div>
  );

  const handleNotifyAllLowStock = () => {
    if (!emergencyContact) {
      toast({
        variant: 'destructive',
        title: 'No Emergency Contact',
        description: 'Please set an emergency contact name and number first.',
      });
      return;
    }

    if (lowStockMedicines.length === 0) {
      toast({
        title: 'No Low Stock Medications',
        description: 'All your medications are well-stocked.',
      });
      return;
    }

    const lowStockList = lowStockMedicines
      .map(med => `- ${med.name} (only ${med.quantity} left)`)
      .join('\n');
    
    const message = encodeURIComponent(
      `Hi ${emergencyContact.name}, this is a reminder about my medications that are running low:\n\n${lowStockList}`
    );
    const whatsappUrl = `https://wa.me/${emergencyContact.phone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  if (isUserLoading || isSubscriptionLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Medication</DialogTitle>
          </DialogHeader>
          <MedicationForm
            onSubmit={handleAddMedication}
            onClose={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Gem className="text-accent"/> Upgrade to Premium</DialogTitle>
            <DialogDescription>
              Unlock powerful features by upgrading your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
              <p>The free plan is limited to {subscription?.maxMedicines} medications.</p>
              <p>Upgrade to Premium to add unlimited medications and get access to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="font-semibold">Blood Pressure Manager:</span> Track your blood pressure readings and trends.
                </li>
                <li>
                  <span className="font-semibold">Diabetic Manager:</span> Monitor your blood sugar levels and insulin doses.
                </li>
              </ul>
              <p className="text-center text-lg font-bold">Only $9.99/month</p>
          </div>
          <DialogFooter>
              <Button variant="ghost" onClick={() => setIsUpgradeModalOpen(false)}>Maybe Later</Button>
              <Button onClick={() => {
                toast({ title: "Redirecting to payment...", description: "This is a demo. No payment will be processed."});
                setIsUpgradeModalOpen(false);
              }} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Upgrade Now
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
       <SettingsDialog user={user} isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <a href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Pill className="h-6 w-6 text-primary" />
              <span className="">MEDIC REMINDER</span>
            </a>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {sidebarContent}
            </nav>
          </div>
        </div>
      </aside>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
           <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <SheetHeader>
                 <SheetTitle>
                    <a href="/dashboard" className="flex items-center gap-2 font-semibold">
                        <Pill className="h-6 w-6 text-primary" />
                        <span className="">MEDIC REMINDER</span>
                    </a>
                 </SheetTitle>
              </SheetHeader>
              <nav className="grid gap-2 text-lg font-medium">
                {sidebarContent}
              </nav>
            </SheetContent>
          </Sheet>
           <div className="w-full flex-1">
             <h1 className="font-headline text-2xl font-bold tracking-tighter text-foreground sm:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent text-center md:hidden">
              MEDIC REMINDER
            </h1>
           </div>
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage src={user?.photoURL ?? undefined} />
                    <AvatarFallback>{user?.displayName?.charAt(0) ?? user?.email?.charAt(0).toUpperCase() ?? 'G'}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.displayName ?? (subscription ? `${subscription.subscriptionType} Plan` : (user?.isAnonymous ? 'Guest Account' : 'My Account'))}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsUpgradeModalOpen(true)}>
                  <Gem className="mr-2 h-4 w-4" />
                  <span>Upgrade</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
           <header className="hidden md:flex flex-col items-center gap-2 text-center">
            <h1 className="font-headline text-5xl font-bold tracking-tighter text-foreground sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              MEDIC REMINDER
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Your personal assistant for staying on top of your medication
              schedule and supplies.
            </p>
          </header>
          
          {emergencyContact && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                 <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{emergencyContact.name}</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{emergencyContact.phone}</span>
                 </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleNotifyAllLowStock}
                  disabled={!emergencyContact || lowStockMedicines.length === 0}
                >
                  <MessageSquare className="mr-2"/> Notify about Low Stock
                </Button>
              </CardFooter>
            </Card>
          )}

          <Alerts medications={activeMedications} />

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-headline text-2xl font-semibold">
                My Medications ({medicines?.length || 0})
              </h2>
            </div>
            {isMedicinesLoading ? (
               <div className="text-center py-12 text-muted-foreground">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    <p className="mt-2">Loading your medications...</p>
                </div>
            ) : visibleMedicines.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {visibleMedicines.map((medication) => (
                  <MedicationCard
                    key={medication.id}
                    medication={medication}
                    onUpdate={handleUpdateMedication}
                    onDelete={handleDeleteMedication}
                  />
                ))}
              </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <p>You have no medications to display.</p>
                    <p className="text-sm">Try adding a new medication or showing inactive ones.</p>
                </div>
            )}
          </section>
        </main>
      </div>
    </div>
    </>
  );
}


function SettingsDialog({ user, isOpen, onOpenChange }: { user: FirebaseUser | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName });
      toast({
        title: "Success",
        description: "Your display name has been updated.",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Could not update display name. " + error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
       toast({
          variant: 'destructive',
          title: "Error",
          description: "Cannot reset password without an email address.",
        });
      return;
    };
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: "Password Reset Email Sent",
        description: `An email has been sent to ${user.email} with instructions to reset your password.`,
      });
      onOpenChange(false);
    } catch (error: any) {
       toast({
          variant: 'destructive',
          title: "Error",
          description: "Failed to send password reset email. " + error.message,
        });
    }
  };
  
  const isEmailPasswordUser = user?.providerData.some(p => p.providerId === 'password');


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your account details and password.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSaveName} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
              disabled={isSaving}
            />
          </div>
          <Button type="submit" disabled={isSaving || displayName === user?.displayName}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Name
          </Button>
        </form>

        <hr className="my-2" />

        {isEmailPasswordUser && (
          <div className="space-y-2">
              <h3 className="font-medium">Password Reset</h3>
              <p className="text-sm text-muted-foreground">
                Click the button below to send a password reset link to your email address.
              </p>
              <Button onClick={handlePasswordReset} variant="outline">
                  <KeyRound className="mr-2" />
                  Send Password Reset Email
              </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
