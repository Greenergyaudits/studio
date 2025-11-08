'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Medication } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Medication name must be at least 2 characters.',
  }),
  quantity: z.coerce.number().min(0, {
    message: 'Quantity must be a positive number.',
  }),
  expiryDate: z.string().optional(),
  dose_times: z.array(
    z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
  ).min(0),
  active: z.boolean().default(true),
});

type MedicationFormProps = {
  medication?: Medication;
  onSubmit: (data: Medication) => void;
  onClose: () => void;
};

export function MedicationForm({ medication, onSubmit, onClose }: MedicationFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: medication?.name || '',
      quantity: medication?.quantity || 0,
      expiryDate: medication?.expiryDate || '',
      dose_times: medication?.dose_times && medication.dose_times.length > 0 ? medication.dose_times : ['09:00'],
      active: medication?.active ?? true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'dose_times',
  });

  function handleFormSubmit(values: z.infer<typeof formSchema>) {
    onSubmit({
      ...values,
      id: medication?.id || 0,
      dose_times: values.active ? values.dose_times : []
    });
  }

  const isActive = form.watch('active');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medication Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Paracetamol" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase Quantity</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g. 50" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expiryDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiry Date (Optional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Enabled</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {isActive && (
            <div>
            <FormLabel>Dose Times</FormLabel>
            <div className="mt-2 space-y-2">
                {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                    <FormField
                    control={form.control}
                    name={`dose_times.${index}`}
                    render={({ field }) => (
                        <FormItem className="flex-grow">
                        <FormControl>
                            <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                ))}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append('09:00')}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Dose Time
                </Button>
            </div>
            {form.formState.errors.dose_times && (
                 <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.dose_times.message}</p>
            )}
            </div>
        )}

        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  );
}
