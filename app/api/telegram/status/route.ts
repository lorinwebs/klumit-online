import { NextResponse } from 'next/server';
import { getWebsiteTelegramStatus } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

/**
 * GET — safe diagnostics (no tokens). Open on production:
 * https://www.klumit-online.co.il/api/telegram/status
 */
export async function GET() {
  return NextResponse.json(getWebsiteTelegramStatus());
}
