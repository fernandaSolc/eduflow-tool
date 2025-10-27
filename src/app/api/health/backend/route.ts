import { backendService } from '@/lib/services';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const health = await backendService.checkHealth();
    if (health.status === 'ok' || health.status === 'healthy') {
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }
    return NextResponse.json({ status: 'error', details: health }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ status: 'error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 503 });
  }
}
