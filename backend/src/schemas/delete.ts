import { z } from "zod";

export const DeletePlayerSchema = z.object({
    playerId: z.string().min(1),
    sessionId: z.string().min(1),
});