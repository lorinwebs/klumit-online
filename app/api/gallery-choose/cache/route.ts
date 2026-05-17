import { NextRequest, NextResponse } from 'next/server';
import {
  clearAnalysisCache,
  loadAnalysisCache,
  saveAnalysisBatch,
} from '@/lib/gallery-choose/db';
import type { FaceEntry } from '@/components/gallery-choose/types';

export async function GET() {
  try {
    const data = await loadAnalysisCache();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'failed' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const incoming = (await request.json()) as Record<string, FaceEntry | boolean>;

    if (incoming._clear) {
      await clearAnalysisCache();
      return NextResponse.json({ ok: true, total: 0 });
    }

    const batch = Object.fromEntries(
      Object.entries(incoming).filter(([k]) => !k.startsWith('_')),
    ) as Record<string, FaceEntry>;

    const replace = !!incoming._replace;
    const total = await saveAnalysisBatch(batch, replace);
    return NextResponse.json({ ok: true, total });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'failed' },
      { status: 500 },
    );
  }
}
