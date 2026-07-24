export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}
