import { createHash } from 'crypto';
import { PassThrough } from 'stream';
import { ZipArchive } from 'archiver';
import type { ContabilidadPleGeneratedFile } from '@domain/repositories/contabilidad-ple.repository';

export async function buildPleZipBuffer(
  files: ContabilidadPleGeneratedFile[],
): Promise<{ buffer: Buffer; hash: string }> {
  if (!files.length) {
    const buffer = Buffer.alloc(0);
    return { buffer, hash: createHash('sha256').update(buffer).digest('hex') };
  }
  return new Promise((resolve, reject) => {
    const archive = new ZipArchive({ zlib: { level: 9 } });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const hash = createHash('sha256').update(buffer).digest('hex');
      resolve({ buffer, hash });
    });
    stream.on('error', reject);
    archive.on('error', reject);

    archive.pipe(stream);

    for (const file of files) {
      archive.append(Buffer.from(file.content, 'utf8'), { name: file.fileName });
    }

    void archive.finalize();
  });
}
