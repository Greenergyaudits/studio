import { medicines } from '@/lib/data';
import { MedicationCard } from '@/components/medication-card';
import { Alerts } from '@/components/alerts';
import { Pill } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex-1">
        <div className="container mx-auto grid gap-8 px-4 py-8 md:px-6">
          <header className="flex flex-col items-center gap-4 text-center">
            <div className="inline-block rounded-full bg-primary/20 p-4 text-primary">
              <Pill className="h-8 w-8" />
            </div>
            <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Medication Minder
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Your personal assistant for staying on top of your medication
              schedule and supplies.
            </p>
          </header>

          <Alerts medications={medicines} />

          <section>
            <h2 className="font-headline mb-4 text-2xl font-semibold">
              My Medications
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {medicines.map((medication) => (
                <MedicationCard key={medication.id} medication={medication} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
