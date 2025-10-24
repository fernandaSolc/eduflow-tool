import { aiService } from '@/lib/ai-service';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // defaults to auto

export async function GET() {
  try {
    const health = await aiService.checkHealth();
    if (health.status === 'ok') {
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }
    return NextResponse.json({ status: 'error', details: health }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ status: 'error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 503 });
  }
}
