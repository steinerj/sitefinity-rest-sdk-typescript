import { CommonArgs } from './common.args.js';

export interface ChangeTemplateArgs extends CommonArgs {
    selectedPages: string[];
    templateId?: string;
    templateName?: string;
}
