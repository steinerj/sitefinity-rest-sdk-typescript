import { Facet } from '../dto/facets/facet.js';
import { RequestArgs } from './request.args.js';

export interface GetFacetsArgs extends RequestArgs {
    searchQuery: string,
    culture: string,
    indexCatalogue: string,
    filter: string,
    resultsForAllSites: string,
    searchFields: string,
    facets: Facet[],
    filterExpression: string | null;
}
