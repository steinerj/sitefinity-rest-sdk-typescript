import { RequestArgs } from './request.args.js';

export interface GetSharedContentArgs extends RequestArgs {
    id: string;
    cultureName: string;
}
