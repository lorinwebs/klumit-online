import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin';

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const BOARD_ID = '5090027047';
const CLASS_COLUMN_ID = 'single_selectv1iuqqz';
const PAID_COLUMN_ID = 'color_mm0m3qfz';
const CITY_COLUMN_ID = 'short_texthbssufi9';

export async function GET() {
  if (!MONDAY_API_KEY) {
    return NextResponse.json({ error: 'API key missing' }, { status: 500 });
  }

  try {
    // Fetch paid participants from Monday
    let allItems: any[] = [];
    let cursor: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const query: string = `
        query {
          boards(ids: [${BOARD_ID}]) {
            items_page(limit: 100${cursor ? `, cursor: "${cursor}"` : ''}) {
              items {
                id
                name
                column_values(ids: ["${CLASS_COLUMN_ID}", "${PAID_COLUMN_ID}", "${CITY_COLUMN_ID}"]) {
                  id
                  text
                  value
                }
              }
              cursor
            }
          }
        }
      `;

      const response: Response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': MONDAY_API_KEY,
          'API-Version': '2024-01',
        },
        body: JSON.stringify({ query }),
      });

      const data: { data?: { boards?: Array<{ items_page?: { items: any[]; cursor: string | null } }> } } = await response.json();
      const itemsPage: { items: any[]; cursor: string | null } | undefined = data.data?.boards?.[0]?.items_page;
      const items = itemsPage?.items || [];
      allItems = [...allItems, ...items];
      cursor = itemsPage?.cursor || null;
      hasMore = cursor !== null && items.length > 0;
    }

    // Filter only paid participants
    const paid = allItems
      .filter(item => {
        const paidCol = item.column_values.find((c: any) => c.id === PAID_COLUMN_ID);
        if (!paidCol) return false;
        try {
          const parsed = JSON.parse(paidCol.value);
          return parsed.label === 'כן' || parsed.index === 1;
        } catch {
          return paidCol.text === 'כן';
        }
      })
      .map(item => {
        const classCol = item.column_values.find((c: any) => c.id === CLASS_COLUMN_ID);
        const className = classCol?.text || '';
        // Map Monday class names to badge grade values
        const classMap: Record<string, string> = {
          'יב1': 'יב1', 'יב2': 'יב2', 'יב3': 'יב3', 'יב4': 'יב4', 'יב5': 'יב5',
          'יב6': 'יב6', 'יב7': 'יב7', 'יב8': 'יב8', 'יב9': 'יב9', 'יב10': 'יב10',
        };
        const cityCol = item.column_values.find((c: any) => c.id === CITY_COLUMN_ID);
        return {
          name: item.name as string,
          grade: classMap[className] || '',
          city: cityCol?.text || '',
        };
      });

    // Check which ones already have badges
    const admin = createSupabaseAdminClient();
    const { data: badges } = await admin
      .from('reunion_badges')
      .select('monday_name');

    const badgeNames = new Set(
      (badges || []).filter(b => b.monday_name).map(b => b.monday_name.trim().toLowerCase())
    );

    const result = paid.map(p => ({
      ...p,
      hasBadge: badgeNames.has(p.name.trim().toLowerCase()),
    }));

    return NextResponse.json({ participants: result });
  } catch (error: any) {
    console.error('Paid participants error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
