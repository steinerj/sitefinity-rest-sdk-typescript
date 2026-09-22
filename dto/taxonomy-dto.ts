import { SdkItem } from './sdk-item.js';
import { TaxonomyType } from './taxonomy-type.js';

export interface TaxonomyDto extends SdkItem {
    Name: string;
    Title: string;
    TaxaUrl: string;
    TaxonName: string;
    Type: TaxonomyType;
}
