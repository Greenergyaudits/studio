export type Medication = {
  id: number;
  name: string;
  quantity: number;
  dose_times: string[];
  expiryDate?: string;
  active?: boolean;
};
