import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { FIELD_LABELS } from './field-labels';

/** "lines.0.debit" → "debe (fila 1 de líneas)". */
export function describeField(path: PropertyKey[]): string {
  const leaf = String(path[path.length - 1] ?? 'datos');
  const label = FIELD_LABELS[leaf] ?? leaf;
  const rowIndex = path.length >= 2 ? Number(path[path.length - 2]) : NaN;
  if (Number.isInteger(rowIndex)) {
    const list = path[path.length - 3];
    const listLabel = list ? (FIELD_LABELS[String(list)] ?? String(list)) : '';
    return `${label} (fila ${rowIndex + 1}${listLabel ? ` de ${listLabel}` : ''})`;
  }
  return label;
}
function issueMessage(issue: z.core.$ZodIssue): string[] {
  const field = describeField(issue.path);
  if (issue.code === 'unrecognized_keys')
    return issue.keys.map(
      (key) =>
        `El campo «${describeField([...issue.path, key])}» no está permitido.`,
    );
  // Conserva mensajes de dominio y reglas personalizadas; amplía el nombre para listas anidadas.
  if (issue.message.startsWith('Debe '))
    return [
      `El campo «${field}» ${issue.message[0].toLowerCase() + issue.message.slice(1)}`,
    ];
  if (!/^(Invalid|Too |Required|Expected)/.test(issue.message)) {
    return [issue.message.replace(/«[^»]+»/, `«${field}»`)];
  }
  let message = 'no es válido';
  if (issue.code === 'invalid_type')
    message = /received undefined/.test(issue.message)
      ? 'es obligatorio'
      : ((
          {
            string: 'debe ser un texto',
            number: 'debe ser un número válido',
            boolean: 'debe ser verdadero o falso',
            array: 'debe ser una lista',
            object: 'no tiene un formato válido',
          } as Record<string, string>
        )[issue.expected] ?? 'no tiene un formato válido');
  if (issue.code === 'invalid_value') message = 'no es una opción permitida';
  if (issue.code === 'invalid_format')
    message =
      issue.format === 'email'
        ? 'debe ser un correo electrónico válido'
        : issue.format === 'uuid'
          ? 'no tiene un identificador válido'
          : issue.format === 'date' || issue.format === 'datetime'
            ? 'debe ser una fecha válida'
            : 'no tiene un formato válido';
  if (issue.code === 'too_small')
    message =
      issue.origin === 'string'
        ? 'es demasiado corto'
        : 'es menor que el mínimo permitido';
  if (issue.code === 'too_big')
    message =
      issue.origin === 'string'
        ? 'es demasiado largo'
        : 'supera el máximo permitido';
  if (issue.code === 'invalid_union')
    return [`El campo «${field}» no tiene un formato válido.`];
  return [`El campo «${field}» ${message}.`];
}
export function validationExceptionFactory(error: z.ZodError) {
  return new BadRequestException([
    ...new Set(error.issues.flatMap(issueMessage)),
  ]);
}
