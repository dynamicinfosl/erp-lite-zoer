export interface NFEProviderConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  timeout: number;
  provider?: string;
  environment: 'production' | 'homologation';
}

const parseBoolean = (value?: string) =>
  typeof value === 'string' ? value.toLowerCase() === 'true' : false;

const parseNumber = (value?: string, fallback = 15000) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseEnvironment = (value?: string): 'production' | 'homologation' =>
  value === 'production' ? 'production' : 'homologation';

export const NFE_CONFIG: NFEProviderConfig = {
  enabled: parseBoolean(process.env.NFE_API_ENABLED),
  baseUrl: process.env.NFE_API_BASE_URL || '',
  apiKey: process.env.NFE_API_KEY || '',
  timeout: parseNumber(process.env.NFE_API_TIMEOUT),
  provider: process.env.NFE_API_PROVIDER,
  environment: parseEnvironment(process.env.NFE_API_ENVIRONMENT),
};

export const NFE_FEATURE_FLAGS = {
  allowManualRetry: true,
  allowSandboxFallback: true,
};

