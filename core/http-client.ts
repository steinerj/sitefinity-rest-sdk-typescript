import { ClientOptions, HttpRequestInit, HttpResponse, HttpTransport } from './client-options.js';

export interface RequestData {
    url: string;
    method?: string;
    headers?: { [key: string]: string };
    data?: any;
    additionalFetchData?: HttpRequestInit;
    traceContext?: any;
}

export class HttpClient {
    constructor(protected readonly options: ClientOptions) {}

    protected async request(request: RequestData): Promise<HttpResponse> {
        const context = await this.options.getRequestContext?.();
        const init: HttpRequestInit = {
            ...this.options.additionalFetchData,
            ...context?.additionalFetchData,
            ...request.additionalFetchData,
            method: request.method || 'GET'
        };
        const headers: { [key: string]: string } = {};
        const headerSources = [
            this.options.rendererName ? {
                'X-SFRENDERER-PROXY': 'true',
                'X-SFRENDERER-PROXY-NAME': this.options.rendererName
            } : undefined,
            this.options.headers,
            this.options.additionalFetchData?.headers,
            context?.headers,
            context?.cookie ? { cookie: context.cookie } : undefined,
            context?.additionalFetchData?.headers,
            request.headers,
            request.additionalFetchData?.headers
        ];
        for (const source of headerSources) {
            for (const [name, value] of Object.entries(source || {})) {
                headers[name.toLowerCase()] = value;
            }
        }

        if (request.data !== undefined) {
            if (headers['content-encoding'] === 'base64') {
                init.body = request.data;
            } else {
                headers['content-type'] ??= 'application/json';
                init.body = headers['content-type'].includes('application/json')
                    ? JSON.stringify(request.data)
                    : request.data;
            }
        }

        init.headers = headers;
        const transport = this.options.fetch
            ?? (globalThis as { fetch?: HttpTransport }).fetch?.bind(globalThis);
        if (!transport) {
            throw new Error('No HTTP transport is available. Supply ClientOptions.fetch for this runtime.');
        }

        const execute = () => transport(request.url, init);
        return this.options.withContext
            ? this.options.withContext(execute, request.traceContext)
            : execute();
    }
}