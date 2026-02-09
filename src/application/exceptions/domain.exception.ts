/**
 * Base exception for domain/application layer errors
 * These exceptions represent business rule violations
 */
export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Exception thrown when a requested entity is not found
 */
export class EntityNotFoundException extends DomainException {
  constructor(entity: string, identifier?: string | number) {
    const message = identifier
      ? `${entity} with identifier "${identifier}" not found`
      : `${entity} not found`;
    super(message);
  }
}

/**
 * Exception thrown when attempting to create a duplicate entity
 */
export class DuplicateEntityException extends DomainException {
  constructor(entity: string, field: string, value: string | number) {
    super(`${entity} with ${field} "${value}" already exists`);
  }
}

/**
 * Exception thrown when a business rule is violated
 */
export class BusinessRuleException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Exception thrown when validation fails
 */
export class ValidationException extends DomainException {
  public readonly errors: string[];

  constructor(errors: string | string[]) {
    const errorArray = Array.isArray(errors) ? errors : [errors];
    super(`Validation failed: ${errorArray.join(', ')}`);
    this.errors = errorArray;
  }
}

// ============================================
// Authentication Exceptions
// ============================================

/**
 * Exception thrown when user credentials are invalid
 */
export class InvalidCredentialsException extends DomainException {
  constructor() {
    super('Email o contraseña incorrectos');
  }
}

/**
 * Exception thrown when a user account is inactive
 */
export class UserInactiveException extends DomainException {
  constructor() {
    super('La cuenta de usuario está desactivada');
  }
}

/**
 * Exception thrown when email is already registered
 */
export class EmailAlreadyExistsException extends DomainException {
  constructor(email: string) {
    super(`El email "${email}" ya está registrado`);
  }
}

/**
 * Exception thrown when authentication is required
 */
export class UnauthorizedException extends DomainException {
  constructor(message: string = 'No autorizado') {
    super(message);
  }
}

// ============================================
// Password Reset Exceptions
// ============================================

/**
 * Exception thrown when password reset code is invalid or expired
 */
export class InvalidPasswordResetCodeException extends DomainException {
  constructor() {
    super('El código de recuperación es inválido o ha expirado');
  }
}

/**
 * Exception thrown when user is not found for password reset
 */
export class UserNotFoundException extends DomainException {
  constructor() {
    super('No existe un usuario registrado con ese correo electrónico');
  }
}
