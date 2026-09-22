import { DetailItem } from '../dto/detail-item.js';
import { RequestArgs } from './request.args.js';

export interface GetBreadcrumbArgs extends RequestArgs {
    addStartingPageAtEnd?: boolean;
    addHomePageAtBeginning?: boolean;
    includeGroupPages?: boolean;
    currentPageId: string;
    detailItemInfo?: DetailItem;
    startingPageId?: string;
    currentPageUrl: string;
    culture?: string;
}
