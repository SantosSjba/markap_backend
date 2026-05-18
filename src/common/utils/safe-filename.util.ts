/** Nombre de archivo seguro para object storage. */
export function safeFilename(original: string | undefined, fallback = 'file'): string {
  const base = (original || fallback).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.length > 0 ? base.slice(0, 200) : fallback;
}
