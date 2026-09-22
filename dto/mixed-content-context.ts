export interface MixedContentContext {
    ItemIdsOrdered?: string[] | null;
    Content: ContentContext[];
    ManualSelectionItems?: {
        Index: number;
        Item: { [key: string]: any };
    }[];
    CustomProperties?: { [itemId: string]: ContentCustomProperties };
}

export interface ContentContext {
    Type: string;
    Variations: ContentVariation[] | null;
}

export interface ContentVariation {
    Source: string;
    Filter: { Key: string; Value: string };
    DynamicFilterByParent?: boolean;
}

export interface ContentCustomProperties {
    SelectedThumbnailName?: string;
}