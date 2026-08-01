import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { AppError } from "../errorHandling/error";

export function validate (schema: z.ZodType) {
    return function(req: Request, res: Response, next: NextFunction) {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({errors: z.prettifyError(result.error)});
        }

        req.body = result.data;
        next()
    };
}

export function error_handler(err: Error,  req: Request, res: Response, next: NextFunction) {
    console.log(err.message);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({message: err.message});
    }        

    if (err instanceof ZodError) {
        return res.status(400).json({message: `Zod error ${err.message}`});
    }

    return err;
}