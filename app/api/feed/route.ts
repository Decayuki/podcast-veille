import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

export async function GET() {
  try {
    const xmlPath = join(process.cwd(), 'public', 'podcast.xml');
    const xml = readFileSync(xmlPath, 'utf-8');
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
  }
}
