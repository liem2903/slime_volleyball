import { z } from "zod";

export const SessionSchema = z.object({
    capacity: z.number().int().positive(),
    date: z.iso.date(),
    startTime: z.iso.time(),
    endTime: z.iso.time(),
    price: z.number().nonnegative(),
    email: z.email(),
    username: z.string().min(1),
    courtName: z.string().optional()
});

