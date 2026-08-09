export class AppError extends Error {
    constructor(message: string, public readonly statusCode: number, public readonly type?: unknown) {
        super(message);
    }
}

export class NotFoundError extends AppError {
    constructor() {
        super("Session ID does not exist", 404);
    }
}

export class InvalidParametersError extends AppError {
    constructor() {
        super("Parameters don't exist", 400);
    }
}

export class ConflictError extends AppError {
    constructor(message: string, type: any) {
        super(message, 409, type)
    }
}

export class BadRequestError extends AppError {
    constructor(message: string, type: any) {
        super(message, 400, type)
    }
}

export class UnauthorisedRequest extends AppError {
    constructor() {
        super("User does not have authority to perform request", 401);
    }
}