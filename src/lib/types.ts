export type Medication = {
  id: string; // Changed to string for Firestore
  name: string;
  quantity: number;
  dose_times: string[];
  expiryDate?: string;
  active?: boolean;
  instructions?: string;
  course?: {
    durationDays: number;
    startDate: string; // ISO 8601 date string
  };
  userId: string;
};
