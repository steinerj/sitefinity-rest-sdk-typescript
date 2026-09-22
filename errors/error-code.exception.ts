export class ErrorCodeException extends Error {
    constructor(public code: string, public message: string) {
        super(message);
        this.name = 'ErrorCodeException';
    }
}
