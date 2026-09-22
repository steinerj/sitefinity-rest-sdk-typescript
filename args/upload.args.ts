import { Dictionary } from '../core/dictionary.js';
import { CommonArgs } from './common.args.js';

export interface UploadMediaArgs extends CommonArgs {
    title: string;
    urlName?: string;
    fileName: string;
    parentId: string;
    fields?: Dictionary
    binaryData: string;
    contentType: string;
}
