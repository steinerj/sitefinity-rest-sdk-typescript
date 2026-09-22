import { CommonArgs } from './common.args.js';

export interface GetCommonArgs extends CommonArgs {
    /**
     * The content item's fields to include in the response.
     */
    fields?: string[];

    /**
     * Additional fields to append to the selected-by-default fields.
     * Unlike {@link fields}, these do not replace the default selection — they are merged in.
     */
    additionalFields?: string[];
}
