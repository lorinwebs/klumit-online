import http from 'node:http';
import path from 'node:path';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import pino from 'pino';
import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import makeWASocket, {
  Browsers,
  DisconnectReason,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_KEY,
  FORWARD_TO = '972542600177',
  AUTH_DIR = './auth',
  PORT = '3000',
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_KEY) {
  console.error('Missing env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_KEY are required');
  process.exit(1);
}

const TABLE = 'klumit_whatsapp_messages';
const BUCKET = 'klumit-whatsapp-media';

const digits = FORWARD_TO.replace(/\D/g, '');
const FORWARD_PHONE = digits.startsWith('0') ? `972${digits.slice(1)}` : digits;
const FORWARD_JID = `${FORWARD_PHONE}@s.whatsapp.net`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }, // Node 20 has no native WebSocket
});
const logger = pino({ level: 'warn' });

const REPLY_CMD = /^\s*תגיב\s+([\s\S]+)$/;

// WhatsApp may address the manager by LID instead of phone, so his chat JIDs are learned and persisted
const MANAGER_FILE = path.join(AUTH_DIR, 'manager-jids.json');
const managerJids = new Set();

async function loadManagerJids() {
  try {
    for (const jid of JSON.parse(await readFile(MANAGER_FILE, 'utf8'))) managerJids.add(jid);
  } catch {
    // first run – nothing learned yet
  }
}

async function rememberManagerJid(jid) {
  if (!jid || managerJids.has(jid)) return;
  managerJids.add(jid);
  console.log('learned manager jid', jid);
  try {
    await mkdir(AUTH_DIR, { recursive: true });
    await writeFile(MANAGER_FILE, JSON.stringify([...managerJids]));
  } catch (e) {
    console.error('failed to persist manager jids', e?.message || e);
  }
}

let currentQr = null;
let status = 'starting';
let activeSock = null;

// ---------------------------------------------------------------------------
// Message parsing
// ---------------------------------------------------------------------------

function unwrap(message) {
  let m = message;
  for (let i = 0; i < 4 && m; i++) {
    const inner =
      m.ephemeralMessage?.message ||
      m.viewOnceMessage?.message ||
      m.viewOnceMessageV2?.message ||
      m.documentWithCaptionMessage?.message;
    if (!inner) break;
    m = inner;
  }
  return m;
}

/** Returns { type, text, media?: { kind, mime, fileName } } or null for non-content messages. */
function parse(m) {
  if (!m) return null;
  if (m.conversation) return { type: 'text', text: m.conversation };
  if (m.extendedTextMessage) return { type: 'text', text: m.extendedTextMessage.text || '' };
  if (m.imageMessage) return { type: 'image', text: m.imageMessage.caption || '', media: { kind: 'image', mime: m.imageMessage.mimetype } };
  if (m.videoMessage) return { type: 'video', text: m.videoMessage.caption || '', media: { kind: 'video', mime: m.videoMessage.mimetype } };
  if (m.audioMessage) return { type: 'audio', text: '', media: { kind: 'audio', mime: m.audioMessage.mimetype, ptt: !!m.audioMessage.ptt } };
  if (m.documentMessage) {
    return {
      type: 'document',
      text: m.documentMessage.caption || '',
      media: { kind: 'document', mime: m.documentMessage.mimetype, fileName: m.documentMessage.fileName || 'file' },
    };
  }
  if (m.stickerMessage) return { type: 'sticker', text: '', media: { kind: 'sticker', mime: m.stickerMessage.mimetype } };
  if (m.locationMessage) {
    const { degreesLatitude: lat, degreesLongitude: lng } = m.locationMessage;
    return { type: 'location', text: `https://maps.google.com/?q=${lat},${lng}` };
  }
  if (m.contactMessage) return { type: 'contact', text: m.contactMessage.displayName || m.contactMessage.vcard || '' };
  return null; // reactions, protocol messages, key distribution, etc.
}

function phoneOf(jid) {
  if (!jid || !jid.endsWith('@s.whatsapp.net')) return null;
  return jid.split('@')[0].split(':')[0];
}

const TYPE_LABEL = {
  text: '',
  image: '🖼️ תמונה',
  video: '🎥 סרטון',
  audio: '🎤 הודעה קולית',
  document: '📄 מסמך',
  sticker: '🙂 סטיקר',
  location: '📍 מיקום',
  contact: '👤 איש קשר',
};

// ---------------------------------------------------------------------------
// Manager reply: Mor replies to a forwarded message with "תגיב <text>"
// ---------------------------------------------------------------------------

/** Customer chat behind a forwarded message, or null. Only the manager ever receives forwarded messages. */
async function findForwardedChat(quotedId) {
  if (!quotedId) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select('chat_jid')
    .contains('forward_message_ids', [quotedId])
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`lookup failed: ${error.message}`);
  return data?.chat_jid || null;
}

async function handleManagerCommand(sock, managerChat, targetChat, text) {
  const reply = text.match(REPLY_CMD)?.[1]?.trim();
  if (!reply) return; // not a reply command → nothing to do

  if (!targetChat) {
    await sock.sendMessage(managerChat, {
      text: '❗ כדי לשלוח ללקוח, יש לעשות Reply על ההודעה שהועברה ולכתוב "תגיב ..."',
    });
    return;
  }

  try {
    await sock.sendMessage(targetChat, { text: reply });
  } catch (e) {
    await sock.sendMessage(managerChat, { text: `❌ השליחה ללקוח נכשלה: ${e?.message || e}` });
    throw e;
  }
  await sock.sendMessage(managerChat, { text: '✅ נשלח ללקוח' });
}

// ---------------------------------------------------------------------------
// Handler: save to DB, then forward
// ---------------------------------------------------------------------------

async function handleMessage(sock, msg, upsertType) {
  const key = msg.key;
  if (!key?.id || !key.remoteJid) return;
  if (key.remoteJid === 'status@broadcast' || key.remoteJid.endsWith('@newsletter')) return;

  const rawMessage = unwrap(msg.message);
  const parsed = parse(rawMessage);
  if (!parsed) return;

  const quotedId = rawMessage?.extendedTextMessage?.contextInfo?.stanzaId || null;

  const chatJid = key.remoteJid;
  const isGroup = chatJid.endsWith('@g.us');
  const fromMe = !!key.fromMe;
  const jidCandidates = fromMe
    ? [sock.user?.id]
    : isGroup
      ? [key.participantAlt, key.participantPn, key.participant]
      : [key.remoteJidAlt, key.senderPn, chatJid];
  const senderJid = jidCandidates.find((jid) => jid?.endsWith('@s.whatsapp.net')) || jidCandidates.at(-1);
  const senderPhone = phoneOf(senderJid);
  const senderName = msg.pushName || null;

  const { data: inserted, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        wa_message_id: key.id,
        chat_jid: chatJid,
        is_group: isGroup,
        from_me: fromMe,
        sender_jid: senderJid || null,
        sender_phone: senderPhone,
        sender_name: senderName,
        message_type: parsed.type,
        body: parsed.text || null,
        media_mime: parsed.media?.mime || null,
        wa_timestamp: new Date(Number(String(msg.messageTimestamp)) * 1000).toISOString(),
      },
      { onConflict: 'wa_message_id', ignoreDuplicates: true }
    )
    .select('id');

  if (error) throw new Error(`DB insert failed: ${error.message}`);
  if (!inserted?.length) return; // already stored (reconnect / history replay) → never process twice

  const rowId = inserted[0].id;

  // Media: download once, keep in Storage, reuse for the forward
  let buffer = null;
  if (parsed.media) {
    try {
      buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger, reuploadRequest: sock.updateMediaMessage });
      const ext = (parsed.media.mime || 'application/octet-stream').split('/')[1]?.split(';')[0] || 'bin';
      const path = `${(senderPhone || chatJid).replace(/[^\w.-]/g, '_')}/${key.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: parsed.media.mime, upsert: true });
      if (uploadError) throw uploadError;
      await supabase.from(TABLE).update({ media_path: path }).eq('id', rowId);
    } catch (e) {
      console.error('media download/upload failed', key.id, e?.message || e);
    }
  }

  // Live incoming messages only
  if (upsertType !== 'notify' || fromMe) return;

  // Messages from the manager himself → commands, never forwarded back to him
  const targetChat = isGroup ? null : await findForwardedChat(quotedId);
  const isManager = !isGroup && (senderPhone === FORWARD_PHONE || managerJids.has(chatJid) || targetChat !== null);
  if (isManager) {
    await rememberManagerJid(chatJid);
    if (parsed.text) {
      try {
        await handleManagerCommand(sock, chatJid, targetChat, parsed.text);
      } catch (e) {
        console.error('manager command failed', key.id, e?.message || e);
      }
    }
    return;
  }

  // Customer message → forward to manager, remember which forwarded message maps to this chat
  const forwardIds = [];
  try {
    const label = TYPE_LABEL[parsed.type];
    const header = [
      isGroup ? '📩 הודעה חדשה בקבוצה (וואטסאפ עסקי)' : '📩 הודעה חדשה בוואטסאפ העסקי',
      `👤 ${senderName || 'ללא שם'}${senderPhone ? ` · +${senderPhone}` : ''}`,
      label,
      parsed.text,
      '',
      'להשיב ללקוח: Reply על ההודעה ← "תגיב ..."',
    ]
      .filter((line) => line !== undefined && line !== null && line !== '')
      .join('\n');

    const sentHeader = await sock.sendMessage(FORWARD_JID, { text: header });
    if (sentHeader?.key?.id) forwardIds.push(sentHeader.key.id);

    if (buffer && parsed.media) {
      const { kind, mime, fileName, ptt } = parsed.media;
      let sentMedia;
      if (kind === 'image') sentMedia = await sock.sendMessage(FORWARD_JID, { image: buffer });
      else if (kind === 'video') sentMedia = await sock.sendMessage(FORWARD_JID, { video: buffer });
      else if (kind === 'audio') sentMedia = await sock.sendMessage(FORWARD_JID, { audio: buffer, mimetype: mime, ptt });
      else if (kind === 'sticker') sentMedia = await sock.sendMessage(FORWARD_JID, { sticker: buffer });
      else sentMedia = await sock.sendMessage(FORWARD_JID, { document: buffer, mimetype: mime, fileName });
      if (sentMedia?.key?.id) forwardIds.push(sentMedia.key.id);
    }

    await supabase
      .from(TABLE)
      .update({ forwarded_at: new Date().toISOString(), forward_message_ids: forwardIds })
      .eq('id', rowId);
  } catch (e) {
    console.error('forward failed', key.id, e?.message || e);
    await supabase
      .from(TABLE)
      .update({ forward_error: String(e?.message || e).slice(0, 500), forward_message_ids: forwardIds })
      .eq('id', rowId);
  }
}

// ---------------------------------------------------------------------------
// WhatsApp connection
// ---------------------------------------------------------------------------

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    browser: Browsers.macOS('Klumit Bridge'),
    markOnlineOnConnect: false, // keep push notifications on the physical phone
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      currentQr = qr;
      status = 'waiting_for_scan';
    }
    if (connection === 'open') {
      activeSock = sock;
      currentQr = null;
      status = 'connected';
      console.log('WhatsApp connected as', sock.user?.id);
    }
    if (connection === 'close') {
      if (activeSock === sock) activeSock = null;
      status = 'disconnected';
      const code = lastDisconnect?.error?.output?.statusCode;
      console.warn('WhatsApp connection closed, code:', code);
      if (code === DisconnectReason.loggedOut) {
        await rm(AUTH_DIR, { recursive: true, force: true }); // force a fresh QR
      }
      setTimeout(() => start().catch((e) => console.error('restart failed', e)), 3000);
    }
  });

  sock.ev.on('messages.upsert', ({ messages, type }) => {
    for (const msg of messages) {
      handleMessage(sock, msg, type).catch((e) => console.error('handleMessage error', e?.message || e));
    }
  });
}

// ---------------------------------------------------------------------------
// HTTP: health check + QR page (protected by ADMIN_KEY)
// ---------------------------------------------------------------------------

async function readJson(req, limit = 20_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('payload too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');

    // Site → manager notifications: POST /notify { text } with "Authorization: Bearer <ADMIN_KEY>"
    if (req.method === 'POST' && url.pathname === '/notify') {
      const json = (code, body) => {
        res.writeHead(code, { 'content-type': 'application/json' });
        res.end(JSON.stringify(body));
      };
      if (req.headers.authorization !== `Bearer ${ADMIN_KEY}`) return json(401, { ok: false, reason: 'unauthorized' });
      if (!activeSock) return json(503, { ok: false, reason: 'whatsapp_not_connected' });
      try {
        const { text } = await readJson(req);
        if (typeof text !== 'string' || !text.trim()) return json(400, { ok: false, reason: 'missing_text' });
        await activeSock.sendMessage(FORWARD_JID, { text: text.slice(0, 4000) });
        return json(200, { ok: true });
      } catch (e) {
        console.error('notify failed', e?.message || e);
        return json(500, { ok: false, reason: 'send_failed' });
      }
    }

    if (url.pathname === '/qr') {
      if (url.searchParams.get('key') !== ADMIN_KEY) {
        res.writeHead(401).end('unauthorized');
        return;
      }
      let body;
      if (status === 'connected') body = '<h2>✅ מחובר לוואטסאפ</h2>';
      else if (currentQr) body = `<h2>סרקו עם הטלפון העסקי</h2><p>וואטסאפ ← מכשירים מקושרים ← קישור מכשיר</p><img src="${await QRCode.toDataURL(currentQr, { width: 320 })}" />`;
      else body = `<h2>סטטוס: ${status}</h2><p>ממתין ל-QR…</p>`;
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(`<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="5"><title>Klumit WhatsApp</title></head><body style="font-family:sans-serif;text-align:center;padding:24px">${body}</body></html>`);
      return;
    }

    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, status }));
  })
  .listen(Number(PORT), () => console.log(`bridge listening on :${PORT}`));

loadManagerJids()
  .then(start)
  .catch((e) => {
    console.error('fatal', e);
    process.exit(1);
  });
