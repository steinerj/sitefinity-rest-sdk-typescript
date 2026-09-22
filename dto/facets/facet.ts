import { CustomFacetRange } from './custom-facet-range.js';
import { SitefinityFacetType } from '../sitefinity-facet-type.js';

export interface Facet {
    FieldName?: string;
    CustomIntervals?: CustomFacetRange[];
    IntervalRange?: string | null;
    FacetFieldType?: string;
    SitefinityFacetType: SitefinityFacetType;
}
