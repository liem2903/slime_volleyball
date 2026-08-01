 import { string, z } from "zod";

export const SessionSchema = z.object({
    capacity: z.number().int().positive(),
    date: z.iso.date(),
    time_start: string(),
    time_end: string(),
    cost_cents: z.number().nonnegative(),
    host_email: z.email(),
    host_name: z.string().min(1),
    court_name: z.string().min(1)
});