import pino, { type Logger } from 'pino';
import { createLoggerOptions } from './logger.config';
let root: Logger | undefined;
/** Los seeds y utilidades operativas comparten una sola salida y configuración. */
export function createScriptLogger(context: string): Logger {
  if (!root) {
    const options = createLoggerOptions();
    root = options.transport
      ? pino(options)
      : pino(options, pino.destination({ dest: 1, sync: true }));
  }
  return root.child({ context });
}
