import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthRateLimit } from '../../../../shared/presentation/decorators/auth-rate-limit.decorator';
import { AdminGuard } from '../../../../shared/presentation/guards/admin.guard';
import type { AuthenticatedRequest } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { JwtAuthGuard } from '../../../../shared/presentation/guards/jwt-auth.guard';
import { AUTH_PORT, type AuthPort } from '../../application/ports/auth.port';
import {
  LoginResponseDto,
  RegisterResponseDto,
  UserResponseDto,
} from '../dtos/auth/auth-response.dto';
import { ForgotPasswordDto } from '../dtos/auth/forgot-password.dto';
import { LoginDto } from '../dtos/auth/login.dto';
import { RegisterDto } from '../dtos/auth/register.dto';
import { ResetPasswordDto } from '../dtos/auth/reset-password.dto';
import { UserHttpMapper } from '../mappers/user-http.mapper';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AUTH_PORT) private readonly auth: AuthPort) {}

  @Post('register')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Registrar un nuevo usuario (requiere autenticación)',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Se requiere autenticación',
  })
  @ApiResponse({
    status: 409,
    description: 'El email ya está registrado',
  })
  async register(
    @Request() req: AuthenticatedRequest,
    @Body() dto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    const user = await this.auth.register({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      createdBy: req.user.sub,
    });

    return {
      message: 'Usuario registrado exitosamente',
      user: UserHttpMapper.toResponse(user),
    };
  }

  @Post('login')
  @AuthRateLimit('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
  })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const result = await this.auth.login({
      email: dto.email,
      password: dto.password,
    });

    const roles = await this.auth.getRolesForUser(result.user.id);

    return {
      user: UserHttpMapper.toResponseWithRoleEntities(result.user, roles),
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async getProfile(
    @Request() req: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    const { user, roles } = await this.auth.getProfileWithRoles(req.user.sub);

    return UserHttpMapper.toResponseWithRoleEntities(user, roles);
  }

  @Post('forgot-password')
  @AuthRateLimit('forgotPassword')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiResponse({
    status: 200,
    description: 'Si el email existe, se enviará un código por correo',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.auth.requestPasswordReset({ email: dto.email });
    return {
      message:
        'Si el correo está registrado, recibirás un código de recuperación en unos momentos',
    };
  }

  @Post('reset-password')
  @AuthRateLimit('resetPassword')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con código' })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada correctamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Código inválido o expirado',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.auth.resetPassword({
      email: dto.email,
      code: dto.code,
      newPassword: dto.newPassword,
    });
    return { message: 'Contraseña actualizada correctamente' };
  }
}
