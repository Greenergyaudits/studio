"use client";

import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { getRefillPrediction } from '@/app/actions';
import type { Medication } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, Sparkles } from 'lucide-react';

type RefillPredictorProps = {
  medication: Medication;
};

type Prediction = {
  refillDate: string;
  recommendation: string;
};

export function RefillPredictor({ medication }: RefillPredictorProps) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePredict = async () => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    const result = await getRefillPrediction(medication);
    if (result.success) {
      setPrediction(result.data);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };

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
      {!prediction && !isLoading && !error && (
        <Button onClick={handlePredict} className="w-full" variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          Check Refill Status with AI
        </Button>
      )}

      {isLoading && (
        <Button disabled className="w-full">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          AI is analyzing...
        </Button>
      )}

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
            </div>
            <Button onClick={handlePredict} variant="destructive" size="sm" className="mt-3">Try Again</Button>
          </CardContent>
        </Card>
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
