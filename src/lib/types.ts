export type Medication = {
  id: number;
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
};
