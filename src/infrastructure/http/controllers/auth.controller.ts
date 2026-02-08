import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  GetUserProfileUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
} from '../../../application/use-cases/auth';
import { GetUserRolesUseCase } from '../../../application/use-cases/roles';
import {
  RegisterDto,
  LoginDto,
  LoginResponseDto,
  RegisterResponseDto,
  UserResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../dtos/auth';
import { UserHttpMapper } from '../mappers/user-http.mapper';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly getUserRolesUseCase: GetUserRolesUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Registrar un nuevo usuario (requiere autenticación)' })
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
    const user = await this.registerUserUseCase.execute({
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
    const result = await this.loginUserUseCase.execute({
      email: dto.email,
      password: dto.password,
    });

    const roles = await this.getUserRolesUseCase.execute(result.user.id);

    return {
      user: {
        ...UserHttpMapper.toResponse(result.user),
        roles: roles.map((r) => ({ id: r.id, name: r.name, code: r.code })),
      },
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
    const user = await this.getUserProfileUseCase.execute(req.user.sub);
    const roles = await this.getUserRolesUseCase.execute(user.id);

    return {
      ...UserHttpMapper.toResponse(user),
      roles: roles.map((r) => ({ id: r.id, name: r.name, code: r.code })),
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiResponse({
    status: 200,
    description: 'Si el email existe, se enviará un código por correo',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.requestPasswordResetUseCase.execute({ email: dto.email });
    return {
      message:
        'Si el correo está registrado, recibirás un código de recuperación en unos momentos',
    };
  }

  @Post('reset-password')
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
    await this.resetPasswordUseCase.execute({
      email: dto.email,
      code: dto.code,
      newPassword: dto.newPassword,
    });
    return { message: 'Contraseña actualizada correctamente' };
  }
}
