import { CommonArgs } from './common.args.js';

export interface ScheduleArgs extends CommonArgs {
    id: string;
    publicationDate: Date;
    expirationDate?: Date;
}
