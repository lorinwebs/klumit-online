import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('tiberia_shifts')
      .select('weekend_date, guard_name')
      .order('weekend_date', { ascending: true })
      .order('guard_name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const assignments: Record<string, string[]> = {};
    const nameSet = new Set<string>();
    for (const row of data ?? []) {
      if (!row.guard_name) continue;
      nameSet.add(row.guard_name);
      if (!assignments[row.weekend_date]) assignments[row.weekend_date] = [];
      assignments[row.weekend_date].push(row.guard_name);
    }

    for (const key of Object.keys(assignments)) {
      assignments[key].sort((a, b) => a.localeCompare(b, 'he'));
    }

    return NextResponse.json({
      assignments,
      names: [...nameSet].sort((a, b) => a.localeCompare(b, 'he')),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load shifts' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const body = await request.json();
    const weekend_date = body.weekend_date as string | undefined;
    const guard_name = body.guard_name as string | null | undefined;
    const action = (body.action as string | undefined) ?? 'set';

    if (!weekend_date || !/^\d{4}-\d{2}-\d{2}$/.test(weekend_date)) {
      return NextResponse.json({ error: 'Invalid weekend_date' }, { status: 400 });
    }

    if (action === 'clear') {
      const { error } = await supabase.from('tiberia_shifts').delete().eq('weekend_date', weekend_date);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, weekend_date, guard_names: [] });
    }

    if (guard_name === null || guard_name === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const trimmed = String(guard_name).trim();
    if (!trimmed) {
      return NextResponse.json({ error: 'Name is empty' }, { status: 400 });
    }

    if (action === 'remove') {
      const { error } = await supabase
        .from('tiberia_shifts')
        .delete()
        .eq('weekend_date', weekend_date)
        .eq('guard_name', trimmed);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, weekend_date, guard_name: trimmed, action: 'remove' });
    }

    const { error } = await supabase.from('tiberia_shifts').upsert(
      { weekend_date, guard_name: trimmed, updated_at: new Date().toISOString() },
      { onConflict: 'weekend_date,guard_name' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, weekend_date, guard_name: trimmed, action: 'add' });
  } catch {
    return NextResponse.json({ error: 'Failed to save shift' }, { status: 500 });
  }
}
