/**
 * Hash Service Interface
 *
 * Contrato para el servicio de encriptación de contraseñas.
 */
export abstract class HashService {
  /**
   * Encripta una contraseña plana
   */
  abstract hash(plainPassword: string): Promise<string>;

  /**
   * Compara una contraseña plana con su hash
   */
  abstract compare(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
}
