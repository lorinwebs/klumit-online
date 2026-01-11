#!/bin/bash

# סקריפט להגדרת Telegram Webhook
# שימוש: ./scripts/setup-telegram-webhook.sh

# קבלת משתני סביבה
BOT_TOKEN="${TELEGRAM_CHAT_BOT_TOKEN_KLUMIT:-8562898707:AAGUimoO2VTbdvjgHr2nKOVFAY1WtbCRGhI}"
WEBHOOK_SECRET="${TELEGRAM_WEBHOOK_SECRET}"

# URL של ה-webhook - שנה לפי ה-domain שלך
# אם יש לך domain מותאם אישית:
WEBHOOK_URL="https://www.klumit-online.co.il/api/telegram/webhook"

# או אם אתה משתמש ב-Vercel URL:
# WEBHOOK_URL="https://klumit-online.vercel.app/api/telegram/webhook"

echo "🔧 הגדרת Telegram Webhook..."
echo "Bot Token: ${BOT_TOKEN:0:20}..."
echo "Webhook URL: $WEBHOOK_URL"

# בדיקה אם ה-webhook כבר מוגדר
echo ""
echo "📋 בדיקת webhook נוכחי..."
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | jq '.'

# הגדרת webhook
echo ""
echo "⚙️  הגדרת webhook חדש..."

if [ -z "$WEBHOOK_SECRET" ]; then
  echo "⚠️  אזהרה: TELEGRAM_WEBHOOK_SECRET לא מוגדר!"
  echo "הגדרת webhook ללא secret token..."
  
  curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{
      \"url\": \"${WEBHOOK_URL}\"
    }"
else
  echo "הגדרת webhook עם secret token..."
  curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{
      \"url\": \"${WEBHOOK_URL}\",
      \"secret_token\": \"${WEBHOOK_SECRET}\"
    }"
fi

echo ""
echo "✅ סיום! בדוק את התוצאה למעלה."
