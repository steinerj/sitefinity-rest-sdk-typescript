import { Dictionary } from '../core/dictionary.js';
import { HttpRequestInit } from '../core/client-options.js';

export interface GetPageLayoutArgs {
    pagePath: string,
    queryParams?: Dictionary;
    cookie?: string;
    relatedFields?: string[];
    additionalHeaders?: {[key: string]: string};
    followRedirects?: boolean;
    maxRedirects?: number;
    traceContext?: any;
    additionalFetchData?: HttpRequestInit;
}
