import { z } from "zod";

export const ChangeCapacitySchema = z.object({
    capacity: z.number().int().positive()
});
