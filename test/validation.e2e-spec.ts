import { Body, Controller, INestApplication, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { LoginDto } from '../src/modules/identity/presentation/dtos/auth/login.dto';
import { UpdateRentalDto } from '../src/modules/rentals/presentation/dtos/rentals/update-rental.dto';
import { AllExceptionsFilter } from '../src/shared/presentation/filters/http-exception.filter';
import { ZodValidationPipe } from '../src/shared/presentation/pipes/zod-validation.pipe';
@Controller('validation')
class ValidationController {
  @Post('login') login(@Body() body: LoginDto) {
    return body;
  }
  @Post('rental') rental(@Body() body: UpdateRentalDto) {
    return body;
  }
}
describe('validación Zod por HTTP', () => {
  let app: INestApplication<Server>;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ValidationController],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(0, '127.0.0.1');
  });
  afterAll(async () => {
    await app.close();
  });
  it('devuelve 400 y mensajes españoles al recibir propiedades desconocidas', async () => {
    const response = await request(app.getHttpServer())
      .post('/validation/login')
      .send({
        email: 'client@example.com',
        password: 'password123',
        isAdmin: true,
      })
      .expect(400);
    expect(response.body).toMatchObject({ statusCode: 400 });
    expect(JSON.stringify(response.body)).toContain('no está permitido');
  });
  it('valida credenciales antes de ejecutar el controlador', async () => {
    const response = await request(app.getHttpServer())
      .post('/validation/login')
      .send({ email: 'invalid', password: '' })
      .expect(400);
    expect(JSON.stringify(response.body)).toContain('email');
  });
  it('convierte booleanos de formulario y mantiene actualizaciones parciales', async () => {
    const response = await request(app.getHttpServer())
      .post('/validation/rental')
      .send({ enableExpirationAlerts: 'false', notes: null })
      .expect(201);
    expect(response.body).toEqual({
      enableExpirationAlerts: false,
      notes: null,
    });
  });
});
