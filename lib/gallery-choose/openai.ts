import { FACE_PROMPT, SCORE_PROMPT } from './prompts';

const BUCKET = 'mekif-chet-reunion';

function parseVisionJson(txt: string): Record<string, unknown> {
  try {
    return JSON.parse(txt.replace(/```json/g, '').replace(/```/g, '').trim());
  } catch {
    return {};
  }
}

async function visionJson(
  prompt: string,
  imgB64: string,
  contentType: string,
  maxTokens: number,
): Promise<Record<string, unknown>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('missing OPENAI_API_KEY');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${contentType};base64,${imgB64}`,
                detail: 'low',
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText;
    const is429 = res.status === 429 || String(msg).includes('429');
    const err = new Error(msg) as Error & { status?: number; retryAfter?: number };
    err.status = is429 ? 429 : res.status;
    err.retryAfter = is429 ? 30 : 0;
    throw err;
  }

  const txt = data.choices?.[0]?.message?.content?.trim() || '';
  return parseVisionJson(txt);
}

export async function loadImageB64(payload: {
  path?: string;
  url?: string;
  image_b64?: string;
  content_type?: string;
}): Promise<{ filePath: string; imgB64: string; contentType: string }> {
  const filePath = payload.path || payload.url;
  if (!filePath) throw new Error('path required');

  if (payload.image_b64) {
    const ct = (payload.content_type || 'image/jpeg').split(';')[0];
    return { filePath, imgB64: payload.image_b64, contentType: ct };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const imageUrl = filePath.startsWith('http')
    ? filePath
    : `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${filePath}`;

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`image fetch ${imgRes.status}`);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const ext = filePath.split('.').pop()?.toLowerCase() || 'jpg';
  const mime: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return {
    filePath,
    imgB64: buf.toString('base64'),
    contentType: mime[ext] || 'image/jpeg',
  };
}

export async function analyzeFaces(imgB64: string, contentType: string) {
  const parsed = await visionJson(FACE_PROMPT, imgB64, contentType, 150);
  let count = 0;
  try {
    count = Math.max(0, parseInt(String(parsed.count), 10) || 0);
  } catch {
    count = 0;
  }
  return { count, desc: String(parsed.desc || '') };
}

export async function scorePhoto(imgB64: string, contentType: string) {
  const parsed = await visionJson(SCORE_PROMPT, imgB64, contentType, 80);
  let score = 0;
  try {
    score = Math.max(1, Math.min(100, parseInt(String(parsed.score), 10) || 0));
  } catch {
    score = 0;
  }
  return { score };
}
