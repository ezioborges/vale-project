export const FILE_STORAGE = Symbol('FILE_STORAGE');

export interface FileStorage {
  put(key: string, content: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}
