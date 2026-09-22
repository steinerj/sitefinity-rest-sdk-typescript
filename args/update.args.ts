import { CreateArgs } from './create.args.js';

export interface UpdateArgs extends CreateArgs {
    id: string;
}
