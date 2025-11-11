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

export type Subscription = {
  id: string;
  subscriptionType: 'Basic' | 'Premium';
  maxMedicines: number;
  bloodPressureManager: boolean;
  diabeticManager: boolean;
};

export type BloodPressureReading = {
  id: string;
  userId: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  timestamp: string; // ISO 8601
  arm?: 'left' | 'right';
  position?: 'sitting' | 'laying' | 'standing';
  conditions?: {
    meal?: 'before' | 'after';
    medicine?: 'before' | 'after';
    activity?: 'before' | 'after';
  };
};

export type DiabeticReading = {
  id: string;
  userId: string;
  glucoseLevel: number;
  readingType: 'fasting' | 'post-meal' | 'random';
  timestamp: string; // ISO 8601
};

    