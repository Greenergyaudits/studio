'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Edit, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const formSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Invalid phone number format.'),
});

export function EmergencyContact() {
  const [contact, setContact] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const storedContact = localStorage.getItem('emergencyContact');
    if (storedContact) {
      setContact(storedContact);
    } else {
      setIsEditing(true);
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: '',
    },
  });

  useEffect(() => {
    if (isClient) {
      form.reset({ phone: contact || '' });
    }
  }, [contact, form, isClient]);

  const handleSaveContact = (values: z.infer<typeof formSchema>) => {
    localStorage.setItem('emergencyContact', values.phone);
    setContact(values.phone);
    setIsEditing(false);
    toast({
      title: 'Contact Saved',
      description: 'Emergency contact has been updated.',
    });
    window.dispatchEvent(new Event('storage'));
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency Contact</CardTitle>
        <CardDescription>
          Set a number to quickly notify someone via WhatsApp when your medication is low.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isClient ? (
          <div className="flex items-center justify-between">
             <Skeleton className="h-8 w-48" />
             <Skeleton className="h-10 w-10" />
          </div>
        ) : isEditing ? (
          <form onSubmit={form.handleSubmit(handleSaveContact)} className="flex items-center gap-2">
            <div className="relative flex-grow">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...form.register('phone')}
                placeholder="Enter phone number (with country code)"
                className="pl-10"
              />
            </div>
            <Button type="submit" size="icon">
              <Save className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <span className="font-mono text-lg">{contact}</span>
            </div>
            <Button onClick={() => setIsEditing(true)} variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )}
        {form.formState.errors.phone && (
          <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.phone.message}</p>
        )}
      </CardContent>
    </Card>
  );
}
