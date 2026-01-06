export type Env = {
  PORT: number;
  MANYCHAT_WEBHOOK_SECRET: string;
  MAKE_FACTURAS_WEBHOOK_URL: string;
  MAKE_SERVICIO_WEBHOOK_URL: string;
  MAKE_TICKETS_WEBHOOK_URL: string;
  MAKE_TIMEOUT_MS: number;
};

export const loadEnv = (): Env => {
  const PORT = Number(process.env.PORT || 3000);

  const MANYCHAT_WEBHOOK_SECRET = process.env.MANYCHAT_WEBHOOK_SECRET || '';
  const MAKE_FACTURAS_WEBHOOK_URL = process.env.MAKE_FACTURAS_WEBHOOK_URL || '';
  const MAKE_SERVICIO_WEBHOOK_URL = process.env.MAKE_SERVICIO_WEBHOOK_URL || '';
  const MAKE_TICKETS_WEBHOOK_URL = process.env.MAKE_TICKETS_WEBHOOK_URL || '';
  const MAKE_TIMEOUT_MS = Number(process.env.MAKE_TIMEOUT_MS || 12000);

  const missing: string[] = [];
  if (!MANYCHAT_WEBHOOK_SECRET) missing.push('MANYCHAT_WEBHOOK_SECRET');
  if (!MAKE_FACTURAS_WEBHOOK_URL) missing.push('MAKE_FACTURAS_WEBHOOK_URL');
  if (!MAKE_SERVICIO_WEBHOOK_URL) missing.push('MAKE_SERVICIO_WEBHOOK_URL');
  if (!MAKE_TICKETS_WEBHOOK_URL) missing.push('MAKE_TICKETS_WEBHOOK_URL');

  if (missing.length) {
    console.warn(`[WARN] Variables faltantes: ${missing.join(', ')}`);
  }

  return {
    PORT,
    MANYCHAT_WEBHOOK_SECRET,
    MAKE_FACTURAS_WEBHOOK_URL,
    MAKE_SERVICIO_WEBHOOK_URL,
    MAKE_TICKETS_WEBHOOK_URL,
    MAKE_TIMEOUT_MS,
  };
};
