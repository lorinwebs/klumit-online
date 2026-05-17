import { NextRequest, NextResponse } from 'next/server';
import { loadImageB64, scorePhoto } from '@/lib/gallery-choose/openai';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { imgB64, contentType } = await loadImageB64(payload);
    const parsed = await scorePhoto(imgB64, contentType);
    return NextResponse.json(parsed);
  } catch (e) {
    const err = e as Error & { status?: number; retryAfter?: number };
    const is429 = err.status === 429 || String(err.message).includes('429');
    return NextResponse.json(
      { error: err.message, retry_after: is429 ? err.retryAfter || 30 : 0 },
      { status: is429 ? 429 : 500 },
    );
  }
}
