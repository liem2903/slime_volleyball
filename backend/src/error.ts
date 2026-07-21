export class AppError extends Error {
    constructor(message: string, public readonly statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export class SessionNotFoundError extends AppError {
    constructor() {
        super("Session ID does not exist", 404);
    }
}

export class InvalidParametersError extends AppError {
    constructor() {
        super("Parameters don't exist", 400);
    }
}