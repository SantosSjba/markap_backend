import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import {
  DomainException,
  DuplicateEntityException,
  EmailAlreadyExistsException,
  EntityNotFoundException,
  InvalidCredentialsException,
  InvalidPasswordResetCodeException,
  UnauthorizedException,
  UserInactiveException,
  UserNotFoundException,
  ValidationException,
} from '../../domain/exceptions/domain.exception';

const SERVER_ERROR_MESSAGE =
  'Ocurrió un problema en el servidor y no se pudo completar la operación. Inténtalo nuevamente; si el problema continúa, comunícate con soporte.';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let message: string | string[];
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const details: unknown =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as { message?: unknown }).message;
      message =
        typeof details === 'string'
          ? details
          : Array.isArray(details) &&
              details.every((value: unknown) => typeof value === 'string')
            ? details
            : exception.message;
      // Un error de Prisma envuelto no debe exponer consultas ni rutas del servidor.
      if (
        typeof message === 'string' &&
        /Invalid `.*` invocation/.test(message)
      )
        message = 'Operación no válida.';
      // Respuestas propias de Nest/Express que llegan en inglés.
      if (typeof message === 'string' && /^Cannot [A-Z]+ \//.test(message))
        message = 'El recurso solicitado no existe.';
      if (status === Number(HttpStatus.PAYLOAD_TOO_LARGE))
        message =
          'El archivo o los datos enviados superan el tamaño permitido.';
      if (
        status === Number(HttpStatus.UNAUTHORIZED) &&
        message === 'Unauthorized'
      )
        message = 'Tu sesión expiró o no es válida. Inicia sesión nuevamente.';
      if (
        status === Number(HttpStatus.FORBIDDEN) &&
        message === 'Forbidden resource'
      )
        message = 'No tienes permisos para realizar esta acción.';
    } else if (
      exception instanceof EntityNotFoundException ||
      exception instanceof UserNotFoundException
    ) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
    } else if (exception instanceof ValidationException) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
      errors = exception.errors;
    } else if (
      exception instanceof InvalidCredentialsException ||
      exception instanceof UnauthorizedException
    ) {
      status = HttpStatus.UNAUTHORIZED;
      message = exception.message;
    } else if (exception instanceof UserInactiveException) {
      status = HttpStatus.FORBIDDEN;
      message = exception.message;
    } else if (exception instanceof InvalidPasswordResetCodeException) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
    } else if (
      exception instanceof EmailAlreadyExistsException ||
      exception instanceof DuplicateEntityException
    ) {
      status = HttpStatus.CONFLICT;
      message = exception.message;
    } else if (exception instanceof DomainException) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      message = exception.message;
    } else if (
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      ['P2002', 'P2003', 'P2025', 'P2034'].includes(exception.code)
    ) {
      status =
        exception.code === 'P2025' ? HttpStatus.NOT_FOUND : HttpStatus.CONFLICT;
      message =
        exception.code === 'P2002'
          ? 'Ya existe un registro con esos datos únicos.'
          : exception.code === 'P2003'
            ? 'El registro tiene relaciones que impiden completar la operación.'
            : exception.code === 'P2025'
              ? 'Registro no encontrado.'
              : 'Conflicto de actualización. Vuelve a intentarlo.';
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = SERVER_ERROR_MESSAGE;
    }

    // El detalle técnico queda en el registro del servidor, nunca en la respuesta.
    if (status >= 500) {
      (response as Response & { err?: Error }).err =
        exception instanceof Error ? exception : new Error('Error no tipado');
      message = SERVER_ERROR_MESSAGE;
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
    });
  }
}
