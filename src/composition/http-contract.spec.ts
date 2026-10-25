import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

function controllers(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory()
      ? controllers(file)
      : file.endsWith('.controller.ts')
        ? [file]
        : [];
  });
}

it('conserva los contratos HTTP y los decoradores de autorización de todos los controladores', () => {
  const root = path.resolve(__dirname, '../..');
  const actual = controllers(path.join(root, 'src')).flatMap((file) => {
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    const printer = ts.createPrinter({ removeComments: true });
    const canonical = (text: string) =>
      printer
        .printFile(
          ts.createSourceFile(
            'decorator.ts',
            text,
            ts.ScriptTarget.Latest,
            true,
          ),
        )
        .replace(/\s/g, '');
    return source.statements.flatMap((node) => {
      if (!ts.isClassDeclaration(node)) return [];
      const classDecorators = (ts.getDecorators(node) || []).map((d) =>
        d.expression.getText(source),
      );
      return node.members.flatMap((method) => {
        const decorators = ts.canHaveDecorators(method)
          ? ts.getDecorators(method) || []
          : [];
        if (!decorators.length) return [];
        return [
          {
            controller: node.name!.text,
            classDecorators: classDecorators.map(canonical),
            method: method.name!.getText(source),
            decorators: decorators.map((d) =>
              canonical(d.expression.getText(source)),
            ),
          },
        ];
      });
    });
  });
  const printer = ts.createPrinter({ removeComments: true });
  const canonical = (text: string) =>
    printer
      .printFile(
        ts.createSourceFile('decorator.ts', text, ts.ScriptTarget.Latest, true),
      )
      .replace(/\s/g, '');
  const expected = (
    JSON.parse(
      fs.readFileSync(
        path.join(root, 'test/contracts/http-routes.json'),
        'utf8',
      ),
    ) as {
      controller: string;
      classDecorators: string[];
      method: string;
      decorators: string[];
    }[]
  ).map((item) => ({
    ...item,
    classDecorators: item.classDecorators.map(canonical),
    decorators: item.decorators.map(canonical),
  }));
  const order = (
    a: { controller: string; method: string },
    b: { controller: string; method: string },
  ) =>
    `${a.controller}.${a.method}`.localeCompare(`${b.controller}.${b.method}`);
  expect(actual.sort(order)).toEqual(expected.sort(order));
});
