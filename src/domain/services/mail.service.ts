/**
 * Mail Service Interface
 *
 * Contrato para el envío de correos electrónicos.
 */
export abstract class MailService {
  abstract sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void>;
}
