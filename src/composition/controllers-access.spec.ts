import 'reflect-metadata';
import { ApiModule } from './api.module';
import {
  APPLICATION_REQUIREMENT,
  APPLICATION_SKIP,
} from '../shared/presentation/decorators/application-access.decorators';
it('todos los controladores registrados declaran su política de aplicación', () => {
  const visited = new Set<unknown>(),
    missing: string[] = [];
  function visit(module: unknown) {
    if (!module || visited.has(module)) return;
    visited.add(module);
    if (typeof module === 'object' && 'module' in module) {
      visit(module.module);
      return;
    }
    for (const c of (Reflect.getMetadata('controllers', module) ?? []) as {
      name: string;
    }[])
      if (
        !Reflect.hasMetadata(APPLICATION_REQUIREMENT, c) &&
        !Reflect.hasMetadata(APPLICATION_SKIP, c)
      )
        missing.push(c.name);
    for (const m of (Reflect.getMetadata('imports', module) ?? []) as unknown[])
      visit(m);
  }
  visit(ApiModule);
  expect(missing).toEqual([]);
});
