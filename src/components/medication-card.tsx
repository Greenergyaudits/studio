import type { Medication } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Package, Pill, Calendar, Edit, Trash2, Eye, EyeOff, ClipboardList, Timer } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { differenceInDays, addDays } from 'date-fns';

type MedicationCardProps = {
  medication: Medication;
  onUpdate: (medication: Medication) => void;
  onDelete: (medicationId: number) => void;
};

export function MedicationCard({ medication, onUpdate, onDelete }: MedicationCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleFormSubmit = (updatedFields: Partial<Medication>) => {
    onUpdate({ ...medication, ...updatedFields });
    setIsEditDialogOpen(false);
  };

  const handleArchive = () => {
    onUpdate({ ...medication, quantity: 0, dose_times: [] });
  }

  const handleDelete = () => {
    onDelete(medication.id);
  }

  const handleToggleActive = () => {
    onUpdate({ ...medication, active: !(medication.active ?? true) });
  };
  
  const getCourseRemainingDays = () => {
    if (!medication.course) return null;
    const startDate = new Date(medication.course.startDate);
    const endDate = addDays(startDate, medication.course.durationDays);
    const remaining = differenceInDays(endDate, new Date());
    return remaining >= 0 ? remaining : 0;
  }
  
  const remainingDays = getCourseRemainingDays();
  const isCourseCompleted = remainingDays !== null && remainingDays <= 0;


  return (
    <Card className={cn(
      "flex flex-col transition-all hover:shadow-md",
      (medication.active === false || isCourseCompleted) && "bg-muted/50 opacity-70"
    )}>
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
            
            {medication.quantity > 0 && medication.active !== false ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Archive or Disable Medication?</AlertDialogTitle>
                      <AlertDialogDescription>
                          This medication has quantity remaining. You can disable it to hide it and pause reminders, or archive it to set its quantity to 0.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-between">
                      <AlertDialogAction onClick={handleToggleActive} variant="outline">
                        <EyeOff className="mr-2"/> Disable
                      </AlertDialogAction>
                      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-2 sm:mt-0">
                         <AlertDialogCancel>Cancel</AlertDialogCancel>
                         <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
                      </div>
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
        {(medication.active === false || isCourseCompleted) && (
          <Badge variant="secondary" className="w-fit">
            <EyeOff className="mr-2" /> 
            {isCourseCompleted ? "Course Completed" : "Disabled"}
          </Badge>
        )}
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
        {remainingDays !== null && (
           <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Timer className="h-5 w-5" />
            <span>
              {remainingDays > 0 ? `${remainingDays} day${remainingDays > 1 ? 's' : ''} left in course` : "Course complete"}
            </span>
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
        {medication.instructions && (
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <ClipboardList className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{medication.instructions}</span>
          </div>
        )}
        <div className="mt-auto pt-4">
           {medication.active !== false && !isCourseCompleted && <RefillPredictor medication={medication} />}
           {(medication.active === false || isCourseCompleted) && (
            <Button onClick={handleToggleActive} className="w-full" variant="outline" disabled={isCourseCompleted}>
              <Eye className="mr-2" /> Re-enable Medication
            </Button>
           )}
        </div>
      </CardContent>
    </Card>
  );
}
