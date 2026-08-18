import { z } from "zod";

const TeamInputSchema = z.object({
    name: z.string().trim().min(1).max(255),
    color: z.string().trim().min(1).max(255).optional(),
});

export const MoveToTeamsSchema = z.object({
    teams: z.array(TeamInputSchema).min(2)
}).refine(
    data => new Set(data.teams.map(t => t.name)).size === data.teams.length,
    { message: "Team names must be unique within a session", path: ["teams"] }
);
