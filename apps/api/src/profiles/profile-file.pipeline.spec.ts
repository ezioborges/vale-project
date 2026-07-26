import sharp from 'sharp';

import { FileScanner, FileScanResult } from './file-scanner';
import { FileStorage } from './file-storage';
import { ProfileFilePipeline } from './profile-file.pipeline';

describe('ProfileFilePipeline', () => {
  let storage: MemoryFileStorage;
  let scanner: jest.Mocked<FileScanner>;
  let pipeline: ProfileFilePipeline;

  beforeEach(() => {
    storage = new MemoryFileStorage();
    scanner = {
      scan: jest.fn(
        async (_content: Buffer): Promise<FileScanResult> => ({
          status: 'clean',
        }),
      ),
    };
    pipeline = new ProfileFilePipeline(storage, scanner);
  });

  it('keeps a file quarantined until inspection and promotes only a clean PDF', async () => {
    const content = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF');

    const result = await pipeline.inspectAndPromote({
      userId: 'candidate-id',
      kind: 'resume',
      originalName: 'curriculo.pdf',
      declaredMimeType: 'application/pdf',
      content,
    });

    expect(scanner.scan).toHaveBeenCalledWith(content);
    expect(result.storageKey).toMatch(
      /^approved\/candidate-id\/resume\/.+\.pdf$/,
    );
    expect(storage.files.get(result.storageKey)).toEqual(content);
    expect([...storage.files.keys()]).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^quarantine\//)]),
    );
  });

  it.each([
    [
      'encrypted PDF',
      Buffer.from('%PDF-1.4\n/Encrypt 2 0 R\n%%EOF'),
      'encrypted_pdf',
    ],
    [
      'PDF with active content',
      Buffer.from('%PDF-1.4\n/JavaScript 2 0 R\n%%EOF'),
      'unsafe_pdf',
    ],
  ])('rejects an %s and removes quarantine', async (_name, content, reason) => {
    await expect(
      pipeline.inspectAndPromote({
        userId: 'candidate-id',
        kind: 'resume',
        originalName: 'curriculo.pdf',
        declaredMimeType: 'application/pdf',
        content,
      }),
    ).rejects.toMatchObject({ reason });

    expect(scanner.scan).not.toHaveBeenCalled();
    expect(storage.files.size).toBe(0);
  });

  it('rejects infected content without exposing the scanner signature', async () => {
    scanner.scan.mockResolvedValue({
      status: 'infected',
      signature: 'Test.Signature',
    });

    await expect(
      pipeline.inspectAndPromote({
        userId: 'candidate-id',
        kind: 'resume',
        originalName: 'curriculo.pdf',
        declaredMimeType: 'application/pdf',
        content: Buffer.from('%PDF-1.4\n%%EOF'),
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        reason: 'malware_detected',
        stage: 'scan',
      }),
    );
    expect(storage.files.size).toBe(0);
  });

  it('decodes and re-encodes images with a bounded pixel count', async () => {
    const source = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 4,
        background: '#ff0000',
      },
    })
      .png()
      .toBuffer();

    const result = await pipeline.inspectAndPromote({
      userId: 'candidate-id',
      kind: 'avatar',
      originalName: 'avatar.png',
      declaredMimeType: 'image/png',
      content: source,
    });
    const metadata = await sharp(result.content).metadata();

    expect(metadata).toMatchObject({ format: 'png', width: 2, height: 2 });
    expect(result.storageKey).toContain('/avatar/');
    expect(storage.files.size).toBe(1);
  });
});

class MemoryFileStorage implements FileStorage {
  readonly files = new Map<string, Buffer>();

  async put(key: string, content: Buffer): Promise<void> {
    this.files.set(key, Buffer.from(content));
  }

  async get(key: string): Promise<Buffer> {
    const content = this.files.get(key);
    if (!content) throw new Error('not found');
    return Buffer.from(content);
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }
}
