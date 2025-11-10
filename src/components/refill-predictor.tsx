"use client";

import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { getRefillPrediction } from '@/app/actions';
import type { Medication } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';
import React, { useEffect } from 'react';
import { WithId } from '@/firebase';

type RefillPredictorProps = {
  medication: WithId<Medication>;
};

type Prediction = {
  refillDate: string;
  recommendation: string;
};

export function RefillPredictor({ medication }: RefillPredictorProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePredict = async () => {
    setIsLoading(true);
    // The action expects a plain Medication object, not WithId
    const { id, ...medData } = medication;
    const result = await getRefillPrediction(medData as Medication);
    if (result.success) {
      setPrediction(result.data);
    } else {
      // Don't show an error, just log it for debugging.
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    handlePredict();
  }, [medication.id, medication.quantity, medication.dose_times]);


  const handleRefillRequest = () => {
    // In a real app, this would trigger an API call to a pharmacy
    toast({
      title: "Refill Requested",
      description: `A refill request for ${medication.name} has been sent.`,
      className: 'bg-accent border-accent-foreground/20 text-accent-foreground',
    });
    setPrediction(null); // Dismiss the prediction card after action
  };

  return (
    <div className="space-y-4">
      {isLoading && (
        <Button disabled className="w-full">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          AI is analyzing...
        </Button>
      )}

      {prediction && (
        <Card className="border-primary/50 bg-primary/10">
          <CardContent className="p-4 space-y-3">
             <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h4 className="font-headline text-base font-semibold text-primary">AI Refill Suggestion</h4>
            </div>
            <p className="text-sm text-foreground/90">
              <span className="font-semibold">Suggested Refill Date:</span> {prediction.refillDate}
            </p>
            <p className="text-sm text-muted-foreground">{prediction.recommendation}</p>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button onClick={handleRefillRequest} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                    <CheckCircle className="mr-2 h-4 w-4" /> Request Refill
                </Button>
                <Button onClick={() => setPrediction(null)} variant="ghost" className="flex-1">
                    Dismiss
                </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
