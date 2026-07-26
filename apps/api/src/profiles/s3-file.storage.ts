import { createHash, createHmac } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { FileStorage } from './file-storage';

export type S3StorageConfig = {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
};

@Injectable()
export class S3FileStorage implements FileStorage {
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
    const url = this.objectUrl(key);
    const now = new Date();
    const amzDate = now
      .toISOString()
      .replace(/[:-]|\.\d{3}/g, '')
      .replace('Z', 'Z');
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = this.sha256(content ?? Buffer.alloc(0));
    const canonicalHeaders =
      `host:${url.host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
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

    const response = await fetch(url, {
      body: content ? new Uint8Array(content) : undefined,
      headers,
      method,
    });
    if (!response.ok) {
      throw new Error(`Object storage request failed with ${response.status}.`);
    }

    return response;
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
