import { createHash, createHmac } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { FileStorage } from './file-storage';

export type S3StorageConfig = {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  timeoutMilliseconds: number;
  maxRetries: number;
  circuitFailureThreshold: number;
  circuitResetMilliseconds: number;
};

@Injectable()
export class S3FileStorage implements FileStorage {
  private consecutiveFailures = 0;
  private circuitOpenUntil = 0;

  constructor(private readonly config: S3StorageConfig) {}

  async put(key: string, content: Buffer, contentType: string): Promise<void> {
    await this.request('PUT', key, content, contentType);
  }

  async get(key: string): Promise<Buffer> {
    const response = await this.request('GET', key);
    return Buffer.from(await response.arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    await this.request('DELETE', key);
  }

  private async request(
    method: 'PUT' | 'GET' | 'DELETE',
    key: string,
    content?: Buffer,
    contentType?: string,
  ): Promise<Response> {
    if (Date.now() < this.circuitOpenUntil) {
      throw new Error('Object storage circuit is open.');
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt += 1) {
      try {
        const response = await this.singleRequest(
          method,
          key,
          content,
          contentType,
        );
        this.consecutiveFailures = 0;
        return response;
      } catch (error) {
        lastError = error;
        if (error instanceof StorageResponseError && !error.retryable) {
          break;
        }
        if (attempt < this.config.maxRetries) {
          await this.backoff(attempt);
        }
      }
    }

    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.config.circuitFailureThreshold) {
      this.circuitOpenUntil = Date.now() + this.config.circuitResetMilliseconds;
      this.consecutiveFailures = 0;
    }
    throw lastError instanceof Error
      ? lastError
      : new Error('Object storage request failed.');
  }

  private async singleRequest(
    method: 'PUT' | 'GET' | 'DELETE',
    key: string,
    content?: Buffer,
    contentType?: string,
  ): Promise<Response> {
    const url = this.objectUrl(key);
    const now = new Date();
    const amzDate = now
      .toISOString()
      .replace(/[:-]|\.\d{3}/g, '')
      .replace('Z', 'Z');
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = this.sha256(content ?? Buffer.alloc(0));
    let canonicalHeaders =
      `host:${url.host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    let signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    if (method === 'PUT') {
      canonicalHeaders += 'x-amz-server-side-encryption:AES256\n';
      signedHeaders += ';x-amz-server-side-encryption';
    }
    const canonicalRequest = [
      method,
      url.pathname,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');
    const scope = `${dateStamp}/${this.config.region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      scope,
      this.sha256(Buffer.from(canonicalRequest)),
    ].join('\n');
    const signature = this.sign(dateStamp, stringToSign);
    const headers: Record<string, string> = {
      Authorization:
        `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${scope}, ` +
        `SignedHeaders=${signedHeaders}, Signature=${signature}`,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    };

    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    if (method === 'PUT') {
      headers['x-amz-server-side-encryption'] = 'AES256';
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutMilliseconds,
    );
    let response: Response;
    try {
      response = await fetch(url, {
        body: content ? new Uint8Array(content) : undefined,
        headers,
        method,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      throw new StorageResponseError(
        response.status,
        response.status === 408 ||
          response.status === 429 ||
          response.status >= 500,
      );
    }

    return response;
  }

  private backoff(attempt: number): Promise<void> {
    const delay = Math.min(1000, 100 * 2 ** attempt);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  private objectUrl(key: string): URL {
    const endpoint = this.config.endpoint.replace(/\/+$/, '');
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    return new URL(
      `${endpoint}/${encodeURIComponent(this.config.bucket)}/${encodedKey}`,
    );
  }

  private sign(dateStamp: string, value: string): string {
    const dateKey = this.hmac(
      Buffer.from(`AWS4${this.config.secretAccessKey}`),
      dateStamp,
    );
    const regionKey = this.hmac(dateKey, this.config.region);
    const serviceKey = this.hmac(regionKey, 's3');
    const signingKey = this.hmac(serviceKey, 'aws4_request');
    return createHmac('sha256', signingKey).update(value).digest('hex');
  }

  private hmac(key: Buffer, value: string): Buffer {
    return createHmac('sha256', key).update(value).digest();
  }

  private sha256(value: Buffer): string {
    return createHash('sha256').update(value).digest('hex');
  }
}

class StorageResponseError extends Error {
  constructor(
    status: number,
    readonly retryable: boolean,
  ) {
    super(`Object storage request failed with ${status}.`);
  }
}
