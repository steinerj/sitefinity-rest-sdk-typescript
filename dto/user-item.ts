export interface Claim {
    Type: string;
    Value: string;
    ValueType: string;
    Issuer: string;
    OriginalIssuer: string;
}

export interface UserDto {
    Roles: string[];
    AuthenticationProtocol: string;
    Username: string;
    Email: string;
    Claims: Claim[],
    AuthenticationUrl: string;
    ExternalProviderName: string;
    IsAuthenticated: boolean;
    Id: string | null;
    FirstName: string | null;
    LastName: string | null;
    Nickname: string | null;
    Avatar: string | null;
    AllowedAvatarFormats: string[];
    About: string | null;
    CustomFields: {
      [key: string]: any;
    };
    ReadOnlyFields: string[];
    Preferences: {
      [key: string]: string;
    };
    IsProfilePublic: boolean;
}
