// Script de una sola vez: agrega columnas de trazabilidad a los modelos de negocio.
// Uso: node prisma/scripts/add-trace-fields.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const modelsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'models');
const EXCLUDED = new Set([
  'AuditLog',
  'ContabilidadAuditLog',
  'Notification',
  'PasswordResetCode',
]);

const FIELDS = [
  {
    name: 'createdAt',
    map: 'created_at',
    line: 'createdAt DateTime @default(now()) @map("created_at")',
  },
  {
    name: 'updatedAt',
    map: 'updated_at',
    line: 'updatedAt DateTime @default(now()) @updatedAt @map("updated_at")',
  },
  {
    name: 'createdBy',
    map: 'created_by',
    line: 'createdBy String? @map("created_by")',
  },
  {
    name: 'updatedBy',
    map: 'updated_by',
    line: 'updatedBy String? @map("updated_by")',
  },
];

const modelRe = /^model\s+(\w+)\s*\{\n([\s\S]*?)^\}/gm;
let totalModels = 0;
let touched = 0;
const summary = [];

for (const file of readdirSync(modelsDir).filter((f) =>
  f.endsWith('.prisma'),
)) {
  const path = join(modelsDir, file);
  const src = readFileSync(path, 'utf8');
  const out = src.replace(modelRe, (whole, name, body) => {
    totalModels++;
    if (EXCLUDED.has(name)) return whole;
    const lines = body.split('\n');
    const missing = FIELDS.filter((f) => {
      const hasName = lines.some((l) =>
        new RegExp(`^\\s*${f.name}\\s`).test(l),
      );
      const hasMap = lines.some((l) => l.includes(`@map("${f.map}")`));
      return !hasName && !hasMap;
    });
    if (missing.length === 0) return whole;
    touched++;
    summary.push(`${name}: ${missing.map((f) => f.name).join(', ')}`);
    const firstAttr = lines.findIndex((l) => /^\s*@@/.test(l));
    const insert = missing.map((f) => `  ${f.line}`);
    let newLines;
    if (firstAttr === -1) {
      // body termina con '' (antes de '}')
      const end =
        lines.length && lines[lines.length - 1] === ''
          ? lines.length - 1
          : lines.length;
      newLines = [...lines.slice(0, end), '', ...insert, ...lines.slice(end)];
    } else {
      let at = firstAttr;
      while (at > 0 && lines[at - 1].trim() === '') at--;
      newLines = [...lines.slice(0, at), '', ...insert, ...lines.slice(at)];
    }
    return `model ${name} {\n${newLines.join('\n')}}`;
  });
  if (out !== src) writeFileSync(path, out);
}

console.log(summary.join('\n'));
console.log(`\nModelos totales: ${totalModels}; modificados: ${touched}`);
