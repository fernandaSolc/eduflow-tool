import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/api-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 900; // 15 minutos

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        return res;
    } finally {
        clearTimeout(id);
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const requestId = req.headers.get('x-request-id') || undefined;

        const res = await fetchWithTimeout(
            `${API_CONFIG.AI_SERVICE.BASE_URL}${API_CONFIG.AI_SERVICE.ENDPOINTS.BOOKS_CHAPTER}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_CONFIG.AI_SERVICE.API_KEY as string,
                    ...(requestId ? { 'x-request-id': requestId } : {})
                },
                body: JSON.stringify(body)
            },
            15 * 60 * 1000
        );

        if (!res.ok) {
            const text = await res.text();
            return NextResponse.json({ error: text || 'Erro no AI Service' }, { status: res.status });
        }
        const json = await res.json();
        return NextResponse.json(json, { status: 200 });
    } catch (err: any) {
        const isAbort = err?.name === 'AbortError';
        return NextResponse.json(
            { error: isAbort ? 'Timeout ao aguardar resposta da IA' : (err?.message || 'Erro inesperado') },
            { status: isAbort ? 504 : 500 }
        );
    }
}


