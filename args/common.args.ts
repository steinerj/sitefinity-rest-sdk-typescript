import { RequestArgs } from './request.args.js';

export interface CommonArgs extends RequestArgs {
    /**
     * The type of the item to retrieve.
     */
    type: string;

    /**
     * The provider of the request.
     */
    provider?: string;

    /**
     * The culture of the request.
     */
    culture?: string;
}
