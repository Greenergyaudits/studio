'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, Timestamp, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import type { DiabeticReading } from '@/lib/types';
import { WithId } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, ArrowLeft, Trash2, LineChart, Calendar, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { format } from 'date-fns';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  LineChart as RechartsLineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  Legend,
} from 'recharts';
import { useRouter } from 'next/navigation';
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
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  glucoseLevel: z.coerce.number().min(0, "Invalid").max(1000, "Invalid"),
  readingType: z.enum(['fasting', 'post-meal', 'random']),
  timestamp: z.date().default(new Date()),
});

type FormData = z.infer<typeof formSchema>;

const chartConfig = {
  glucoseLevel: {
    label: 'Glucose (mg/dL)',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const diabeticCategories = [
    { label: "Normal (Fasting)", range: "70-99 mg/dL", color: "bg-green-500" },
    { label: "Normal (Post-Meal)", range: "< 140 mg/dL", color: "bg-green-500" },
    { label: "Elevated (Prediabetes)", range: "100-125 mg/dL (Fasting)", color: "bg-yellow-500" },
    { label: "High (Diabetes)", range: ">= 126 mg/dL (Fasting)", color: "bg-red-500" },
    { label: "Low (Hypoglycemia)", range: "< 70 mg/dL", color: "bg-blue-500" },
];

function DiabeticCategoriesInfoDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Standard Diabetic Reading Ranges</DialogTitle>
          <DialogDescription>
            These are general guidelines. Consult your healthcare provider for personalized advice.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {diabeticCategories.map(category => (
            <div key={category.label} className="flex items-center gap-4">
              <span className={cn("h-4 w-4 rounded-full", category.color)}></span>
              <div>
                <p className="font-semibold">{category.label}</p>
                <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: category.range }}></p>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
           <DialogClose asChild>
             <Button>Close</Button>
           </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function AddReadingDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      glucoseLevel: 100,
      readingType: 'fasting',
      timestamp: new Date(),
    },
  });

  const handleAddReading = async (values: FormData) => {
    if (!user) return;
    const readingRef = collection(firestore, 'users', user.uid, 'diabeticReadings');
    await addDoc(readingRef, {
      ...values,
      userId: user.uid,
      timestamp: Timestamp.fromDate(values.timestamp),
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <>
      <DiabeticCategoriesInfoDialog open={isInfoOpen} onOpenChange={setIsInfoOpen} />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Glucose Reading</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddReading)} className="space-y-6">
              <FormField
                control={form.control}
                name="glucoseLevel"
                render={({ field }) => (
                  <FormItem className="text-center">
                     <div className="flex items-center justify-center gap-2">
                        <FormLabel>Glucose Level (mg/dL)</FormLabel>
                        <Button variant="ghost" size="icon" type="button" className="h-6 w-6 text-muted-foreground" onClick={() => setIsInfoOpen(true)}>
                            <Info className="h-5 w-5" />
                        </Button>
                    </div>
                    <FormControl>
                      <Input
                        type="number"
                        className="text-center text-3xl h-20 font-bold"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="readingType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Reading Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="fasting" />
                          </FormControl>
                          <FormLabel className="font-normal">Fasting</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="post-meal" />
                          </FormControl>
                          <FormLabel className="font-normal">Post-Meal</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="random" />
                          </FormControl>
                          <FormLabel className="font-normal">Random</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timestamp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date & Time</FormLabel>
                    <FormControl>
                      <Button variant="outline" type="button" className="w-full justify-start text-left font-normal">
                          <Calendar className="mr-2 h-4 w-4" />
                          {format(field.value, "PPP HH:mm")}
                      </Button>
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Save Reading</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function DiabeticPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const diabeticQuery = useMemoFirebase(
    () =>
      user
        ? query(collection(firestore, 'users', user.uid, 'diabeticReadings'), orderBy('timestamp', 'desc'))
        : null,
    [user, firestore]
  );
  const { data: readings, isLoading } = useCollection<DiabeticReading>(diabeticQuery);

  const handleDeleteReading = async (readingId: string) => {
    if (!user) return;
    await deleteDoc(doc(firestore, 'users', user.uid, 'diabeticReadings', readingId));
  }
  
  const chartData = useMemo(() => {
    if (!readings) return [];
    const sortedReadings = [...readings].map(r => ({
      ...r,
      timestamp: (r.timestamp as any).toDate ? (r.timestamp as any).toDate() : new Date(r.timestamp),
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
    return sortedReadings.map(r => ({
      ...r,
      date: format(r.timestamp, 'MMM d, HH:mm'),
    }));
  }, [readings]);


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AddReadingDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
            <Button size="icon" variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
              Diabetic Manager
            </h1>
            <div className="relative ml-auto flex-1 md:grow-0">
                <Button onClick={() => setIsAddOpen(true)} className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add Reading
                </Button>
            </div>
      </header>
       <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Trends</CardTitle>
                       <LineChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         {isLoading ? (
                           <div className="flex h-[350px] w-full items-center justify-center">
                             <Loader2 className="h-8 w-8 animate-spin text-primary" />
                           </div>
                         ) : chartData && chartData.length > 1 ? (
                           <div className="h-[350px]">
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <RechartsLineChart
                                data={chartData}
                                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                                >
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => value.slice(0, 6)}
                                />
                                 <YAxis domain={['dataMin - 20', 'dataMax + 20']} hide />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                 <Legend />
                                <Line
                                    dataKey="glucoseLevel"
                                    type="monotone"
                                    stroke="var(--color-glucoseLevel)"
                                    strokeWidth={2}
                                    dot={{ fill: "var(--color-glucoseLevel)" }}
                                    activeDot={{ r: 6 }}
                                />
                                </RechartsLineChart>
                            </ChartContainer>
                           </div>
                        ) : (
                           <div className="flex h-[350px] w-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                                <LineChart className="h-12 w-12" />
                                <p className="font-semibold">Not enough data to show a trend.</p>
                                <p className="text-sm">Add at least two readings to see your chart.</p>
                           </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                    <CardTitle>History</CardTitle>
                    </CardHeader>
                    <CardContent>
                    {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                            <p className="mt-2">Loading readings...</p>
                        </div>
                    ) : readings && readings.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Glucose (mg/dL)</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {chartData.map((r: WithId<DiabeticReading>) => (
                                <TableRow key={r.id}>
                                    <TableCell>{format(r.timestamp, 'MMM d, yyyy')}</TableCell>
                                    <TableCell>{format(r.timestamp, 'HH:mm')}</TableCell>
                                    <TableCell className="capitalize">{r.readingType.replace('-',' ')}</TableCell>
                                    <TableCell className="text-right font-medium">{r.glucoseLevel}</TableCell>
                                    <TableCell>
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
                                                This action cannot be undone. This will permanently delete this reading.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteReading(r.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No glucose readings recorded yet.</p>
                        </div>
                    )}
                    </CardContent>
                </Card>
            </div>
      </main>
    </div>
  );
}
