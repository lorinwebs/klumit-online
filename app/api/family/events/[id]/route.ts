import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { notifyEventDeleted, notifyEventUpdated } from '@/lib/telegram-family';

// PUT /api/family/events/:id
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdminClient();
    const body = await request.json();

    const { title, person, category, start_time, end_time, recurring, reminder_minutes, notes } = body;

    const { data: previousEvent, error: previousEventError } = await supabase
      .from('family_events')
      .select('title, person, category, start_time, end_time')
      .eq('id', id)
      .single();

    if (previousEventError) return NextResponse.json({ error: previousEventError.message }, { status: 500 });

    const { data, error } = await supabase
      .from('family_events')
      .update({
        title,
        person,
        category,
        start_time,
        end_time,
        recurring: recurring || false,
        reminder_minutes: reminder_minutes || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    notifyEventUpdated(
      previousEvent,
      { title, person, category, start_time, end_time }
    ).catch(() => {});

    return NextResponse.json({ event: data });
  } catch {
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

// DELETE /api/family/events/:id
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    const { data: eventToDelete, error: eventToDeleteError } = await supabase
      .from('family_events')
      .select('title, person, category, start_time, end_time')
      .eq('id', id)
      .single();

    if (eventToDeleteError) return NextResponse.json({ error: eventToDeleteError.message }, { status: 500 });

    const { error } = await supabase
      .from('family_events')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    notifyEventDeleted(eventToDelete).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
