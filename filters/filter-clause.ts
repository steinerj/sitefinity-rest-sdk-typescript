/**
 * Represents a simple filter clause for querying data.
 */
export interface FilterClause {
    FieldName: string,
    FieldValue: any,
    Operator: FilterOperators | string,
}

/**
 * Represents the possible operators for filtering.
 */
export enum FilterOperators {
    Equal = 'eq',
    NotEqual = 'ne',
    GreaterThan = 'gt',
    LessThan = 'lt',
    GreaterThanOrEqual = 'ge',
    LessThanOrEqual = 'le',
    ContainsOr = 'any+or',
    ContainsAnd = 'any+and',
    DoesNotContain = 'not+(any+or)',
    In = 'in',
    NotStartsWith = 'not+(startswith)',
};

/**
 * Represents the possible operators for string filtering.
 */
export const StringOperators = {
    StartsWith: 'startswith',
    EndsWith: 'endswith',
    Contains: 'contains'
};
