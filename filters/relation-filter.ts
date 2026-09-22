import { CombinedFilter } from './combined-filter.js';
import { FilterClause } from './filter-clause.js';

/**
 * Represents a relation filter for querying data that consists of a name of the relation field, an operator, and a child filter.
 */
export interface RelationFilter {
    Name: string;
    Operator: 'Any' | 'All'
    ChildFilter: FilterClause | CombinedFilter | RelationFilter
}
