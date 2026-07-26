import { describe, expect, it } from 'vitest';

import { middleware } from './middleware';

describe('trusted session routing boundary', () => {
  it('delegates protected routing to the API-backed layout', () => {
    const response = middleware();

    expect(response.headers.get('location')).toBeNull();
    expect(response.status).toBe(200);
  });

  it('does not decode or make decisions from an access-token payload', () => {
    expect(middleware().headers.get('location')).toBeNull();
  });
});
