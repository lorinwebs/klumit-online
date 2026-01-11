#!/bin/bash

# סקריפט לבדיקת הגדרת Telegram Webhook
# שימוש: ./scripts/check-telegram-webhook.sh

BOT_TOKEN="${TELEGRAM_CHAT_BOT_TOKEN_KLUMIT:-8562898707:AAGUimoO2VTbdvjgHr2nKOVFAY1WtbCRGhI}"

echo "🔍 בדיקת הגדרת Telegram Webhook..."
echo ""

curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | jq '.'

echo ""
echo "💡 אם 'url' הוא null או ריק, ה-webhook לא מוגדר!"
echo "💡 אם 'pending_update_count' גדול מ-0, יש הודעות שממתינות לשליחה."
