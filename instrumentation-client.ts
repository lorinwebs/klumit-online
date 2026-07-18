import posthog from 'posthog-js';

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (token) {
  posthog.init(token, {
    api_host: 'https://e.klumit-online.co.il',
    ui_host: 'https://eu.posthog.com',
    defaults: '2026-05-30',
    // Explicit so iOS Safari / mobile web visitors get full interaction capture
    autocapture: true,
    capture_pageview: 'history_change',
    capture_pageleave: true,
    capture_heatmaps: true,
    capture_exceptions: true,
  });
}
