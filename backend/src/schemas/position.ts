import { z } from "zod";

const PlayerPositionEnum = z.enum(['middle', 'oppo', 'outside', 'lib']);

export const SetPositionsSchema = z.object({
    primary_position: PlayerPositionEnum,
    secondary_position: PlayerPositionEnum,
}).refine(data => data.primary_position !== data.secondary_position, {
    message: "primary_position and secondary_position must be different",
});
