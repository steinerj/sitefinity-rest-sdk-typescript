import { ItemArgs } from './item.args.js';

export interface CreateWidgetArgs extends ItemArgs {
    name: string;
    siblingKey?: string;
    parentPlaceholderKey?: string;
    placeholderName: string;
    properties?: { [key: string]: string }
}
