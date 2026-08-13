import { z } from "zod";

export const ChangeStateSchema = z.object({
    state: z.enum(['locked', 'unlocked', 'completed', 'cancelled'])
});