import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

import { Injectable } from '@nestjs/common';

import { FileStorage } from './file-storage';

@Injectable()
export class LocalFileStorage implements FileStorage {
  private readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  async put(key: string, content: Buffer): Promise<void> {
    const target = this.resolveKey(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content, { flag: 'wx', mode: 0o600 });
  }

  get(key: string): Promise<Buffer> {
    return readFile(this.resolveKey(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolveKey(key), { force: true });
  }

  private resolveKey(key: string): string {
    if (!/^[a-zA-Z0-9/_\-.]+$/.test(key)) {
      throw new Error('Invalid storage key.');
    }

    const target = resolve(this.root, key);
    if (!target.startsWith(`${this.root}${sep}`)) {
      throw new Error('Storage key escapes the configured root.');
    }

    return target;
  }
}
