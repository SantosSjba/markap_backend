const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { isBuiltin } = require('node:module');
const root = path.resolve(__dirname, '..');
const config = ts.readConfigFile(
  path.join(root, 'tsconfig.json'),
  ts.sys.readFile,
);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const files = parsed.fileNames.filter(
  (f) => f.startsWith(path.join(root, 'src/')) && !f.endsWith('.spec.ts'),
);
const errors = [];
const graph = new Map();
const externalAdapters =
  /^(?:@prisma\/|@aws-sdk\/|xlsx$|exceljs$|pdfkit$|archiver$|pg$|nodemailer$|bcrypt$|jsonwebtoken$|socket\.io$)/;
for (const file of files) {
  const sf = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const layer = file.includes('/domain/')
    ? 'domain'
    : file.includes('/application/')
      ? 'application'
      : 'outer';
  const edges = [];
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText(sf) === 'console'
    )
      errors.push(
        'Salida de consola fuera del logger: ' + path.relative(root, file),
      );
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const spec = node.moduleSpecifier;
      if (!spec || !ts.isStringLiteral(spec)) return;
      const target = ts.resolveModuleName(
        spec.text,
        file,
        parsed.options,
        ts.sys,
      ).resolvedModule?.resolvedFileName;
      if (['class-validator', 'class-transformer', 'joi'].includes(spec.text))
        errors.push(
          'Validación heredada: ' +
            path.relative(root, file) +
            ' -> ' +
            spec.text,
        );
      const local = target?.startsWith(path.join(root, 'src/'));
      if (
        file.endsWith('.controller.ts') &&
        ((local && target.includes('/infrastructure/')) ||
          externalAdapters.test(spec.text))
      )
        errors.push(
          'Controlador acoplado a adaptador: ' +
            path.relative(root, file) +
            ' -> ' +
            spec.text,
        );
      const label = path.relative(root, file) + ' -> ' + spec.text;
      if (!target && !isBuiltin(spec.text))
        errors.push('Import no resuelto: ' + label);
      if (
        layer === 'domain' &&
        ((local &&
          /\/(application|infrastructure|presentation|composition)\//.test(
            target,
          )) ||
          /^@nestjs\//.test(spec.text))
      )
        errors.push('Dependencia externa al dominio: ' + label);
      if (layer !== 'outer' && externalAdapters.test(spec.text))
        errors.push('Adaptador en capa interna: ' + label);
      if (
        layer === 'application' &&
        local &&
        /\/(infrastructure|presentation|composition)\//.test(target)
      )
        errors.push('Dependencia invertida: ' + label);
      const typeOnly =
        ts.isImportDeclaration(node) &&
        (node.importClause?.isTypeOnly ||
          (node.importClause?.namedBindings &&
            ts.isNamedImports(node.importClause.namedBindings) &&
            node.importClause.namedBindings.elements.every(
              (e) => e.isTypeOnly,
            )));
      if (local && !typeOnly && !node.isTypeOnly) edges.push(target);
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  graph.set(file, edges);
}
const visiting = new Set(),
  visited = new Set();
function visit(file, chain) {
  if (visiting.has(file)) {
    errors.push(
      'Ciclo de imports: ' +
        [...chain.slice(chain.indexOf(file)), file]
          .map((f) => path.relative(root, f))
          .join(' -> '),
    );
    return;
  }
  if (visited.has(file)) return;
  visiting.add(file);
  for (const next of graph.get(file) || []) visit(next, [...chain, file]);
  visiting.delete(file);
  visited.add(file);
}
for (const file of files) visit(file, []);
if (errors.length) {
  console.error([...new Set(errors)].join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `Arquitectura válida: ${files.length} archivos; capas internas sin adaptadores y sin ciclos de imports de ejecución.`,
  );
