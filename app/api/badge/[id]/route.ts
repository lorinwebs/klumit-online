import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin';
import { generateBadgePng } from '../../../../lib/badge/png';
import type { BadgeData } from '../../../../components/badge/Badge';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from('reunion_badges')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 });

  // If PNG doesn't exist yet, try to generate it now
  if (!data.png_path) {
    try {
      const pngBuffer = await generateBadgePng(data as BadgeData);
      const pngPath = `badges/${id}.png`;
      const { error: uploadErr } = await admin.storage
        .from('reunion-badges')
        .upload(pngPath, pngBuffer, { contentType: 'image/png', upsert: true });

      if (!uploadErr) {
        await admin.from('reunion_badges').update({ png_path: pngPath }).eq('id', id);
        data.png_path = pngPath;
      } else {
        console.error('PNG upload error:', uploadErr);
      }
    } catch (err) {
      console.error('PNG retry error:', err);
    }
  }

  let signed_url: string | null = null;
  if (data.png_path) {
    const { data: s } = await admin.storage
      .from('reunion-badges')
      .createSignedUrl(data.png_path, 300);
    signed_url = s?.signedUrl ?? null;
  }

  return NextResponse.json({ ...data, signed_url });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 }); }

  const allowedFields = ['first_name', 'last_name', 'gender', 'marital_status', 'married_name', 'other_status', 'grade', 'city', 'occupation', 'num_children', 'monday_name'];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'אין שדות לעדכון' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { error: updateErr } = await admin
    .from('reunion_badges')
    .update(updates)
    .eq('id', id);

  if (updateErr) {
    console.error('Badge update error:', updateErr);
    return NextResponse.json({ error: 'שגיאת עדכון' }, { status: 500 });
  }

  // Fetch updated row to regenerate PNG
  const { data: row } = await admin
    .from('reunion_badges')
    .select('*')
    .eq('id', id)
    .single();

  if (row) {
    try {
      const pngBuffer = await generateBadgePng(row as BadgeData);
      const pngPath = `badges/${id}.png`;
      // Remove old file first, then upload new one
      await admin.storage.from('reunion-badges').remove([pngPath]);
      const { error: uploadErr } = await admin.storage
        .from('reunion-badges')
        .upload(pngPath, pngBuffer, { contentType: 'image/png', upsert: true });

      if (!uploadErr) {
        await admin.from('reunion_badges').update({ png_path: pngPath }).eq('id', id);
      } else {
        console.error('PNG upload error:', uploadErr);
      }
    } catch (err) {
      console.error('PNG regeneration error:', err);
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();

  // Get row to delete storage file
  const { data: row } = await admin
    .from('reunion_badges')
    .select('png_path')
    .eq('id', id)
    .single();

  if (row?.png_path) {
    await admin.storage.from('reunion-badges').remove([row.png_path]);
  }

  const { error } = await admin.from('reunion_badges').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'שגיאת מחיקה' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
