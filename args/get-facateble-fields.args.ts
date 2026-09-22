import { Facet } from '../dto/facets/facet.js';
import { RequestArgs } from './request.args.js';

export interface GetFacatebleFieldsArgs extends RequestArgs {
    indexCatalogue: string
}
