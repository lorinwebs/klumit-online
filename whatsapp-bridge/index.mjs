import http from 'node:http';
import { rm } from 'node:fs/promises';
import pino from 'pino';
import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';
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
});
const logger = pino({ level: 'warn' });

let currentQr = null;
let status = 'starting';

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
// Handler: save to DB, then forward
// ---------------------------------------------------------------------------

async function handleMessage(sock, msg, upsertType) {
  const key = msg.key;
  if (!key?.id || !key.remoteJid) return;
  if (key.remoteJid === 'status@broadcast' || key.remoteJid.endsWith('@newsletter')) return;

  const parsed = parse(unwrap(msg.message));
  if (!parsed) return;

  const chatJid = key.remoteJid;
  const isGroup = chatJid.endsWith('@g.us');
  const fromMe = !!key.fromMe;
  const senderJid = fromMe
    ? sock.user?.id
    : isGroup
      ? key.participantAlt || key.participant
      : key.remoteJidAlt?.endsWith('@s.whatsapp.net')
        ? key.remoteJidAlt
        : chatJid;
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
  if (!inserted?.length) return; // already stored (reconnect / history replay) → never forward twice

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

  // Forward only live, incoming messages that don't come from the recipient himself
  if (upsertType !== 'notify' || fromMe || senderPhone === FORWARD_PHONE) return;

  try {
    const label = TYPE_LABEL[parsed.type];
    const header = [
      isGroup ? '📩 הודעה חדשה בקבוצה (וואטסאפ עסקי)' : '📩 הודעה חדשה בוואטסאפ העסקי',
      `👤 ${senderName || 'ללא שם'}${senderPhone ? ` · +${senderPhone}` : ''}`,
      label,
      parsed.text,
    ]
      .filter(Boolean)
      .join('\n');

    await sock.sendMessage(FORWARD_JID, { text: header });

    if (buffer && parsed.media) {
      const { kind, mime, fileName, ptt } = parsed.media;
      if (kind === 'image') await sock.sendMessage(FORWARD_JID, { image: buffer });
      else if (kind === 'video') await sock.sendMessage(FORWARD_JID, { video: buffer });
      else if (kind === 'audio') await sock.sendMessage(FORWARD_JID, { audio: buffer, mimetype: mime, ptt });
      else if (kind === 'sticker') await sock.sendMessage(FORWARD_JID, { sticker: buffer });
      else await sock.sendMessage(FORWARD_JID, { document: buffer, mimetype: mime, fileName });
    }

    await supabase.from(TABLE).update({ forwarded_at: new Date().toISOString() }).eq('id', rowId);
  } catch (e) {
    console.error('forward failed', key.id, e?.message || e);
    await supabase.from(TABLE).update({ forward_error: String(e?.message || e).slice(0, 500) }).eq('id', rowId);
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
      currentQr = null;
      status = 'connected';
      console.log('WhatsApp connected as', sock.user?.id);
    }
    if (connection === 'close') {
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

http
  .createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');

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

start().catch((e) => {
  console.error('fatal', e);
  process.exit(1);
});
