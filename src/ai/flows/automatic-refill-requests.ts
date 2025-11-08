'use server';

/**
 * @fileOverview An AI agent that predicts medication refill schedules.
 *   Extends the existing implementation to use a Genkit prompt for more dynamic recommendations.
 *   This version prioritizes LLM to make recommendation.
 * - predictRefillSchedule - Predicts the refill schedule for a medication.
 * - PredictRefillScheduleInput - The input type for the predictRefillSchedule function.
 * - PredictRefillScheduleOutput - The return type for the predictRefillSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const PredictRefillScheduleInputSchema = z.object({
  medicationName: z.string().describe('The name of the medication.'),
  currentQuantity: z.number().describe('The current quantity of the medication.'),
  doseTimes: z
    .array(z.string())
    .describe('The times of day the medication is taken (e.g., ["08:00", "20:00"]).'),
});
export type PredictRefillScheduleInput = z.infer<typeof PredictRefillScheduleInputSchema>;

const PredictRefillScheduleOutputSchema = z.object({
    refillDate: z.string().describe("The suggested date to refill the medication."),
    recommendation: z.string().describe("A short recommendation or justification for the suggested refill date."),
});
export type PredictRefillScheduleOutput = z.infer<typeof PredictRefillScheduleOutputSchema>;

const refillPredictionPrompt = ai.definePrompt({
    name: 'refillPredictionPrompt',
    input: { schema: PredictRefillScheduleInputSchema },
    output: { schema: PredictRefillScheduleOutputSchema },
    prompt: `Based on the current medication quantity of {{currentQuantity}} for {{medicationName}} and its dosing schedule ({{doseTimes}}), calculate the date when the medication will run out. Suggest a refill date that is a few days before it runs out. Provide a brief recommendation. Today's date is ${new Date().toDateString()}.`,
});

const predictRefillScheduleFlow = ai.defineFlow(
  {
    name: 'predictRefillScheduleFlow',
    inputSchema: PredictRefillScheduleInputSchema,
    outputSchema: PredictRefillScheduleOutputSchema,
  },
  async (input) => {
    const { output } = await refillPredictionPrompt(input);
    return output!;
  }
);

export async function predictRefillSchedule(input: PredictRefillScheduleInput): Promise<PredictRefillScheduleOutput> {
    return predictRefillScheduleFlow(input);
}
