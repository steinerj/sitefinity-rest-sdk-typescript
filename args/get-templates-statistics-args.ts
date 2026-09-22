import { RequestArgs } from './request.args.js';

export interface GetTemplatesStatisticsArgs extends RequestArgs {
    templateNames: string[];
}
