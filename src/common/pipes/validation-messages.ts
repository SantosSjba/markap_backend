import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

/**
 * Mensajes en español para las reglas de class-validator. Los DTO que ya
 * definen `message` conservan su texto; solo se traducen los mensajes por
 * defecto (en inglés), que empiezan con el nombre del campo.
 */
const CONSTRAINT_MESSAGES: Record<string, (field: string) => string> = {
  isNotEmpty: (f) => `El campo «${f}» es obligatorio.`,
  isDefined: (f) => `El campo «${f}» es obligatorio.`,
  isString: (f) => `El campo «${f}» debe ser un texto.`,
  isNumber: (f) => `El campo «${f}» debe ser un número válido.`,
  isInt: (f) => `El campo «${f}» debe ser un número entero.`,
  isPositive: (f) => `El campo «${f}» debe ser mayor que cero.`,
  min: (f) => `El campo «${f}» es menor que el mínimo permitido.`,
  max: (f) => `El campo «${f}» supera el máximo permitido.`,
  minLength: (f) => `El campo «${f}» es demasiado corto.`,
  maxLength: (f) => `El campo «${f}» es demasiado largo.`,
  isLength: (f) => `El campo «${f}» no tiene la longitud permitida.`,
  isUuid: (f) => `El campo «${f}» no tiene un identificador válido.`,
  isDateString: (f) => `El campo «${f}» debe ser una fecha válida.`,
  isDate: (f) => `El campo «${f}» debe ser una fecha válida.`,
  isIn: (f) => `El valor del campo «${f}» no es una opción permitida.`,
  isEnum: (f) => `El valor del campo «${f}» no es una opción permitida.`,
  isBoolean: (f) => `El campo «${f}» debe ser verdadero o falso.`,
  isArray: (f) => `El campo «${f}» debe ser una lista.`,
  arrayNotEmpty: (f) => `El campo «${f}» debe tener al menos un elemento.`,
  arrayMinSize: (f) => `El campo «${f}» no tiene suficientes elementos.`,
  isObject: (f) => `El campo «${f}» no tiene un formato válido.`,
  isEmail: (f) => `El campo «${f}» debe ser un correo electrónico válido.`,
  matches: (f) => `El campo «${f}» no tiene un formato válido.`,
  whitelistValidation: (f) => `El campo «${f}» no está permitido.`,
};

function isDefaultMessage(message: string, field: string): boolean {
  return (
    message.startsWith(`${field} `) ||
    message.startsWith('each value in ') ||
    message.startsWith('property ') ||
    message.startsWith('nested property ')
  );
}

function collect(errors: ValidationError[], parent = ''): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    const field = parent ? `${parent}.${error.property}` : error.property;
    for (const [constraint, message] of Object.entries(
      error.constraints ?? {},
    )) {
      const translate = CONSTRAINT_MESSAGES[constraint];
      messages.push(
        isDefaultMessage(message, error.property)
          ? (translate?.(field) ?? `El campo «${field}» no es válido.`)
          : message,
      );
    }
    if (error.children?.length)
      messages.push(...collect(error.children, field));
  }
  return [...new Set(messages)];
}

export function validationExceptionFactory(errors: ValidationError[]) {
  return new BadRequestException(collect(errors));
}
