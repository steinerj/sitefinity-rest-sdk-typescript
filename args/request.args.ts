import { Dictionary } from '../core/dictionary.js';
import { HttpRequestInit } from '../core/client-options.js';

export interface RequestArgs {
    /**
     * Additional headers that need to be added to the request.
     */
    additionalHeaders?: Dictionary;

    /**
     * Additional query parameters that need to be added to the request.
     */
    additionalQueryParams?: Dictionary;
    additionalFetchData?: HttpRequestInit;
    traceContext?: any;
}
