
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Medication } from '@/lib/types';
import { useEffect } from 'react';
import { format, parseISO } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { WithId } from '@/firebase';

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Medication name must be at least 2 characters.',
  }),
  quantity: z.coerce.number().min(0, {
    message: 'Quantity must be a positive number.',
  }),
  expiryDate: z.string().optional(),
  dose_times: z.array(z.any()).refine(
    (times) => times.every((time) => typeof time === 'string' && timeRegex.test(time)),
    {
      message: 'One or more times are in an invalid format (HH:MM)',
    }
  ),
  active: z.boolean().default(true),
  instructions: z.string().optional(),
  courseDuration: z.coerce.number().min(0).optional(),
  startDate: z.string().optional(),
  isOngoing: z.boolean().default(true),
});

type MedicationFormData = z.infer<typeof formSchema>;

type MedicationFormProps = {
  medication?: WithId<Medication>;
  onSubmit: (data: Partial<Medication>) => void;
  onClose: () => void;
};

export function MedicationForm({ medication, onSubmit, onClose }: MedicationFormProps) {
  const form = useForm<MedicationFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: medication?.name || '',
      quantity: medication?.quantity || 0,
      expiryDate: medication?.expiryDate || '',
      dose_times: medication?.dose_times && medication.dose_times.length > 0 ? medication.dose_times : ['09:00'],
      active: medication?.active ?? true,
      instructions: medication?.instructions || '',
      courseDuration: medication?.course?.durationDays,
      startDate: medication?.course?.startDate ? format(parseISO(medication.course.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      isOngoing: !medication?.course,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'dose_times',
  });

  const watchIsOngoing = form.watch('isOngoing');

  useEffect(() => {
    if (watchIsOngoing) {
        form.setValue('courseDuration', undefined);
        form.setValue('startDate', undefined);
    } else if (form.getValues('startDate') === undefined) {
        form.setValue('startDate', format(new Date(), 'yyyy-MM-dd'));
    }
  }, [watchIsOngoing, form]);


  function handleFormSubmit(values: MedicationFormData) {
    const output: Partial<Medication> = {
      ...values,
      id: medication?.id || '',
      dose_times: values.active ? values.dose_times : []
    };

    if (!values.isOngoing && values.courseDuration && values.courseDuration > 0 && values.startDate) {
      output.course = {
        durationDays: values.courseDuration,
        startDate: new Date(values.startDate).toISOString(),
      };
    } else {
      // Ensure course is removed if it's ongoing
      output.course = undefined;
    }
    
    // remove the temporary form-only fields
    delete (output as any).courseDuration; 
    delete (output as any).isOngoing;
    delete (output as any).startDate;

    onSubmit(output);
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

        <div className="space-y-4 rounded-lg border p-4">
             <h3 className="text-sm font-medium">Medication Course</h3>
            <FormField
                control={form.control}
                name="isOngoing"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>
                        Ongoing Medication (No End Date)
                        </FormLabel>
                        <FormDescription>
                           Select this for medications taken indefinitely.
                        </FormDescription>
                    </div>
                    </FormItem>
                )}
            />
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or
                    </span>
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="courseDuration"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Duration (days)</FormLabel>
                    <FormControl>
                        <Input 
                            type="number" 
                            placeholder="e.g. 7" 
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                            disabled={watchIsOngoing}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                        <Input 
                            type="date"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : e.target.value)}
                            disabled={watchIsOngoing}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
              />
            </div>
        </div>
        
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

        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dosage Instructions (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g. After Meal, Before Breakfast" {...field} />
              </FormControl>
              <FormMessage />
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
