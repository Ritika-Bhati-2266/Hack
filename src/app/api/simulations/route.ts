import { NextRequest, NextResponse } from 'next/server';

// In-memory history (replace with Supabase/Prisma for prod)
// Persists per server instance - demo-ready
let history: any[] = [];

export async function GET() {
  return NextResponse.json({ count: history.length, history: history.slice(-20).reverse() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.itemName || typeof body.purchasePrice !== 'number') {
      return NextResponse.json({ error: 'itemName and purchasePrice required' }, { status: 400 });
    }
    const entry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...body,
    };
    history.push(entry);
    if (history.length > 100) history = history.slice(-100);
    return NextResponse.json({ ok: true, entry }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
}

export async function DELETE() {
  history = [];
  return NextResponse.json({ ok: true });
}
