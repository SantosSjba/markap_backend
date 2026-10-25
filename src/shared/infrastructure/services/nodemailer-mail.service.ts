import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import * as nodemailer from 'nodemailer';
import { MailService } from '../../domain/services/mail.service';

/**
 * Nodemailer Mail Service
 *
 * Implementación del servicio de correo usando Nodemailer.
 * Si no hay credenciales SMTP, registra que el envío se omitió sin exponer su contenido.
 */
@Injectable()
export class NodemailerMailService extends MailService {
  private readonly transport: nodemailer.Transporter | null = null;
  private readonly from: string;
  private readonly isConfigured: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    super();
    this.logger.setContext(NodemailerMailService.name);
    this.from =
      this.configService.get<string>('mail.from') ||
      '"MARKAP" <noreply@markap.com>';
    const user = this.configService.get<string>('mail.user');
    const password = this.configService.get<string>('mail.password');
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');

    this.isConfigured = !!(user && password);

    if (this.isConfigured && host) {
      this.transport = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: port === 465,
        auth: {
          user,
          pass: password,
        },
      });
    } else {
      this.transport = null;
    }
  }

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const mailOptions = {
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    if (this.transport && this.isConfigured) {
      await this.transport.sendMail(mailOptions);
      this.logger.debug({ event: 'mail.delivery.sent' }, 'Correo enviado');
    } else {
      this.logger.warn(
        { event: 'mail.delivery.skipped', reason: 'smtp_not_configured' },
        'Correo no enviado: SMTP no configurado',
      );
    }
  }
}
