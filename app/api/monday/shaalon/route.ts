import { NextResponse } from 'next/server';

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const BOARD_ID = '5092160236';

export interface ShaalonPerson {
  id: string;
  name: string;
  nameOld: string;
  kita: string;
  status: string;
  kids: string;
  kidsAges: string;
  city: string;
  contacts: string;
  job: string;
  weirdJob: string;
  embarrass: string;
  teacher: string;
  highschoolStory: string;
  mostChanged: string;
  changedInMe: string;
  breakfriends: string;
  classChar: string;
  strongMemory: string;
  secret: string;
  blessing: string;
  drinksAlcohol: boolean;
  teacherQuotes: string;
  drinkPrefs: string;
}

const COL_MAP: Record<string, keyof ShaalonPerson> = {
  short_textjfs7ois0: 'nameOld',
  single_selectl3f4sxg: 'kita',
  single_select3if3zgf: 'status',
  short_text3y70g9mp: 'kids',
  short_textcz2u9k8o: 'kidsAges',
  short_textuglrqbdc: 'city',
  long_textfb8vy4y5: 'contacts',
  long_textqw1eezsk: 'job',
  long_textkzjy7qns: 'weirdJob',
  long_textp8av0b5y: 'embarrass',
  long_textq3jvoilg: 'teacher',
  long_texto8ip9jyk: 'highschoolStory',
  long_texthxxnwbcc: 'mostChanged',
  long_textmlhkutbx: 'changedInMe',
  short_text2mz6q3sp: 'breakfriends',
  long_textkz2keie8: 'classChar',
  long_textfdxuina1: 'strongMemory',
  long_textfn1nhtml: 'secret',
  long_textqxcp5gcd: 'blessing',
  boolean7x1tt3m4: 'drinksAlcohol',
  long_textjpjbqpra: 'teacherQuotes',
  multi_selectw6xnf5l9: 'drinkPrefs',
};

export async function GET() {
  if (!MONDAY_API_KEY) {
    return NextResponse.json({ error: 'Monday API key not configured' }, { status: 500 });
  }

  const query = `{
    boards(ids: [${BOARD_ID}]) {
      items_page(limit: 500) {
        items {
          id
          name
          column_values {
            id
            text
            value
          }
        }
      }
    }
  }`;

  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: MONDAY_API_KEY,
      'API-Version': '2024-01',
    },
    body: JSON.stringify({ query }),
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`Monday API error: ${res.statusText}`);
  const data = await res.json();

  const items: any[] = data.data?.boards[0]?.items_page?.items || [];

  const people: ShaalonPerson[] = items.map(item => {
    const p: ShaalonPerson = {
      id: item.id,
      name: item.name,
      nameOld: '',
      kita: '',
      status: '',
      kids: '',
      kidsAges: '',
      city: '',
      contacts: '',
      job: '',
      weirdJob: '',
      embarrass: '',
      teacher: '',
      highschoolStory: '',
      mostChanged: '',
      changedInMe: '',
      breakfriends: '',
      classChar: '',
      strongMemory: '',
      secret: '',
      blessing: '',
      drinksAlcohol: false,
      teacherQuotes: '',
      drinkPrefs: '',
    };

    for (const cv of item.column_values) {
      const key = COL_MAP[cv.id];
      if (!key) continue;
      if (key === 'drinksAlcohol') {
        try {
          p.drinksAlcohol = JSON.parse(cv.value || '{}')?.checked === true;
        } catch { /* empty */ }
      } else {
        (p as any)[key] = cv.text || '';
      }
    }
    return p;
  });

  return NextResponse.json(people, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
  });
}
