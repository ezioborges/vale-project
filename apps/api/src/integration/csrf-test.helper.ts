import request, { Response } from 'supertest';

export const TEST_BROWSER_ORIGIN = 'http://localhost:3000';

type TestAgent = ReturnType<typeof request.agent>;
type UnsafeMethod = 'delete' | 'patch' | 'post' | 'put';
type TestRequest = ReturnType<TestAgent['post']>;

const protectedAgents = new WeakSet<object>();

export function enableCsrfForAgent(
  agent: TestAgent,
  sessionResponse: Response,
): void {
  if (protectedAgents.has(agent)) {
    return;
  }

  const csrfToken = sessionResponse.headers['x-csrf-token'];
  if (typeof csrfToken !== 'string') {
    throw new Error('Session response did not expose an X-CSRF-Token header.');
  }

  const target = agent as unknown as Record<
    UnsafeMethod,
    (path: string) => TestRequest
  >;
  for (const method of ['delete', 'patch', 'post', 'put'] as const) {
    const original = target[method].bind(agent);
    target[method] = (path: string) =>
      original(path)
        .set('Origin', TEST_BROWSER_ORIGIN)
        .set('X-CSRF-Token', csrfToken);
  }
  protectedAgents.add(agent);
}
