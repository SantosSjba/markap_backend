/**
 * Tipos reutilizables para archivos subidos (multer, memory storage).
 * Usar en controladores que reciben archivos con FileFieldsInterceptor o FileInterceptor.
 */

/** Estructura de un archivo subido (multer en memoria) */
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding?: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Mapa de nombres de campo a array de archivos (FileFieldsInterceptor) */
export type UploadedFilesMap<T extends string = string> = Partial<
  Record<T, UploadedFile[]>
>;

/** Obtiene el primer archivo de un campo, si existe */
export function getFirstFile(
  files: UploadedFile[] | undefined,
): UploadedFile | undefined {
  return files?.length ? files[0] : undefined;
}
