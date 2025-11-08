import type { Medication } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Package, Pill } from 'lucide-react';
import { RefillPredictor } from './refill-predictor';
import { Badge } from '@/components/ui/badge';

type MedicationCardProps = {
  medication: Medication;
};

export function MedicationCard({ medication }: MedicationCardProps) {
  return (
    <Card className="flex flex-col transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Pill className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl">{medication.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col gap-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Package className="h-5 w-5" />
          <span>Quantity: {medication.quantity}</span>
        </div>
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
