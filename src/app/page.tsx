'use client';

import { useState } from 'react';
import { medicines as initialMedicines } from '@/lib/data';
import type { Medication } from '@/lib/types';
import { MedicationCard } from '@/components/medication-card';
import { Alerts } from '@/components/alerts';
import { Button } from '@/components/ui/button';
import { Pill, Plus, Eye, EyeOff, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MedicationForm } from '@/components/medication-form';
import { EmergencyContact } from '@/components/emergency-contact';

export default function Home() {
  const [medicines, setMedicines] = useState<Medication[]>(initialMedicines);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showDisabled, setShowDisabled] = useState(false);

  const handleAddMedication = (newMedication: Medication) => {
    setMedicines((prev) => [
      ...prev,
      { ...newMedication, id: prev.length > 0 ? Math.max(...prev.map((m) => m.id)) + 1 : 1, active: true },
    ]);
    setIsAddOpen(false);
  };

  const handleUpdateMedication = (updatedMedication: Medication) => {
    setMedicines((prev) =>
      prev.map((med) => (med.id === updatedMedication.id ? updatedMedication : med))
    );
  };

  const handleDeleteMedication = (medicationId: number) => {
    setMedicines((prev) => prev.filter((med) => med.id !== medicationId));
  };
  
  const visibleMedicines = showDisabled ? medicines : medicines.filter(m => m.active !== false);


  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex-1">
        <div className="container mx-auto grid gap-8 px-4 py-8 md:px-6">
          <header className="flex flex-col items-center gap-4 text-center">
            <div className="inline-block rounded-full bg-primary/20 p-4 text-primary">
              <Pill className="h-8 w-8" />
            </div>
            <h1 className="font-headline text-5xl font-bold tracking-tighter text-foreground sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              MEDIC REMINDER
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Your personal assistant for staying on top of your medication
              schedule and supplies.
            </p>
          </header>

          
          <Alerts medications={medicines.filter(m => m.active !== false)} />

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-headline text-2xl font-semibold">
                My Medications
              </h2>
              <div className="flex items-center gap-2">
                 <Button variant="outline" onClick={() => setShowDisabled(prev => !prev)}>
                  {showDisabled ? <EyeOff className="mr-2" /> : <Eye className="mr-2" />}
                  {showDisabled ? 'Hide Disabled' : 'Show Disabled'}
                </Button>
                <EmergencyContact />
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
              </div>
            </div>
            {visibleMedicines.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                    <p className="text-sm">Try adding a new medication or showing disabled ones.</p>
                </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
