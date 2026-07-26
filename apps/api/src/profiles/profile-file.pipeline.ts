import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

import { Inject, Injectable } from '@nestjs/common';
import type { ProfileAssetKind } from '@vale/shared';
import sharp from 'sharp';

import { FILE_SCANNER, FileScanner } from './file-scanner';
import { FILE_STORAGE, FileStorage } from './file-storage';

const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
type ImageMimeType = (typeof imageMimeTypes)[number];

const extensionsByMime: Record<ImageMimeType | 'application/pdf', string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

export type SafeProfileFile = {
  storageKey: string;
  content: Buffer;
  extension: string;
  mimeType: ImageMimeType | 'application/pdf';
  sizeBytes: number;
};

export class FileSafetyError extends Error {
  constructor(
    readonly reason:
      | 'encrypted_pdf'
      | 'invalid_extension'
      | 'invalid_image'
      | 'invalid_pdf'
      | 'malware_detected'
      | 'scanner_unavailable'
      | 'size_limit'
      | 'unsafe_pdf',
    readonly stage: 'validation' | 'scan',
  ) {
    super(reason);
  }
}

type PipelineInput = {
  userId: string;
  kind: ProfileAssetKind;
  originalName: string;
  declaredMimeType: string;
  content: Buffer;
};

@Injectable()
export class ProfileFilePipeline {
  constructor(
    @Inject(FILE_STORAGE) private readonly storage: FileStorage,
    @Inject(FILE_SCANNER) private readonly scanner: FileScanner,
  ) {}

  async inspectAndPromote(input: PipelineInput): Promise<SafeProfileFile> {
    const uploadId = randomUUID();
    const quarantineKey = `quarantine/${input.userId}/${uploadId}.upload`;
    await this.storage.put(
      quarantineKey,
      input.content,
      'application/octet-stream',
    );

    try {
      const format = this.validateFormat(input);
      await this.scan(input.content);
      const processed =
        input.kind === 'resume'
          ? input.content
          : await this.reencodeImage(
              input.content,
              format.mimeType as ImageMimeType,
            );
      const storageKey =
        `approved/${input.userId}/${input.kind}/${uploadId}` + format.extension;
      await this.storage.put(storageKey, processed, format.mimeType);
      return {
        storageKey,
        content: processed,
        extension: format.extension,
        mimeType: format.mimeType,
        sizeBytes: processed.length,
      };
    } finally {
      await this.storage.delete(quarantineKey).catch(() => undefined);
    }
  }

  private validateFormat(input: PipelineInput): {
    extension: string;
    mimeType: ImageMimeType | 'application/pdf';
  } {
    const limit = input.kind === 'resume' ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
    if (input.content.length === 0 || input.content.length > limit) {
      throw new FileSafetyError('size_limit', 'validation');
    }

    if (input.kind === 'resume') {
      if (
        input.declaredMimeType !== 'application/pdf' ||
        !input.content.subarray(0, 5).equals(Buffer.from('%PDF-')) ||
        !input.content.subarray(-1024).includes(Buffer.from('%%EOF'))
      ) {
        throw new FileSafetyError('invalid_pdf', 'validation');
      }
      this.assertExtension(input.originalName, 'application/pdf');
      const structuralText = input.content.toString('latin1');
      if (/\/Encrypt\b/.test(structuralText)) {
        throw new FileSafetyError('encrypted_pdf', 'validation');
      }
      if (
        /\/(?:JavaScript|JS|Launch|EmbeddedFile|RichMedia)\b/.test(
          structuralText,
        )
      ) {
        throw new FileSafetyError('unsafe_pdf', 'validation');
      }
      return { extension: '.pdf', mimeType: 'application/pdf' };
    }

    const mimeType = imageMimeTypes.find(
      (candidate) => candidate === input.declaredMimeType,
    );
    if (!mimeType || !this.hasImageSignature(mimeType, input.content)) {
      throw new FileSafetyError('invalid_image', 'validation');
    }
    this.assertExtension(input.originalName, mimeType);
    return { extension: extensionsByMime[mimeType][0]!, mimeType };
  }

  private async scan(content: Buffer): Promise<void> {
    let result;
    try {
      result = await this.scanner.scan(content);
    } catch {
      throw new FileSafetyError('scanner_unavailable', 'scan');
    }
    if (result.status === 'infected') {
      throw new FileSafetyError('malware_detected', 'scan');
    }
  }

  private async reencodeImage(
    content: Buffer,
    mimeType: ImageMimeType,
  ): Promise<Buffer> {
    try {
      const pipeline = sharp(content, {
        failOn: 'warning',
        limitInputPixels: 20_000_000,
        sequentialRead: true,
      })
        .rotate()
        .resize({
          width: 4096,
          height: 4096,
          fit: 'inside',
          withoutEnlargement: true,
        });

      if (mimeType === 'image/jpeg') {
        return await pipeline.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
      }
      if (mimeType === 'image/png') {
        return await pipeline.png({ compressionLevel: 9 }).toBuffer();
      }
      return await pipeline.webp({ quality: 88 }).toBuffer();
    } catch {
      throw new FileSafetyError('invalid_image', 'validation');
    }
  }

  private assertExtension(
    fileName: string,
    mimeType: keyof typeof extensionsByMime,
  ): void {
    const extension = extname(fileName).toLowerCase();
    if (!extensionsByMime[mimeType].includes(extension)) {
      throw new FileSafetyError('invalid_extension', 'validation');
    }
  }

  private hasImageSignature(mimeType: ImageMimeType, content: Buffer): boolean {
    if (mimeType === 'image/jpeg') {
      return content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff;
    }
    if (mimeType === 'image/png') {
      return content
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }
    return (
      content.subarray(0, 4).toString() === 'RIFF' &&
      content.subarray(8, 12).toString() === 'WEBP'
    );
  }
}
