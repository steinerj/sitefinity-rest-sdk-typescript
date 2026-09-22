export interface RegistrationSettingsDto {
    RequiresQuestionAndAnswer: boolean;
    ActivationMethod: string;
    NewPassword: string;
    Answer: string;
    SecurityQuestion: string;
    SecurityToken: string;
    SmtpConfigured: boolean;
    RegistrationEnabled: boolean;
}

export enum ActivationMethod {
    AfterConfirmation = 'AfterConfirmation'
}
