import { FilterClause, FilterOperators, StringOperators } from '../filters/filter-clause.js';
import { FieldType } from '../service-metadata.js';
import { IFilterMetadataProvider } from './filter-metadata-provider.js';
import { FilterContext } from './odata-filter-serializer.js';

export class SearchFilterMetadataProvider implements IFilterMetadataProvider {
    private static readonly ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

    getFieldType(clause : FilterClause, filterContext: FilterContext): FieldType {
        return FieldType.TextField;
    }

    getRelatedType(filterName: string, filterContext: FilterContext): string | null {
        return filterContext.Type;
    }

    isPropertyACollection(filterContext: FilterContext, clause: FilterClause): boolean {
        return  clause.Operator === FilterOperators.ContainsAnd
        || clause.Operator === FilterOperators.ContainsOr
        || clause.Operator === FilterOperators.In
        || clause.Operator === StringOperators.Contains
        || clause.Operator === FilterOperators.DoesNotContain;
    }

    trySerializeFilterValue(propName: string, value: any, filterContext: FilterContext): { success: boolean, result: string | null } {
        if (typeof value === 'boolean') {
            return { success: true, result: value ? 'true' : 'false' };
        } else if (typeof value === 'number') {
            return { success: true, result: value.toString() };
        } else if (typeof value === 'string' && SearchFilterMetadataProvider.ISO_DATE_REGEX.test(value) && !isNaN(Date.parse(value))) {
            // format the date string "yyyy-MM-dd'T'HH:mm:ss.sss'Z'"
            return { success: true, result: new Date(Date.parse(value)).toISOString() };
        }

        const escaped = value?.toString()?.replace(/'/g, '\'\'');
        return { success: true, result: `'${escaped}'` };
    }
}
