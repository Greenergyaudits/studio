'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, Timestamp, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import type { BloodPressureReading } from '@/lib/types';
import { WithId } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useForm, Controller } from 'react-hook-form';
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
import { Loader2, Plus, ArrowLeft, Trash2, LineChart, Calendar, Info, X } from 'lucide-react';
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
import { NumberCarousel, NumberCarouselContent } from '@/components/ui/number-carousel';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  systolic: z.coerce.number().min(50).max(300),
  diastolic: z.coerce.number().min(30).max(200),
  pulse: z.coerce.number().min(30).max(250),
  description: z.string().optional(),
  timestamp: z.date().default(new Date()),
});

type FormData = z.infer<typeof formSchema>;

const chartConfig = {
  systolic: {
    label: 'Systolic',
    color: 'hsl(var(--chart-1))',
  },
  diastolic: {
    label: 'Diastolic',
    color: 'hsl(var(--chart-2))',
  },
   pulse: {
    label: 'Pulse',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

const bpCategories = {
    HYPOTENSION: { label: "Hypotension", color: "bg-blue-500", range: "SYS < 90 or DIA < 60" },
    NORMAL: { label: "Normal", color: "bg-green-500", range: "SYS 90-119 or DIA 60-79" },
    ELEVATED: { label: "Elevated", color: "bg-yellow-500", range: "SYS 120-129 or DIA 80-89" },
    HYPERTENSION_1: { label: "Hypertension - Stage 1", color: "bg-orange-500", range: "SYS 130-139 or DIA 80-89" },
    HYPERTENSION_2: { label: "Hypertension - Stage 2", color: "bg-red-500", range: "SYS 140-180 or DIA 90-120" },
    HYPERTENSIVE_CRISIS: { label: "Hypertensive", color: "bg-red-700", range: "SYS > 180 or DIA > 120" },
};

const getBpCategory = (systolic: number, diastolic: number) => {
    if (systolic < 90 || diastolic < 60) return bpCategories.HYPOTENSION;
    if (systolic <= 119 && diastolic <= 79) return bpCategories.NORMAL;
    if (systolic <= 129 && diastolic <= 89) return bpCategories.ELEVATED;
    if (systolic <= 139 || diastolic <= 89) return bpCategories.HYPERTENSION_1;
    if (systolic <= 180 || diastolic <= 120) return bpCategories.HYPERTENSION_2;
    return bpCategories.HYPERTENSIVE_CRISIS;
}


function CategoriesInfoSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
          <Info className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-lg">
        <SheetHeader className="text-center">
          <SheetTitle>Categories</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-4">
          {Object.values(bpCategories).map(category => (
            <div key={category.label} className="flex items-center gap-4">
              <span className={cn("h-6 w-6 rounded-full", category.color)}></span>
              <div>
                <p className="font-semibold">{category.label}</p>
                <p className="text-sm text-muted-foreground">{category.range}</p>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}


function AddReadingDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      systolic: 120,
      diastolic: 80,
      pulse: 70,
      description: "",
      timestamp: new Date(),
    },
  });

  const { systolic, diastolic } = form.watch();
  const bpCategory = getBpCategory(systolic, diastolic);

  const handleAddReading = async (values: FormData) => {
    if (!user) return;
    const readingRef = collection(firestore, 'users', user.uid, 'bloodPressureReadings');
    await addDoc(readingRef, {
      ...values,
      userId: user.uid,
      timestamp: values.timestamp.getTime().toString(),
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAddReading)}>
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>Blood Pressure</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Add description" className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timestamp"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Button variant="outline" type="button" className="w-full justify-start text-left font-normal">
                          <Calendar className="mr-2 h-4 w-4" />
                          {format(field.value, "PPP HH:mm")}
                      </Button>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className={cn("p-4 rounded-lg flex items-center gap-4", bpCategory.color.replace('bg-', 'bg-opacity-10 dark:bg-opacity-20 border border-'))}>
                <span className={cn("h-3 w-3 rounded-full", bpCategory.color)}></span>
                <div className="flex-1">
                  <p className="font-semibold">{bpCategory.label}</p>
                  <p className="text-sm text-muted-foreground">{bpCategory.range}</p>
                </div>
                 <CategoriesInfoSheet />
              </div>

              <div className="flex justify-between items-start pt-4">
                <div className="flex flex-col items-center gap-2">
                  <FormLabel>Systolic</FormLabel>
                  <span className="text-sm text-muted-foreground">mm Hg</span>
                   <Controller
                    control={form.control}
                    name="systolic"
                    render={({ field }) => (
                        <NumberCarousel value={field.value} setValue={field.onChange} range={[50, 300]} />
                    )}
                   />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <FormLabel>Diastolic</FormLabel>
                  <span className="text-sm text-muted-foreground">mm Hg</span>
                   <Controller
                    control={form.control}
                    name="diastolic"
                    render={({ field }) => (
                        <NumberCarousel value={field.value} setValue={field.onChange} range={[30, 200]} />
                    )}
                   />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <FormLabel>Pulse</FormLabel>
                   <span className="text-sm text-muted-foreground">BPM</span>
                   <Controller
                    control={form.control}
                    name="pulse"
                    render={({ field }) => (
                        <NumberCarousel value={field.value} setValue={field.onChange} range={[30, 250]} />
                    )}
                   />
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Add details</h4>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" type="button" size="sm"><Plus className="h-4 w-4 mr-1"/> Arm</Button>
                    <Button variant="outline" type="button" size="sm"><Plus className="h-4 w-4 mr-1"/> Position</Button>
                    <Button variant="outline" type="button" size="sm"><Plus className="h-4 w-4 mr-1"/> Conditions</Button>
                </div>
              </div>
            </div>
            <DialogFooter className="p-6 bg-muted/40">
              <Button type="submit" className="w-full">Done</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function BloodPressurePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const bpQuery = useMemoFirebase(
    () =>
      user
        ? query(collection(firestore, 'users', user.uid, 'bloodPressureReadings'), orderBy('timestamp', 'desc'))
        : null,
    [user, firestore]
  );
  const { data: readings, isLoading } = useCollection<BloodPressureReading>(bpQuery);

  const handleDeleteReading = async (readingId: string) => {
    if (!user) return;
    await deleteDoc(doc(firestore, 'users', user.uid, 'bloodPressureReadings', readingId));
  }
  
  const chartData = useMemo(() => {
    return (readings || [])
        .map(r => ({ ...r, timestamp: parseInt(r.timestamp, 10)}))
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(r => ({
            ...r,
            date: format(new Date(r.timestamp), 'MMM d, HH:mm'),
        }));
  }, [readings]);


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AddReadingDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
            <Button size="icon" variant="outline" className="sm:hidden" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
              Blood Pressure Manager
            </h1>
            <div className="relative ml-auto flex-1 md:grow-0">
                <Button onClick={() => setIsAddOpen(true)} className="w-full">
                    <Plus className="mr-2" /> Add Reading
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
                         ) : readings && readings.length > 1 ? (
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
                                 <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                 <Legend />
                                <Line
                                    dataKey="systolic"
                                    type="monotone"
                                    stroke="var(--color-systolic)"
                                    strokeWidth={2}
                                    dot={{ fill: "var(--color-systolic)" }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    dataKey="diastolic"
                                    type="monotone"
                                    stroke="var(--color-diastolic)"
                                    strokeWidth={2}
                                    dot={{ fill: "var(--color-diastolic)" }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    dataKey="pulse"
                                    type="monotone"
                                    stroke="var(--color-pulse)"
                                    strokeWidth={2}
                                    dot={{ fill: "var(--color-pulse)" }}
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
                                <TableHead className="text-right">Systolic</TableHead>
                                <TableHead className="text-right">Diastolic</TableHead>
                                <TableHead className="text-right">Pulse</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {readings.map((r: WithId<BloodPressureReading>) => (
                                <TableRow key={r.id}>
                                    <TableCell>{format(new Date(parseInt(r.timestamp, 10)), 'MMM d, yyyy')}</TableCell>
                                    <TableCell>{format(new Date(parseInt(r.timestamp, 10)), 'HH:mm')}</TableCell>
                                    <TableCell className="text-right font-medium">{r.systolic}</TableCell>
                                    <TableCell className="text-right font-medium">{r.diastolic}</TableCell>
                                    <TableCell className="text-right font-medium">{r.pulse}</TableCell>
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
                            <p>No blood pressure readings recorded yet.</p>
                        </div>
                    )}
                    </CardContent>
                </Card>
            </div>
      </main>
    </div>
  );
}

    