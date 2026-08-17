import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { AppError, UnauthorisedRequest } from "../errorHandling/error";
import { generateSHA256 } from "../utility/helper";
import { checkIsAdmin } from '../data/sessionRepository';

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
    console.error(err.message);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({message: err.message});
    }        

    if (err instanceof ZodError) {
        return res.status(400).json({message: `Zod error ${err.message}`});
    }

    return res.status(500).json({message: 'Internal server error'});
}

export async function check_is_admin(req: Request, res: Response, next: NextFunction) {
    const { sessionId, adminId } = req.params;
    const decodedAdminId = generateSHA256(adminId);

    if (!(await checkIsAdmin(sessionId, decodedAdminId))) {
        return next(new UnauthorisedRequest());
    }

    req.params = {sessionId};
    next();
}