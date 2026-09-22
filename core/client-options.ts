export interface HttpRequestInit {
    method?: string;
    headers?: { [key: string]: string };
    body?: any;
    credentials?: 'omit' | 'same-origin' | 'include';
    redirect?: 'follow' | 'error' | 'manual';
    cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';
    [key: string]: any;
}

export interface HttpResponse {
    status: number;
    statusText: string;
    headers: {
        get(name: string): string | null;
        has(name: string): boolean;
    };
    json(): Promise<any>;
    text(): Promise<string>;
}

export type HttpTransport = (url: string, init?: HttpRequestInit) => Promise<HttpResponse>;

export interface RequestContext {
    headers?: { [key: string]: string };
    cookie?: string;
    additionalFetchData?: HttpRequestInit;
}

export interface ClientOptions {
    baseUrl: string;
    publicUrl?: string;
    servicePath?: string;
    searchServicePath?: string;
    serviceUrl?: string;
    searchServiceUrl?: string;
    fetch?: HttpTransport;
    headers?: { [key: string]: string };
    queryParams?: { [key: string]: string };
    additionalFetchData?: HttpRequestInit;
    rendererName?: string;
    nextGen?: boolean;
    getRequestContext?: () => RequestContext | Promise<RequestContext>;
    getQueryParams?: () => { [key: string]: string } | undefined;
    withContext?: <Result>(callback: () => Promise<Result>, context?: any) => Promise<Result>;
}