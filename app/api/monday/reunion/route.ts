import { NextRequest, NextResponse } from 'next/server';

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const BOARD_ID = '5090027047';

interface MondayItem {
  id: string;
  name: string;
  column_values: Array<{
    id: string;
    text: string;
    value: string;
  }>;
}

interface Participant {
  name: string;
  className?: string;
  phone?: string;
  email?: string;
  city?: string;
  preferredDate?: string;
  budget?: string;
  meetingStyle?: string;
  notes?: string;
  wantsToHelp?: string;
  otherClass?: string;
}

const CLASS_COLUMN_ID = 'single_selectv1iuqqz'; // איזה כיתה היית?
const OTHER_CLASS_COLUMN_ID = 'short_textuq6e9se6'; // אם בחרת אחר

export async function GET(request: NextRequest) {
  if (!MONDAY_API_KEY) {
    return NextResponse.json(
      { error: 'Monday.com API key not configured' },
      { status: 500 }
    );
  }

  try {
    const query = `
      query {
        boards(ids: [${BOARD_ID}]) {
          items_page {
            items {
              id
              name
              column_values(ids: ["name", "${CLASS_COLUMN_ID}", "${OTHER_CLASS_COLUMN_ID}", "phonewmatatfo", "emailpm71o46m", "short_texthbssufi9", "single_selectp6t5jmo", "single_selectiapws1k", "single_selectgrjlcmm", "long_text1wz8do45", "single_selectpw3esvn"]) {
                id
                text
                value
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.monday.com/v2', {
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

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    const items: MondayItem[] = data.data.boards[0]?.items_page?.items || [];

    const participants: Participant[] = items.map((item) => {
      const columns = item.column_values.reduce((acc, col) => {
        acc[col.id] = col.text || col.value;
        return acc;
      }, {} as Record<string, string>);

      // קביעת כיתה - אם יש "אחר" עם ערך, להשתמש בו, אחרת להשתמש בערך מה-dropdown
      let className = columns[CLASS_COLUMN_ID] || '';
      if (className === 'אחר' && columns[OTHER_CLASS_COLUMN_ID]) {
        className = columns[OTHER_CLASS_COLUMN_ID];
      }

      return {
        name: item.name,
        className: className || 'לא צוין',
        phone: columns['phonewmatatfo'] || '',
        email: columns['emailpm71o46m'] || '',
        city: columns['short_texthbssufi9'] || '',
        preferredDate: columns['single_selectp6t5jmo'] || '',
        budget: columns['single_selectiapws1k'] || '',
        meetingStyle: columns['single_selectgrjlcmm'] || '',
        notes: columns['long_text1wz8do45'] || '',
        wantsToHelp: columns['single_selectpw3esvn'] || '',
        otherClass: className === 'אחר' ? columns[OTHER_CLASS_COLUMN_ID] : undefined,
      };
    });

    // קיבוץ לפי כיתות
    const byClass: Record<string, Participant[]> = {};
    
    participants.forEach((participant) => {
      const className = participant.className || 'לא צוין';
      if (!byClass[className]) {
        byClass[className] = [];
      }
      byClass[className].push(participant);
    });

    // מיון כיתות: יב1-יב10, אחר, לא צוין
    const sortedClasses = Object.keys(byClass).sort((a, b) => {
      if (a === 'לא צוין') return 1;
      if (b === 'לא צוין') return -1;
      if (a === 'אחר') return 1;
      if (b === 'אחר') return -1;
      
      // מיון יב1-יב10
      const matchA = a.match(/יב(\d+)/);
      const matchB = b.match(/יב(\d+)/);
      if (matchA && matchB) {
        return parseInt(matchA[1]) - parseInt(matchB[1]);
      }
      return a.localeCompare(b);
    });

    const result = {
      total: participants.length,
      byClass: sortedClasses.reduce((acc, className) => {
        acc[className] = byClass[className];
        return acc;
      }, {} as Record<string, Participant[]>),
    };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
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
