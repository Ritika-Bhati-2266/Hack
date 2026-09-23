import { NextRequest, NextResponse } from 'next/server';

// In-memory history (replace with Supabase/Prisma for prod)
// Persists per server instance - demo-ready
interface SimEntry {
  id: string;
  timestamp: string;
  itemName: string;
  price: number;
  mode: string;
  verdict: string;
  feedback?: 'bought' | 'skipped' | null;
  [key: string]: unknown;
}

let history: SimEntry[] = [];

export async function GET() {
  return NextResponse.json({ count: history.length, history: history.slice(-20).reverse() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.itemName || typeof body.purchasePrice !== 'number') {
      return NextResponse.json({ error: 'itemName and purchasePrice required' }, { status: 400 });
    }
    const entry: SimEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...body,
    };
    history.push(entry);
    if (history.length > 100) history = history.slice(-100);
    return NextResponse.json({ ok: true, entry }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
}

export async function DELETE() {
  history = [];
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id || !['bought', 'skipped'].includes(body.feedback)) {
      return NextResponse.json({ error: 'id and feedback (bought|skipped) required' }, { status: 400 });
    }
    const entry = history.find((h) => h.id === String(body.id));
    if (!entry) return NextResponse.json({ error: 'not found' }, { status: 404 });
    entry.feedback = body.feedback;
    return NextResponse.json({ ok: true, entry });
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
}
