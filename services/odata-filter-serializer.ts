import { CombinedFilter } from '../filters/combined-filter.js';
import { DateOffsetPeriod } from '../filters/date-offset-period.js';
import { FilterClause, FilterOperators, StringOperators } from '../filters/filter-clause.js';
import { RelationFilter } from '../filters/relation-filter.js';
import { FieldType } from '../service-metadata.js';
import { IFilterMetadataProvider } from './filter-metadata-provider.js';

export class ODataFilterSerializer {
    private filterMetadata: IFilterMetadataProvider;
    private propertyPrefix: string;
    private lambdaVariableName: string;

    constructor(filterMetadata: IFilterMetadataProvider, lambdaVariableName: string = 'a') {
        this.filterMetadata = filterMetadata;
        this.lambdaVariableName = lambdaVariableName;
        this.propertyPrefix = lambdaVariableName === 'a' ? '' : `${lambdaVariableName}/`;
    }

    serialize(filterContext: FilterContext): string | null {
        if (filterContext.Filter?.hasOwnProperty('ChildFilters')) {
            return this.serializeCombinedFilter(<any>filterContext.Filter, filterContext);
        } else if (filterContext.Filter?.hasOwnProperty('FieldName')) {
            return this.serializeFilterClause(<any>filterContext.Filter, filterContext);
        } else if (filterContext.Filter?.hasOwnProperty('Name')) {
            return this.serializeRelationFilter(<any>filterContext.Filter, filterContext);
        }

        return null;
    }

    private serializeCombinedFilter(filter: CombinedFilter, filterContext: FilterContext): string | null {
        if (filter.ChildFilters.length === 0) {
            return null;
        }

        let serializedChildFilters = filter.ChildFilters.map((x => {
            if (x.hasOwnProperty('FieldName')) {
                return this.serializeFilterClause(<any>x, filterContext);
            } else if (x.hasOwnProperty('ChildFilters')) {
                let serializedFilter = this.serializeCombinedFilter(<any>x, filterContext);
                if (serializedFilter) {
                    serializedFilter = `(${serializedFilter})`;
                }

                return serializedFilter;
            } else if (x.hasOwnProperty('Name')) {
                return this.serializeRelationFilter(<any>x, filterContext);
            }

            return null;
        })).filter(x => x);

        if (serializedChildFilters.length === 1 && filter.Operator !== 'NOT') {
            return serializedChildFilters[0];
        }

        if (filter.Operator === 'NOT') {
            return `(not ${serializedChildFilters[0]})`;
        }

        serializedChildFilters = serializedChildFilters.map(x => {
            if (!x) {
                return null;
            }

            if (x.startsWith('(') && x.endsWith(')')) {
                return x;
            }

            return `(${x})`;
        }).filter(x => x);

        return serializedChildFilters.join(` ${filter.Operator.toLowerCase()} `);
    }

    private serializeFilterClause(filter: FilterClause, filterContext: FilterContext): string | null {
        let fieldNameWithPrefix = `${this.propertyPrefix}${filter.FieldName}`;
        const nextVariableName = String.fromCharCode(this.lambdaVariableName.charCodeAt(0) + 1);
        const fieldType = this.filterMetadata.getFieldType(filter, filterContext);
        switch (filter.Operator) {
            case FilterOperators.Equal:
            case FilterOperators.NotEqual:
                const serializedValue1 = this.serializeFilterValue(filter.FieldValue, filter.FieldName, filterContext);
                let filterResult = null;
                switch (fieldType) {
                    case FieldType.ChoiceField:
                        filterResult = `cast(${fieldNameWithPrefix}, 'Edm.String') ${filter.Operator} '${serializedValue1}'`;
                        break;
                    case FieldType.ClassificationField:
                        filterResult = `${fieldNameWithPrefix}/any(x:x eq ${serializedValue1})`;
                        if (filter.Operator === 'ne') {
                            filterResult = 'not ' + filterResult;
                        }
                        break;
                    default:
                        filterResult = `(${fieldNameWithPrefix} ${filter.Operator} ${serializedValue1})`;
                    break;
                }

                return filterResult;
            case FilterOperators.GreaterThan:
            case FilterOperators.LessThan:
            case FilterOperators.GreaterThanOrEqual:
            case FilterOperators.LessThanOrEqual:
                const serializedValue = this.serializeFilterValue(filter.FieldValue, filter.FieldName, filterContext);
                return `(${fieldNameWithPrefix} ${filter.Operator} ${serializedValue})`;
            case FilterOperators.ContainsOr:
            case FilterOperators.DoesNotContain:
                let containsOrFilter = this.getContainsTypeOperatorsFilterExpression(filter, filterContext, fieldNameWithPrefix, nextVariableName, 'or');
                if (containsOrFilter && filter.Operator === FilterOperators.DoesNotContain) {
                    containsOrFilter = 'not (' + containsOrFilter + ')';
                }

                return containsOrFilter;
            case FilterOperators.ContainsAnd:
                return this.getContainsTypeOperatorsFilterExpression(filter, filterContext, fieldNameWithPrefix, nextVariableName, 'and');
            case StringOperators.StartsWith:
            case StringOperators.EndsWith:
            case StringOperators.Contains:
                const serializedValueForString = this.serializeFilterValue(filter.FieldValue, filter.FieldName, filterContext);
                return `${filter.Operator}(${fieldNameWithPrefix}, ${serializedValueForString})`;
            case FilterOperators.NotStartsWith:
                const serializedValueForNotStartsWith = this.serializeFilterValue(filter.FieldValue, filter.FieldName, filterContext);
                return `not startswith(${fieldNameWithPrefix}, ${serializedValueForNotStartsWith})`;
            case FilterOperators.In:
                return `${filter.FieldName} ${filter.Operator} (${filter.FieldValue})`;
            default:
                throw new Error(`The value provided for the operator filter clause: ${filter.Operator} is not supported`);
        }
    }

    private serializeRelationFilter(filter: RelationFilter, filterContext: FilterContext): string | null {
        let relatedType = this.filterMetadata.getRelatedType(filter.Name, filterContext);
        if (!relatedType) {
            return null;
        }

        let newFilterContext: FilterContext = {
            Type: relatedType,
            Filter: filter.ChildFilter
        };

        const nextVariableName = String.fromCharCode(this.lambdaVariableName.charCodeAt(0) + 1);
        let serializedChildFilter = new ODataFilterSerializer(this.filterMetadata, nextVariableName).serialize(newFilterContext);
        switch (filter.Operator) {
            case 'Any':
                return `${this.propertyPrefix}${filter.Name}/any(${nextVariableName}:${serializedChildFilter})`;
            case 'All':
                return `${this.propertyPrefix}${filter.Name}/all(${nextVariableName}:${serializedChildFilter})`;
            default:
                break;
        }
        return null;
    }

    private serializeFilterValue(value: any, propName: string, filterContext: FilterContext) {
        const { success, result } = this.filterMetadata.trySerializeFilterValue(propName, value, filterContext);
        if (!success || result === null || result === undefined) {
            return value.toString();
        }

        return result;
    }

    private serializeFilterValuesArray(value: any, propName: string, filterContext: FilterContext): string[] {
        if (typeof value === 'string') {
            return [this.serializeFilterValue(value, propName, filterContext)];
        }

        if (Array.isArray(value)) {
            return value.map(x => this.serializeFilterValue(x, propName, filterContext));
        }

        const serialized = this.serializeFilterValue(value, propName, filterContext);
        return [serialized];
    }

    private getContainsTypeOperatorsFilterExpression(clause: FilterClause, filterContext: FilterContext, fieldNameWithPrefix: string, nextVariableName: string, operatorName: string): string | null {
        const serializedValues = this.serializeFilterValuesArray(clause.FieldValue, clause.FieldName, filterContext);
        if (serializedValues.length > 0) {
            if (this.filterMetadata.isPropertyACollection(filterContext, clause)) {
                return serializedValues
                    .map(x => `${fieldNameWithPrefix}/any(${nextVariableName}: ${nextVariableName} eq ${x})`)
                    .join(` ${operatorName} `);
            } else {
                return serializedValues
                    .map(x => `${fieldNameWithPrefix} eq ${x}`)
                    .join(` ${operatorName} `);
            }
        }

        return null;
    }
}


export interface FilterContext {
    Filter: FilterClause | CombinedFilter | RelationFilter | DateOffsetPeriod | null;
    Type: string;
}
