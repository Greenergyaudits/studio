"use server";

import { predictRefillSchedule } from '@/ai/flows/automatic-refill-requests';
import type { Medication } from '@/lib/types';
import { z } from 'zod';

// This schema is for safety, but the AI flow should already return the correct type.
const PredictRefillScheduleOutputSchema = z.object({
  refillDate: z.string(),
  recommendation: z.string(),
});

export async function getRefillPrediction(medication: Medication) {
  try {
    const aiOutput = await predictRefillSchedule({
      medicationName: medication.name,
      currentQuantity: medication.quantity,
      doseTimes: medication.dose_times,
    });
    
    // The AI flow is configured to return JSON.
    // If output is string, parse it. If it's object, just use it.
    const resultData = typeof aiOutput === 'string' ? JSON.parse(aiOutput) : aiOutput;

    // Validate for extra safety
    const validation = PredictRefillScheduleOutputSchema.safeParse(resultData);
    if (!validation.success) {
      console.error("AI output validation error:", validation.error.flatten());
      return { success: false, error: "AI returned data in an unexpected format." };
    }
    
    return { success: true, data: validation.data };

  } catch (error) {
    console.error("AI Refill Prediction Error:", error);
    return { success: false, error: "Failed to get refill prediction from AI." };
  }
}
