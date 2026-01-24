import { NextRequest, NextResponse } from 'next/server';
import { trackUserVisit } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { sessionId, pagePath, pageTitle, pageUrl, previousPages } = body;

    if (!sessionId || !pagePath) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: sessionId, pagePath' },
        { status: 400 }
      );
    }

    const result = await trackUserVisit({
      sessionId,
      pagePath,
      pageTitle: pageTitle || pagePath,
      pageUrl: pageUrl || pagePath,
      previousPages: previousPages || [],
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to track visit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error('Error in track-visit API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
