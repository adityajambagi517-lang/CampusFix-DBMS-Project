import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateEmbedding, toPgVector } from '@/lib/vector';

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json();

    if (!title && !description) {
      return NextResponse.json({ matches: [] });
    }

    const text = `${title || ''} ${description || ''}`.trim();
    const embedding = generateEmbedding(text);
    const pgVectorStr = toPgVector(embedding);

    const res = await query(
      `SELECT * FROM fn_match_similar_complaints($1::vector, 0.65, 5)`,
      [pgVectorStr]
    );

    return NextResponse.json({ matches: res.rows });
  } catch (error: any) {
    console.error('Vector similarity error:', error);
    return NextResponse.json({ error: error.message || 'Similarity check failed' }, { status: 500 });
  }
}
