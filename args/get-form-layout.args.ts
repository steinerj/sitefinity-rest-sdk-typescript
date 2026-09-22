import { Dictionary } from '../core/dictionary.js';
import { RequestArgs } from './request.args.js';

export interface GetFormLayoutArgs extends RequestArgs {
    id: string;
    queryParams?: Dictionary
}
