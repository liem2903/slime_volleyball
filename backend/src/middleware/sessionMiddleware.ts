import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError } from "../error";

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

export function error_handler(err: AppError,  req: Request, res: Response, next: NextFunction) {
    // Replace with my logger after when I learn about it.
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({message: err.message});
    }        
}