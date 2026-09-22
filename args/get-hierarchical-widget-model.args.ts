import { ItemArgs } from './item.args.js';

export interface GetHierarchicalWidgetModelArgs extends ItemArgs {
    widgetId: string;
    widgetSegmentId?: string;
    segmentId?: string;
}
