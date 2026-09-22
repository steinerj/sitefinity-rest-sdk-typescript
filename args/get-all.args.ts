import { CombinedFilter } from '../filters/combined-filter.js';
import { FilterClause } from '../filters/filter-clause.js';
import { OrderBy } from '../filters/orderby.js';
import { RelationFilter } from '../filters/relation-filter.js';
import { GetCommonArgs } from './get-common.args.js';

export interface GetAllArgs extends GetCommonArgs {
    /**
     * Whether to include the total count of items in the response.
     */
    count?: boolean;

    /**
     * Order expressions to sort the results.
     * Each expression should be in the format "fieldName asc|desc".
     */
    orderBy?: OrderBy[],

    /**
     * The number of items to skip before starting to collect the result set.
     */
    skip?: number;

    /**
     * The number of items to return.
     */
    take?: number;

    /**
     * Filter to apply to the results.
     */
    filter?: FilterClause | CombinedFilter | RelationFilter | null;
}
