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
/** Nombres legibles de las entidades para los mensajes que ve el usuario. */
const ENTITY_LABELS: Record<string, string> = {
  Application: 'La aplicación',
  ContabilidadPeriod: 'El periodo contable',
  Period: 'El periodo',
  Client: 'El cliente',
  SaleProcess: 'El proceso de venta',
  Property: 'La propiedad',
  Agent: 'El agente',
  Role: 'El rol',
  ContabilidadJournalEntry: 'El asiento contable',
  SaleClosing: 'El cierre de venta',
  ContabilidadAccount: 'La cuenta contable',
  Rental: 'El contrato de alquiler',
  InteriorProject: 'El proyecto',
  ArquitecturaProject: 'El proyecto',
  ContabilidadJournalTemplate: 'La plantilla de asiento',
  SaleSeparation: 'La separación',
  ContabilidadSalesInvoice: 'El comprobante de venta',
  ContabilidadCostCenter: 'El centro de costo',
  User: 'El usuario',
  SaleProcessReminder: 'El recordatorio',
  SaleCommissionPaymentPart: 'La cuota de comisión',
  SaleCommission: 'La comisión',
  SaleBuyerPayment: 'El pago del comprador',
  ContabilidadSupplier: 'El proveedor',
  ContabilidadPurchaseInvoice: 'La factura de compra',
  ContabilidadInventoryItem: 'El ítem de inventario',
  ContabilidadCustomer: 'El cliente',
  ContabilidadCashBox: 'La caja',
  ContabilidadBankAccount: 'La cuenta bancaria',
};

const FIELD_LABELS: Record<string, string> = {
  code: 'código',
  slug: 'identificador',
  email: 'correo',
};

function entityLabel(entity: string): string {
  return ENTITY_LABELS[entity] ?? 'El registro';
}

export class EntityNotFoundException extends DomainException {
  // El identificador no se muestra: no aporta al usuario y expone datos internos.
  constructor(entity: string, identifier?: string | number) {
    void identifier;
    super(
      `${entityLabel(entity)} no existe o fue eliminado. Actualiza la página e inténtalo nuevamente.`,
    );
  }
}

/**
 * Exception thrown when attempting to create a duplicate entity
 */
export class DuplicateEntityException extends DomainException {
  constructor(entity: string, field: string, value: string | number) {
    const indefinite = entityLabel(entity)
      .replace(/^El /, 'un ')
      .replace(/^La /, 'una ');
    super(
      `Ya existe ${indefinite} con el ${FIELD_LABELS[field] ?? field} "${value}".`,
    );
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
    super(`Datos no válidos: ${errorArray.join(', ')}`);
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
