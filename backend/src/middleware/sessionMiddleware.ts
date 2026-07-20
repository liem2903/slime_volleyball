import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export function validate (schema: z.ZodType) {
    return function(req: Request, res: Response, next: NextFunction) {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({errors: z.treeifyError(result.error)});
        }

        req.body = result.data;
        next()
    };
}