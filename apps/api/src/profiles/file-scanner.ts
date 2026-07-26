import { Socket } from 'node:net';

export const FILE_SCANNER = Symbol('FILE_SCANNER');

export type FileScanResult =
  | { status: 'clean' }
  | { status: 'infected'; signature: string };

export interface FileScanner {
  scan(content: Buffer): Promise<FileScanResult>;
}

export class DisabledFileScanner implements FileScanner {
  async scan(): Promise<FileScanResult> {
    return { status: 'clean' };
  }
}

export type ClamAvScannerConfig = {
  host: string;
  port: number;
  timeoutMilliseconds: number;
};

export class ClamAvFileScanner implements FileScanner {
  constructor(private readonly config: ClamAvScannerConfig) {}

  scan(content: Buffer): Promise<FileScanResult> {
    return new Promise((resolve, reject) => {
      const socket = new Socket();
      const response: Buffer[] = [];
      let settled = false;

      const finish = (error?: Error, result?: FileScanResult): void => {
        if (settled) return;
        settled = true;
        socket.destroy();
        if (error) reject(error);
        else resolve(result ?? { status: 'clean' });
      };

      socket.setTimeout(this.config.timeoutMilliseconds);
      socket.once('timeout', () =>
        finish(new Error('Malware scanner timed out.')),
      );
      socket.once('error', (error) => finish(error));
      socket.on('data', (chunk: Buffer) => {
        response.push(chunk);
        if (Buffer.concat(response).length > 4096) {
          finish(new Error('Malware scanner returned an invalid response.'));
        }
      });
      socket.once('end', () => {
        const message = Buffer.concat(response)
          .toString('utf8')
          .replace(/\0+$/, '')
          .trim();
        if (message.endsWith(' OK')) {
          finish(undefined, { status: 'clean' });
          return;
        }
        const found = message.match(/: (.+) FOUND$/);
        if (found?.[1]) {
          finish(undefined, { status: 'infected', signature: found[1] });
          return;
        }
        finish(new Error('Malware scanner returned an invalid response.'));
      });
      socket.connect(this.config.port, this.config.host, () => {
        socket.write('zINSTREAM\0');
        for (let offset = 0; offset < content.length; offset += 64 * 1024) {
          const chunk = content.subarray(offset, offset + 64 * 1024);
          const length = Buffer.allocUnsafe(4);
          length.writeUInt32BE(chunk.length);
          socket.write(length);
          socket.write(chunk);
        }
        socket.end(Buffer.alloc(4));
      });
    });
  }
}
