import { RequestArgs } from './request.args.js';

export interface GetLazyWidgetsArgs extends RequestArgs {
    referrer?: string;
    correlationId: string;
    cookie?: string;
    url: string;
}
