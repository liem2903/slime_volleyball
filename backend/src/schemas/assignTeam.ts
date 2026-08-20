import { z } from "zod";

export const AssignTeamSchema = z.object({
    team_id: z.string().trim().min(1),
});
