import { NextRequest, NextResponse } from 'next/server';
import { PRESET_SITTERS } from '@/lib/babysitter-summer-rows';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('summer_babysitter_shifts')
      .select('shift_date, sitter_name')
      .order('shift_date', { ascending: true })
      .order('sitter_name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const assignments: Record<string, string[]> = {};
    const nameSet = new Set<string>(PRESET_SITTERS);
    for (const row of data ?? []) {
      if (!row.sitter_name) continue;
      nameSet.add(row.sitter_name);
      const key = row.shift_date as string;
      if (!assignments[key]) assignments[key] = [];
      assignments[key].push(row.sitter_name);
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
    const shift_date = body.shift_date as string | undefined;
    const sitter_name = body.sitter_name as string | null | undefined;
    const action = (body.action as string | undefined) ?? 'set';

    if (!shift_date || !/^\d{4}-\d{2}-\d{2}$/.test(shift_date)) {
      return NextResponse.json({ error: 'Invalid shift_date' }, { status: 400 });
    }

    if (action === 'clear') {
      const { error } = await supabase
        .from('summer_babysitter_shifts')
        .delete()
        .eq('shift_date', shift_date);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, shift_date, sitter_names: [] });
    }

    if (sitter_name === null || sitter_name === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const trimmed = String(sitter_name).trim();
    if (!trimmed) {
      return NextResponse.json({ error: 'Name is empty' }, { status: 400 });
    }

    if (action === 'remove') {
      const { error } = await supabase
        .from('summer_babysitter_shifts')
        .delete()
        .eq('shift_date', shift_date)
        .eq('sitter_name', trimmed);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, shift_date, sitter_name: trimmed, action: 'remove' });
    }

    const { error } = await supabase.from('summer_babysitter_shifts').upsert(
      { shift_date, sitter_name: trimmed, updated_at: new Date().toISOString() },
      { onConflict: 'shift_date,sitter_name' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, shift_date, sitter_name: trimmed, action: 'add' });
  } catch {
    return NextResponse.json({ error: 'Failed to save shift' }, { status: 500 });
  }
}
