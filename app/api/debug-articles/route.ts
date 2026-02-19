import { NextResponse } from 'next/server';
import { shopifyClient, ARTICLES_QUERY } from '@/lib/shopify';

export async function GET() {
  try {
    const data = await shopifyClient.request<{
      articles: { edges: Array<{ node: { id: string; title: string; handle: string; blog: { handle: string } } }> };
    }>(ARTICLES_QUERY, { first: 50 });

    const articles = data.articles.edges.map((e) => ({
      id: e.node.id,
      title: e.node.title,
      handle: e.node.handle,
      blogHandle: e.node.blog.handle,
    }));

    return NextResponse.json({ count: articles.length, articles });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
