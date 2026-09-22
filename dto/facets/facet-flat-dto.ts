import { FacetResponseDto } from './facet-response-dto.js';

export interface FacetFlatResponseDto {
    FacetKey: string;
    FacetResponses: FacetResponseDto[];
}
