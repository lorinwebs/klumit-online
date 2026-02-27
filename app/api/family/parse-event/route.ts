import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `אתה עוזר לפענח טקסט חופשי לאירועים ביומן משפחתי.

האנשים במשפחה: לורין, מור, רון, שי, שחר, כולם
קטגוריות: אימון, חוג, עבודה, משפחה, טיסה, אחר

כללים:
- אם לא צוין שם, ברירת מחדל: לורין
- אם לא צוינה קטגוריה, נסה להסיק. ברירת מחדל: אחר
- אם לא צוין תאריך, השתמש בהיום: ${new Date().toISOString().split('T')[0]}
- אם לא צוינה שעת סיום, הוסף שעה לשעת ההתחלה
- אם צוין יום בשבוע (למשל "יום שני"), חשב את התאריך הקרוב
- זהה בקשות תזכורת: "תזכיר לי", "הזכר לי", "שלח תזכורת" וכו'
  * 5 דקות לפני = 5
  * 10 דקות לפני = 10
  * 15 דקות לפני = 15
  * 30 דקות לפני = 30
  * שעה לפני = 60
  * שעתיים לפני = 120
  * יום לפני / 24 שעות לפני = 1440
- אם הטקסט מכיל מספר אירועים, החזר מערך של אירועים
- אם הטקסט מכיל אירוע אחד בלבד, החזר מערך עם אירוע אחד
- החזר JSON בלבד

פורמט תשובה (JSON בלבד - תמיד מערך):
[
  {
    "title": "שם האירוע",
    "person": "שם האדם",
    "category": "קטגוריה",
    "date": "YYYY-MM-DD",
    "start_time": "HH:MM",
    "end_time": "HH:MM",
    "recurring": false,
    "reminder_minutes": null או מספר,
    "notes": ""
  }
]`;

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Extract JSON array or object from response
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    const objMatch = content.match(/\{[\s\S]*\}/);
    
    if (!arrayMatch && !objMatch) {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
    }

    let parsed;
    if (arrayMatch) {
      parsed = JSON.parse(arrayMatch[0]);
    } else {
      parsed = [JSON.parse(objMatch![0])];
    }

    const events = Array.isArray(parsed) ? parsed : [parsed];
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ error: 'Failed to parse event' }, { status: 500 });
  }
}
