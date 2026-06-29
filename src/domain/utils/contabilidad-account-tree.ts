import type { ContabilidadAccountDto, ContabilidadAccountFlatDto } from '@domain/repositories/contabilidad-account.repository';

export function buildContabilidadAccountTree(rows: ContabilidadAccountFlatDto[]): ContabilidadAccountDto[] {
  const byParent = new Map<string | null, ContabilidadAccountFlatDto[]>();

  for (const row of rows) {
    const key = row.parentId;
    const bucket = byParent.get(key) ?? [];
    bucket.push(row);
    byParent.set(key, bucket);
  }

  for (const bucket of byParent.values()) {
    bucket.sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));
  }

  function walk(parentId: string | null): ContabilidadAccountDto[] {
    const nodes = byParent.get(parentId) ?? [];
    return nodes.map((row) => {
      const children = walk(row.id);
      return {
        ...row,
        children: children.length > 0 ? children : undefined,
      };
    });
  }

  return walk(null);
}

export function flattenContabilidadAccountTree(tree: ContabilidadAccountDto[]): ContabilidadAccountDto[] {
  const out: ContabilidadAccountDto[] = [];
  const walk = (nodes: ContabilidadAccountDto[]) => {
    for (const node of nodes) {
      out.push(node);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(tree);
  return out;
}
