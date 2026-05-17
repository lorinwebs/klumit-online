import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { importFaceCacheObject } from '@/lib/gallery-choose/import-cache';
import type { FaceEntry } from '@/components/gallery-choose/types';

const CANDIDATE_PATHS = [
  process.env.LEGACY_FACE_CACHE_PATH,
  join(process.cwd(), 'data/face_cache.json'),
  join(process.cwd(), '../choosePictures/face_cache.json'),
  '/Users/lorin/Devs/private/choosePictures/face_cache.json',
].filter((p): p is string => Boolean(p));

export async function POST(request: NextRequest) {
  try {
    let raw: Record<string, FaceEntry | number> | null = null;
    let source = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (body?.data && typeof body.data === 'object') {
        raw = body.data;
        source = 'upload';
      }
    }

    if (!raw) {
      for (const p of CANDIDATE_PATHS) {
        if (existsSync(p)) {
          raw = JSON.parse(readFileSync(p, 'utf-8'));
          source = p;
          break;
        }
      }
    }

    if (!raw) {
      return NextResponse.json(
        {
          error:
            'לא נמצא face_cache.json — העלי קובץ או הריצי: npx tsx scripts/import-gallery-choose-cache.ts ../choosePictures/face_cache.json',
          tried: CANDIDATE_PATHS,
        },
        { status: 404 },
      );
    }

    const imported = await importFaceCacheObject(raw, true);

    return NextResponse.json({ ok: true, imported, source });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'import failed' },
      { status: 500 },
    );
  }
}
