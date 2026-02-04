import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

export function initSentry() {
    if (process.env.SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            integrations: [
                nodeProfilingIntegration(),
            ],
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
            environment: process.env.NODE_ENV || 'development',
            enabled: process.env.NODE_ENV === 'production',
        });
    }
}

const SentryExport = Sentry.default || Sentry;
export default SentryExport;
