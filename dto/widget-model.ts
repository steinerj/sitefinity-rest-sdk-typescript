export interface WidgetModel<T extends { [key: string]: any } = { [key: string]: any }> {
    Id: string;
    Name: string;
    Caption: string;
    Lazy: boolean;
    Orphaned: boolean;
    PlaceHolder: string;
    Properties: T;
    Children: WidgetModel[];
}