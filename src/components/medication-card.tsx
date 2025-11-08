import type { Medication } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Package, Pill, Calendar, Edit } from 'lucide-react';
import { RefillPredictor } from './refill-predictor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MedicationForm } from './medication-form';
import { useState } from 'react';

type MedicationCardProps = {
  medication: Medication;
  onUpdate: (medication: Medication) => void;
};

export function MedicationCard({ medication, onUpdate }: MedicationCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleFormSubmit = (updatedMedication: Medication) => {
    onUpdate(updatedMedication);
    setIsEditDialogOpen(false);
  };
  return (
    <Card className="flex flex-col transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-3">
            <Pill className="h-6 w-6 text-primary" />
            <span className="font-headline text-xl">{medication.name}</span>
          </CardTitle>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit {medication.name}</DialogTitle>
              </DialogHeader>
              <MedicationForm
                medication={medication}
                onSubmit={handleFormSubmit}
                onClose={() => setIsEditDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col gap-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Package className="h-5 w-5" />
          <span>Quantity: {medication.quantity}</span>
        </div>
         {medication.expiryDate && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Calendar className="h-5 w-5" />
            <span>Expires: {medication.expiryDate}</span>
          </div>
        )}
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <Clock className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex flex-wrap items-center gap-2">
            <span>Dose times:</span>
            {medication.dose_times.map((time) => (
              <Badge key={time} variant="secondary" className="font-mono">
                {time}
              </Badge>
            ))}
          </div>
        </div>
        <div className="mt-auto pt-4">
          <RefillPredictor medication={medication} />
        </div>
      </CardContent>
    </Card>
  );
}
