import { S3FileStorage } from './s3-file.storage';

describe('S3FileStorage resilience', () => {
  const config = {
    endpoint: 'https://storage.example',
    bucket: 'private-files',
    region: 'auto',
    accessKeyId: 'access-key',
    secretAccessKey: 'secret-key',
    timeoutMilliseconds: 1000,
    maxRetries: 1,
    circuitFailureThreshold: 2,
    circuitResetMilliseconds: 30_000,
  };
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('encrypts uploads and retries a transient storage response', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    global.fetch = fetchMock;
    const storage = new S3FileStorage(config);

    await storage.put(
      'approved/user/file.pdf',
      Buffer.from('safe'),
      'text/pdf',
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const init = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({
      'x-amz-server-side-encryption': 'AES256',
    });
    expect((init.headers as Record<string, string>).Authorization).toContain(
      'x-amz-server-side-encryption',
    );
  });

  it('opens the circuit after consecutive exhausted failures', async () => {
    global.fetch = jest.fn(async () => {
      throw new Error('network down');
    });
    const storage = new S3FileStorage({
      ...config,
      maxRetries: 0,
      circuitFailureThreshold: 1,
    });

    await expect(storage.get('approved/user/file.pdf')).rejects.toThrow(
      'network down',
    );
    await expect(storage.get('approved/user/file.pdf')).rejects.toThrow(
      'circuit is open',
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
