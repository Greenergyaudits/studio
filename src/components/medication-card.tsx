import type { Medication } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Package, Pill, Calendar, Edit, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MedicationForm } from './medication-form';
import { useState } from 'react';

type MedicationCardProps = {
  medication: Medication;
  onUpdate: (medication: Medication) => void;
  onDelete: (medicationId: number) => void;
};

export function MedicationCard({ medication, onUpdate, onDelete }: MedicationCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleFormSubmit = (updatedMedication: Medication) => {
    onUpdate(updatedMedication);
    setIsEditDialogOpen(false);
  };

  const handleArchive = () => {
    onUpdate({ ...medication, quantity: 0, dose_times: [] });
  }

  const handleDelete = () => {
    onDelete(medication.id);
  }

  return (
    <Card className="flex flex-col transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-3">
            <Pill className="h-6 w-6 text-primary" />
            <span className="font-headline text-xl">{medication.name}</span>
          </CardTitle>
          <div className="flex items-center gap-1">
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
            
            {medication.quantity > 0 ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Archive Medication?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This medication still has quantity remaining. Archiving it will set the quantity to 0 and disable reminders. You can then delete it.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the medication record for {medication.name}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            )}
          </div>
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
           {medication.dose_times.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span>Dose times:</span>
              {medication.dose_times.map((time) => (
                <Badge key={time} variant="secondary" className="font-mono">
                  {time}
                </Badge>
              ))}
            </div>
          ) : (
             <span className="text-sm text-muted-foreground italic">No dose times set.</span>
          )}
        </div>
        <div className="mt-auto pt-4">
          <RefillPredictor medication={medication} />
        </div>
      </CardContent>
    </Card>
  );
}
