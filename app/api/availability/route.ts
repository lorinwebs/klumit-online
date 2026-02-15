import { NextRequest, NextResponse } from 'next/server';

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const BOARD_ID = '5091802608';

interface MondayItem {
  id: string;
  name: string;
  column_values: Array<{
    id: string;
    text: string;
    value: string;
  }>;
}

interface Person {
  name: string;
  unavailableDates: string[]; // IDs of dates they can't attend
  canDoAll: boolean;
  hasResponded: boolean; // האם האדם ענה בכלל
}

const DROPDOWN_COLUMN_ID = 'dropdown_mm0kdgr9'; // ימי חמישי שבהם לא אוכל להגיע

// מיפוי תאריכים לפי ID
const DATE_LABELS: Record<number, string> = {
  2: '07/05 (יום ה\')',
  3: '14/05 (יום ה\')',
  4: '21/05 (יום ה\')',
  5: '28/05 (יום ה\')',
  7: '04/06 (יום ה\')',
  8: '11/06 (יום ה\')',
  9: '18/06 (יום ה\')',
  10: '25/06 (יום ה\')',
  12: '02/07 (יום ה\')',
  13: '09/07 (יום ה\')',
};

export async function GET(request: NextRequest) {
  if (!MONDAY_API_KEY) {
    return NextResponse.json(
      { error: 'Monday.com API key not configured' },
      { status: 500 }
    );
  }

  try {
    // Fetch all items with pagination
    let allItems: MondayItem[] = [];
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
                column_values(ids: ["name", "${DROPDOWN_COLUMN_ID}"]) {
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

      if (!response.ok) {
        throw new Error(`Monday.com API error: ${response.statusText}`);
      }

      const data: any = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      const itemsPage: any = data.data.boards[0]?.items_page;
      const items: MondayItem[] = itemsPage?.items || [];
      
      allItems = [...allItems, ...items];
      
      cursor = itemsPage?.cursor || null;
      hasMore = cursor !== null && items.length > 0;
    }

    const items: MondayItem[] = allItems;

    const people: Person[] = items.map((item, index) => {
      const dropdownColumn = item.column_values.find(col => col.id === DROPDOWN_COLUMN_ID);
      
      let unavailableDates: string[] = [];
      let canDoAll = false;
      let hasResponded = false;

      // ניתוח הערכים מה-dropdown
      if (dropdownColumn?.value) {
        try {
          const parsed = JSON.parse(dropdownColumn.value);
          const ids = parsed?.ids || [];
          
          // אם יש ids, זה אומר שהאדם ענה
          if (ids.length > 0) {
            hasResponded = true;
            
            // בדיקה אם יש "יכול\ה הכל" (id: 14)
            const hasCanDoAll = ids.includes(14);
            canDoAll = hasCanDoAll;

            if (!hasCanDoAll) {
              // רק אם לא סימן "יכול\ה הכל", נוסיף את התאריכים שלא יכול
              unavailableDates = ids
                .filter((id: number) => id !== 1 && id !== 6 && id !== 11 && id !== 14) // סינון כותרות חודשים
                .map((id: number) => DATE_LABELS[id])
                .filter(Boolean);
            }
          }
        } catch (e) {
          // אם יש שגיאת parsing, זה לא אומר שהאדם לא ענה
          // נבדוק אם יש text
          if (dropdownColumn.text && dropdownColumn.text.trim() !== '') {
            hasResponded = true;
          }
        }
      }

      return {
        name: item.name,
        unavailableDates,
        canDoAll,
        hasResponded,
      };
    });

    // יצירת רשימת כל התאריכים האפשריים
    const availableDates = Object.values(DATE_LABELS);

    return NextResponse.json({
      total: people.length,
      people,
      availableDates,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=5',
      },
    });
  } catch (error: any) {
    console.error('Error fetching Monday.com data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
