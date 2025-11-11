'use client';

import { useState, useMemo } from 'react';
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
import { Loader2, Plus, ArrowLeft, Trash2, LineChart } from 'lucide-react';
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


const formSchema = z.object({
  systolic: z.coerce.number().min(50, 'Invalid value').max(300, 'Invalid value'),
  diastolic: z.coerce.number().min(30, 'Invalid value').max(200, 'Invalid value'),
  pulse: z.coerce.number().min(30, 'Invalid value').max(250, 'Invalid value'),
});

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      systolic: 120,
      diastolic: 80,
      pulse: 70,
    },
  });

  const handleAddReading = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    const readingRef = collection(firestore, 'users', user.uid, 'bloodPressureReadings');
    await addDoc(readingRef, {
      ...values,
      userId: user.uid,
      timestamp: Timestamp.now().toMillis().toString(),
    });
    setIsAddOpen(false);
    form.reset();
  };

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
                                    yAxisId="pulse"
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
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Blood Pressure Reading</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddReading)} className="space-y-4">
              <FormField
                control={form.control}
                name="systolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Systolic (SYS)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diastolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diastolic (DIA)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pulse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pulse</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
