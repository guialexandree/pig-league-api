import { buildCorsOptions } from '@/config/cors.config';

describe('buildCorsOptions', () => {
  const originalCorsOrigin = process.env.CORS_ORIGIN;

  afterEach(() => {
    if (originalCorsOrigin === undefined) {
      delete process.env.CORS_ORIGIN;
      return;
    }

    process.env.CORS_ORIGIN = originalCorsOrigin;
  });

  it('returns wildcard-like policy when CORS_ORIGIN is not set', () => {
    delete process.env.CORS_ORIGIN;

    expect(buildCorsOptions().origin).toBe(true);
  });

  it('returns sanitized origins from CORS_ORIGIN', () => {
    const firstOrigin = 'https://app.pigleague.dev';
    const secondOrigin = 'https://admin.pigleague.dev';

    process.env.CORS_ORIGIN = ` ${firstOrigin},, ${secondOrigin} `;

    expect(buildCorsOptions().origin).toEqual([firstOrigin, secondOrigin]);
  });
});
