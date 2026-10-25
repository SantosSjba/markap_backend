import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { createHttpLoggerOptions } from './logger.config';

/** Un único logger raíz; nestjs-pino propaga el contexto HTTP con AsyncLocalStorage. */
@Module({
  imports: [LoggerModule.forRoot({ pinoHttp: createHttpLoggerOptions() })],
  exports: [LoggerModule],
})
export class LoggingModule {}
