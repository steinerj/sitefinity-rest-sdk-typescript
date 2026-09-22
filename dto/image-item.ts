import { SdkItem } from './sdk-item.js';
import { ThumbnailItem } from './thumbnail-item.js';

export interface ImageItem extends SdkItem {
    Url: string;
    Title: string;
    AlternativeText: string;
    Width: number;
    Height: number;
    Thumbnails: ThumbnailItem[];
    SelectedThumbnail?: ThumbnailItem;
}
