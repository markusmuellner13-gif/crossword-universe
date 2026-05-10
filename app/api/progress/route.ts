import { NextRequest, NextResponse } from 'next/server';
import { getProgress, upsertProgress } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get('sessionId');
  if (!sid) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  const data = await getProgress(sid);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, ...updates } = body;
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

  // Merge completed puzzles
  if (updates.completed_puzzles) {
    const existing = await getProgress(sessionId);
    const existingCompleted: string[] = existing?.completed_puzzles ?? [];
    updates.completed_puzzles = [...new Set([...existingCompleted, ...updates.completed_puzzles])];
  }

  const data = await upsertProgress(sessionId, updates);
  return NextResponse.json(data ?? { ok: true });
}
