import { FilterClause } from '../filters/filter-clause.js';
import { FieldType, ServiceMetadata } from '../service-metadata.js';
import { IFilterMetadataProvider } from './filter-metadata-provider.js';
import { FilterContext } from './odata-filter-serializer.js';

export class SitefinityContentTypesFilterMetadataProvider implements IFilterMetadataProvider {
    constructor(private readonly metadata: ServiceMetadata) {}

    getFieldType(clause: FilterClause, filterContext: FilterContext): FieldType {
        return this.metadata.getFieldType(filterContext.Type, clause.FieldName);
    }

    getRelatedType(filterName: string, filterContext: FilterContext): string | null {
        return this.metadata.getRelatedType(filterContext.Type, filterName);
    }

    isPropertyACollection(filterContext: FilterContext, clause: FilterClause): boolean {
        return this.metadata.isPropertyACollection(filterContext.Type, clause.FieldName);
    }

    trySerializeFilterValue(propName: string, value: any, filterContext: FilterContext): { success: boolean, result: string | null } {
        const serialized = this.metadata.serializeFilterValue(filterContext.Type, propName, value);
        if (serialized === null || serialized === undefined) {
            return { success: false, result: null };
        }

        return { success: true, result: serialized };
    }
}
