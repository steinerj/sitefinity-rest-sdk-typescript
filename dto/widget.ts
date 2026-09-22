import { Dictionary } from '../core/dictionary.js';

export interface Widget {
    Id: string;
    SiblingId: string;
    Name: string;
    PlaceHolder: string;
    Caption: string;
    Lazy: boolean;
    Properties: Dictionary;
    Children: Widget[];
}
