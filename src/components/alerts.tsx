'use client';

import { useState, useEffect, useRef } from 'react';
import type { Medication } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Bell, Info, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { EmergencyContactDetails } from './emergency-contact';

type AlertsProps = {
  medications: Medication[];
};

export function Alerts({ medications }: AlertsProps) {
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContactDetails | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Client-side only
    const storedContact = localStorage.getItem('emergencyContact');
    if (storedContact) {
      setEmergencyContact(JSON.parse(storedContact));
    }

    const updateCurrentTime = () => {
      // Format to HH:MM using en-GB which provides 24-hour format
      setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    };

    updateCurrentTime(); // Set time immediately on mount
    const intervalId = setInterval(updateCurrentTime, 1000 * 30); // Check every 30 seconds

    // Listen for storage changes to update contact
    const handleStorageChange = () => {
      const updatedContact = localStorage.getItem('emergencyContact');
      setEmergencyContact(updatedContact ? JSON.parse(updatedContact) : null);
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(intervalId); // Cleanup on unmount
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const doseTimeAlerts = medications.filter((m) => currentTime && m.dose_times.includes(currentTime));

  useEffect(() => {
    if (doseTimeAlerts.length > 0 && audioRef.current) {
      audioRef.current.play().catch((error) => console.log('Audio play was prevented.', error));
    }
  }, [doseTimeAlerts, currentTime]);

  // Don't render anything until the client has determined the time
  if (currentTime === null) {
    return null;
  }

  const handleWhatsAppNotify = (med: Medication) => {
    if (!emergencyContact || !emergencyContact.phone) {
      toast({
        variant: 'destructive',
        title: 'No Emergency Contact',
        description: 'Please set an emergency contact name and number first.',
      });
      return;
    }
    const message = encodeURIComponent(
      `Hi ${emergencyContact.name}, this is a reminder that I am running low on my medication: ${med.name}. There are only ${med.quantity} doses left.`
    );
    const whatsappUrl = `https://wa.me/${emergencyContact.phone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const lowStockAlerts = medications.filter((m) => m.quantity < 5);

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
      <audio ref={audioRef} src="https://firebasestudio-assets.b-cdn.net/sounds/notification.mp3" preload="auto" />
      {doseTimeAlerts.map((med) => (
        <Alert key={`dose-${med.id}`} className="bg-accent/80 border-accent animate-pulse">
          <Bell className="h-4 w-4 text-accent-foreground" />
          <AlertTitle className="text-accent-foreground">Dosage Reminder</AlertTitle>
          <AlertDescription className="text-accent-foreground/90">
            It's time to take your {med.name}.
          </AlertDescription>
        </Alert>
      ))}
      {lowStockAlerts.map((med) => (
        <Alert key={`stock-${med.id}`} variant="destructive" className="animate-pulse">
          <div className="flex flex-col gap-2">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Low Stock Warning</AlertTitle>
              </div>
              <AlertDescription>
                You are running low on {med.name}. Only {med.quantity} dose{med.quantity > 1 ? 's' : ''} left.
              </AlertDescription>
            </div>
            {emergencyContact && (
              <Button
                size="sm"
                onClick={() => handleWhatsAppNotify(med)}
                className="bg-white/20 hover:bg-white/30 text-white w-full sm:w-auto"
              >
                <MessageSquare className="mr-2" /> Notify {emergencyContact.name} via WhatsApp
              </Button>
            )}
          </div>
        </Alert>
      ))}
    </div>
  );
}
