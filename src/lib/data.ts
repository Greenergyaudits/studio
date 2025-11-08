import type { Medication } from '@/lib/types';

export const medicines: Medication[] = [
  { id: 1, name: "Paracetamol", quantity: 50, dose_times: ["08:00", "20:00"] },
  { id: 2, name: "Ibuprofen", quantity: 4, dose_times: ["12:00"] },
  { id: 3, name: "Lisinopril", quantity: 25, dose_times: ["09:00"] },
  { id: 4, name: "Metformin", quantity: 100, dose_times: ["08:00", "20:00"] },
  { id: 5, name: "Atorvastatin", quantity: 12, dose_times: ["21:00"] },
  { id: 6, name: "Amoxicillin", quantity: 2, dose_times: ["07:00", "15:00", "23:00"] },
];
