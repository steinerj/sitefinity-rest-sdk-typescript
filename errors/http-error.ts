export class HttpError extends Error {
    constructor(
        public readonly status: number,
        public readonly method: string,
        public readonly url: string,
        public readonly body: any
    ) {
        const detail = typeof body === 'string' ? body : JSON.stringify(body);
        super(`${method} ${url} failed (${status}): ${detail}`);
        this.name = 'HttpError';
    }
}