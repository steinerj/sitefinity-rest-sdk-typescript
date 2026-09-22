import { RequestArgs } from './request.args.js';

export interface GetTaxonArgs extends RequestArgs {
    showEmpty: boolean;
    orderBy: string;
    taxaIds: string[];
    taxonomyId: string;
    selectionMode: 'All' | 'TopLevel' | 'UnderParent' | 'Selected' | 'ByContentType' | string;
    contentType: string;
}
