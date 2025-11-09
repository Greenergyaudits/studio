'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Phone, User, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

export type EmergencyContactDetails = {
  name: string;
  phone: string;
};

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  phone: z.string().regex(phoneRegex, 'Invalid phone number format.'),
});

export function EmergencyContact() {
  const [contact, setContact] = useState<EmergencyContactDetails | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const storedContact = localStorage.getItem('emergencyContact');
    if (storedContact) {
      setContact(JSON.parse(storedContact));
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (isClient && contact) {
      form.reset(contact);
    } else {
        form.reset({ name: '', phone: '' });
    }
  }, [contact, form, isClient]);

  const handleSaveContact = (values: z.infer<typeof formSchema>) => {
    localStorage.setItem('emergencyContact', JSON.stringify(values));
    setContact(values);
    setIsOpen(false);
    toast({
      title: 'Contact Saved',
      description: 'Emergency contact has been updated.',
    });
    // Dispatch a storage event to notify other components of the change
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Users className="mr-2" />
          {isClient && contact ? 'Edit Emergency Contact' : 'Set Emergency Contact'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Emergency Contact</DialogTitle>
          <DialogDescription>
            Set a contact to quickly notify via WhatsApp when medication is low.
          </DialogDescription>
        </DialogHeader>
        {!isClient ? (
           <div className="space-y-4">
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
           </div>
        ) : (
          <form onSubmit={form.handleSubmit(handleSaveContact)} className="space-y-4 pt-4">
             <div>
                <Label htmlFor="name">Name</Label>
                <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="name"
                        {...form.register('name')}
                        placeholder="e.g., Jane Doe"
                        className="pl-10"
                    />
                </div>
                {form.formState.errors.name && (
                    <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.name.message}</p>
                )}
             </div>
             <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="phone"
                        {...form.register('phone')}
                        placeholder="Enter phone number (with country code)"
                        className="pl-10"
                    />
                </div>
                {form.formState.errors.phone && (
                    <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.phone.message}</p>
                )}
             </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
