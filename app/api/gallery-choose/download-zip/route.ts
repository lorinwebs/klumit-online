import { NextRequest, NextResponse } from 'next/server';
import { buildSelectedZip, type ZipItem } from '@/lib/gallery-choose/zip';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    let items: ZipItem[] = payload.items;
    if (!items && payload.paths) {
      items = (payload.paths as string[]).map((path) => ({ path }));
    }
    if (!items?.length) {
      return NextResponse.json({ error: 'no items' }, { status: 400 });
    }

    const { data, ok, fail } = await buildSelectedZip(items);

    return new NextResponse(Buffer.from(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="reunion_selected_${ok}.zip"`,
        'X-Downloaded-Count': String(ok),
        'X-Failed-Count': String(fail),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'failed' },
      { status: 500 },
    );
  }
}
