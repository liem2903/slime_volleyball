import { z } from "zod";

export const PlayerSchema = z.object({
    name: z.string().min(1),
    email: z.email(),
    session_id: z.string().min(1),
});