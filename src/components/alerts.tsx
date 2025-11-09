"use client";

import { useState, useEffect } from 'react';
import type { Medication } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Bell, Info } from 'lucide-react';

type AlertsProps = {
  medications: Medication[];
};

export function Alerts({ medications }: AlertsProps) {
  const [currentTime, setCurrentTime] = useState<string | null>(null);

  useEffect(() => {
    const updateCurrentTime = () => {
      // Format to HH:MM using en-GB which provides 24-hour format
      setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    };

    updateCurrentTime(); // Set time immediately on mount
    const intervalId = setInterval(updateCurrentTime, 1000 * 30); // Check every 30 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  // Don't render anything until the client has determined the time
  if (currentTime === null) {
    return null;
  }

  const activeMedications = medications.filter(m => m.active !== false);
  const lowStockAlerts = activeMedications.filter(m => m.quantity < 5);
  const doseTimeAlerts = activeMedications.filter(m => m.dose_times.includes(currentTime));

  if (lowStockAlerts.length === 0 && doseTimeAlerts.length === 0) {
    return (
        <Alert className="border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/30">
            <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-300">All Clear!</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              You have no new alerts. Your medications are stocked and you're on schedule.
            </AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {doseTimeAlerts.map(med => (
        <Alert key={`dose-${med.id}`} className="bg-accent/80 border-accent animate-pulse">
          <Bell className="h-4 w-4 text-accent-foreground" />
          <AlertTitle className="text-accent-foreground">Dosage Reminder</AlertTitle>
          <AlertDescription className="text-accent-foreground/90">It's time to take your {med.name}.</AlertDescription>
        </Alert>
      ))}
      {lowStockAlerts.map(med => (
        <Alert key={`stock-${med.id}`} variant="destructive" className="animate-pulse">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Low Stock Warning</AlertTitle>
          <AlertDescription>
            You are running low on {med.name}. Only {med.quantity} dose{med.quantity > 1 ? 's' : ''} left.
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
