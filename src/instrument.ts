import * as Sentry from '@sentry/nestjs';

// Server-side Sentry for the NestJS waitlist backend. This file must be imported
// FIRST in main.ts (before Nest and any instrumented modules) so the SDK can
// patch them. No Turbopack/Next concerns here — this is a plain Node/Nest app.
Sentry.init({
  dsn:
    process.env.SENTRY_DSN ??
    'https://6cf1441732c1f49620a6cf1f8d33962f@o4510959000616960.ingest.us.sentry.io/4511977935470592',
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  // Only report from real deployments, not local dev.
  enabled: process.env.NODE_ENV === 'production',
  // Light performance sampling; errors are always captured.
  tracesSampleRate: 0.1,
});
