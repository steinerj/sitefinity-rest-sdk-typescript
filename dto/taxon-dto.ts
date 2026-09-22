import { SdkItem } from './sdk-item.js';

export interface TaxonDto extends SdkItem {
    AppliedTo: string;
    UrlName: string;
    SubTaxa: TaxonDto[];
}
