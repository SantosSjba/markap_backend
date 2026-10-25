import { isIP } from 'node:net';
/** Solo se aceptan direcciones, redes o grupos de proxy explícitos; nunca confianza global. */
export function isTrustedProxyConfiguration(value: string): boolean {
  return value.split(',').every((item) => {
    const entry = item.trim();
    if (['loopback', 'linklocal', 'uniquelocal'].includes(entry)) return true;
    const [ip, prefix, ...extra] = entry.split('/');
    const version = isIP(ip);
    if (!version || extra.length) return false;
    if (prefix === undefined) return true;
    return (
      /^\d{1,3}$/.test(prefix) &&
      Number(prefix) > 0 &&
      Number(prefix) <= (version === 4 ? 32 : 128)
    );
  });
}
