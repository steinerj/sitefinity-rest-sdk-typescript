export interface State {
    Version: number;
    LockedByCurrentUser: boolean;
    HasChanged: boolean;
    AddAllowed: boolean;
    EditAllowed: boolean;
    SegmentId: string;
    Toolbox: string;
    EmptyMessageLabel: string;
    AddMessageLabel: string;
    AddMessageForEmptyScreenLabel: string;
    IsBackend: boolean;
    WidgetState: WidgetState[];
}

export interface WidgetState {
    Key: string;
    Name: string;
    AddAllowed: boolean;
    DeleteAllowed: boolean;
    EditAllowed: boolean;
    MoveAllowed: boolean;
    LabelTooltip: string;
    IsPersonalized: boolean;
    WidgetSegmentId: string;
}
