import { DateOffsetPeriod } from './date-offset-period.js';
import { FilterClause } from './filter-clause.js';
import { RelationFilter } from './relation-filter.js';

/**
 * Represents a combined filter for querying data that consists of multiple child filters and an operator.
 */
export interface CombinedFilter {
    /**
     * The operator used to combine the child filters.
     */
    Operator: 'AND' | 'OR' | 'NOT';

    /**
     * An array of child filters that can be either simple filter clauses, relation filters, or other combined filters.
     */
    ChildFilters: Array<CombinedFilter | FilterClause | RelationFilter | DateOffsetPeriod>
}
