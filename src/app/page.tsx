'use client';

import { useState, useEffect } from 'react';
import { medicines as initialMedicines } from '@/lib/data';
import type { Medication } from '@/lib/types';
import { MedicationCard } from '@/components/medication-card';
import { Alerts } from '@/components/alerts';
import { Button } from '@/components/ui/button';
import { Pill, Plus, Eye, EyeOff, Users, Menu, Phone, User, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, addDays } from 'date-fns';


export default function Home() {
  const [medicines, setMedicines] = useState<Medication[]>(initialMedicines);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showDisabled, setShowDisabled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContactDetails | null>(null);
  const { toast } = useToast();

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


  const handleAddMedication = (newMedicationData: Partial<Medication>) => {
    setMedicines((prev) => [
      ...prev,
      {
        ...newMedicationData,
        id: prev.length > 0 ? Math.max(...prev.map((m) => m.id)) + 1 : 1,
        active: true,
      } as Medication,
    ]);
    setIsAddOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleUpdateMedication = (updatedMedication: Medication) => {
    setMedicines((prev) =>
      prev.map((med) => (med.id === updatedMedication.id ? updatedMedication : med))
    );
  };

  const handleDeleteMedication = (medicationId: number) => {
    setMedicines((prev) => prev.filter((med) => med.id !== medicationId));
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
  
  const visibleMedicines = medicines.filter(isMedicationVisible);

  const getActiveMedications = () => {
    return medicines.filter(m => {
        if (m.active === false) return false;
        if (m.course) {
            const startDate = new Date(m.course.startDate);
            const endDate = addDays(startDate, m.course.durationDays);
            return differenceInDays(endDate, new Date()) >= 0;
        }
        return true;
    });
  }

  const activeMedications = getActiveMedications();

  const sidebarContent = (
    <div className="flex flex-col gap-4">
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2" />
            Add Medication
          </Button>
        </DialogTrigger>
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

      <EmergencyContact />

      <Button variant="outline" onClick={() => setShowDisabled(prev => !prev)}>
        {showDisabled ? <EyeOff className="mr-2" /> : <Eye className="mr-2" />}
        {showDisabled ? 'Hide Inactive' : 'Show Inactive'}
      </Button>
    </div>
  );

  const lowStockMedicines = activeMedications.filter(m => m.quantity < 5);

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

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <a href="/" className="flex items-center gap-2 font-semibold">
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
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
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
                    <a href="/" className="flex items-center gap-2 font-semibold">
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
             <h1 className="font-headline text-2xl font-bold tracking-tighter text-foreground sm:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent text-center">
              MEDIC REMINDER
            </h1>
           </div>
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
                My Medications
              </h2>
            </div>
            {visibleMedicines.length > 0 ? (
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
  );

    
}
