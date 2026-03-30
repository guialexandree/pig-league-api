import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const parseCorsOrigins = (value?: string): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

export const buildCorsOptions = (): CorsOptions => {
  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);

  return {
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  };
};
