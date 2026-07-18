import posthog from 'posthog-js';

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

// Skip init when env is missing so the app still boots locally
if (token) {
  posthog.init(token, {
    api_host: host,
    defaults: '2026-05-30',
    capture_exceptions: true,
    // Session recording is heavy in Turbopack/dev and can contribute to OOM
    disable_session_recording: process.env.NODE_ENV === 'development',
    debug: false,
  });
}
