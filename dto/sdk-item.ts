export interface SdkItem {
    Provider: string;
    Id: string;
    [key: string]: any;
}

export class SdkItemModel {
    Id?: string;

    Provider?: string;
}
