import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../repositories/user.repository';
import { PasswordResetCodeRepository } from '../../repositories/password-reset-code.repository';
import { MailService } from '../../services/mail.service';
import { UserNotFoundException } from '../../exceptions';

export interface RequestPasswordResetInput {
  email: string;
}

/**
 * Genera un código numérico aleatorio
 */
function generateNumericCode(length: number): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

/**
 * Request Password Reset Use Case
 *
 * Genera un código de recuperación, lo guarda en BD y lo envía por correo.
 */
@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordResetCodeRepository: PasswordResetCodeRepository,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<void> {
    const user = await this.userRepository.findByEmail(
      input.email.toLowerCase().trim(),
    );

    if (!user) {
      throw new UserNotFoundException();
    }

    if (!user.canAuthenticate) {
      // No revelar si el usuario está inactivo - mismo mensaje por seguridad
      throw new UserNotFoundException();
    }

    const codeLength =
      this.configService.get<number>('passwordReset.codeLength') || 6;
    const expiresInMinutes =
      this.configService.get<number>(
        'passwordReset.codeExpiresInMinutes',
      ) || 15;

    const code = generateNumericCode(codeLength);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    // Invalidar códigos anteriores del usuario
    await this.passwordResetCodeRepository.invalidateUserCodes(user.id);

    // Crear nuevo código
    await this.passwordResetCodeRepository.create({
      userId: user.id,
      code,
      expiresAt,
    });

    const frontendUrl =
      this.configService.get<string>('frontend.url') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/auth/reset-password?email=${encodeURIComponent(user.email)}`;

    const gerenciaEmail =
      this.configService.get<string>('passwordReset.gerenciaEmail') ||
      'gerencia.markap@gmail.com';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #1F2933; }
    .container { max-width: 480px; margin: 0 auto; padding: 24px; }
    .code-box { 
      background: #E6F6F7; 
      border: 2px solid #0BB0BE; 
      border-radius: 8px; 
      padding: 16px 24px; 
      text-align: center; 
      font-size: 28px; 
      font-weight: bold; 
      letter-spacing: 6px;
      margin: 24px 0;
    }
    .btn { 
      display: inline-block; 
      background: #0BB0BE; 
      color: white !important; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: 600;
      margin-top: 16px;
    }
    .footer { color: #6B7280; font-size: 12px; margin-top: 32px; }
    .solicitante { background: #F3F4F6; padding: 12px; border-radius: 8px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Recuperación de contraseña - MARKAP (Gerencia)</h2>
    <p>Solicitud de recuperación de contraseña. El código debe usarse para el siguiente usuario:</p>
    <div class="solicitante">
      <strong>Usuario:</strong> ${user.email}<br>
      <strong>Nombre:</strong> ${user.firstName} ${user.lastName}
    </div>
    <p>Código de recuperación:</p>
    <div class="code-box">${code}</div>
    <p>Este código expira en ${expiresInMinutes} minutos.</p>
    <p>
      <a href="${resetUrl}" class="btn">Restablecer contraseña</a>
    </p>
    <p class="footer">MARKAP S.A.C. - Todos los derechos reservados</p>
  </div>
</body>
</html>`;

    await this.mailService.sendMail({
      to: gerenciaEmail,
      subject: 'Recuperación de contraseña - MARKAP (solicitado por ' + user.email + ')',
      html,
    });
  }
}
