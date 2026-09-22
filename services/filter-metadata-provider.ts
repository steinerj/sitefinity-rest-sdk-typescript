import { FilterClause } from '../filters/filter-clause.js';
import { FieldType } from '../service-metadata.js';
import { FilterContext } from './odata-filter-serializer.js';

export interface IFilterMetadataProvider {
    trySerializeFilterValue(propName: string, value: any, filterContext: FilterContext): { success: boolean, result: string | null };
    isPropertyACollection(filterContext: FilterContext, clause: FilterClause): boolean;
    getFieldType(clause: FilterClause, filterContext: FilterContext): FieldType;
    getRelatedType(filterName: string, filterContext: FilterContext): string | null;
}
