export interface PageTemplateCategoryDto {
    Title: string;
    Subtitle: string;
    Visible: boolean;
    Type: PageTemplateCategoryType,
    Templates: {
        Id: string;
        Title: string;
        Name: string;
        ThumbnailUrl: string;
        Renderer: string;
        UsedByNumberOfPages: number;
        Framework : number
    }[]
}

export enum PageTemplateCategoryType {
    None = 'None',
    CurrentlyUsed = 'CurrentlyUsed'
}

