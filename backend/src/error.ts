export class AppError extends Error {
    constructor(message: string, public readonly statusCode: number, public readonly cause?: unknown) {
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
    constructor(message: string, cause: any) {
        super(message, 409, cause)
    }
}

export class BadRequestError extends AppError {
    constructor(message: string, cause: any) {
        super(message, 400, cause)
    }
}

