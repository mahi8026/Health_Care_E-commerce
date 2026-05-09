const Sentry = require('@sentry/node');

function initSentry(app) {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  // Only load profiling integration if Sentry is configured
  let integrations = [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ];

  // Try to load profiling integration (optional)
  try {
    const { ProfilingIntegration } = require('@sentry/profiling-node');
    integrations.push(new ProfilingIntegration());
  } catch (error) {
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    integrations,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });

  // Request handler must be the first middleware
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

function sentryErrorHandler() {
  // Only return Sentry error handler if Sentry is configured
  if (!process.env.SENTRY_DSN) {
    // Return a no-op middleware if Sentry is not configured
    return (err, req, res, next) => {
      next(err);
    };
  }
  return Sentry.Handlers.errorHandler();
}

module.exports = { initSentry, sentryErrorHandler, Sentry };
