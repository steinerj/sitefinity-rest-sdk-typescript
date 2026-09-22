import { RequestArgs } from './request.args.js';

export interface SuggestionsArgs extends RequestArgs {
    indexCatalogue: string;
    searchQuery: string;
    culture: string;
    siteId: string;
    scoringInfo: string;
    suggestionFields: string;
    resultsForAllSites: boolean | null;
    filterExpression: string | null;
}
