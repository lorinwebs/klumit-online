#!/bin/bash
# Setup Telegram webhook for Family Schedule bot

BOT_TOKEN="8492788377:AAEy7pE3PegmO6yuig_Ziu5ko1QyIVWxZ_A"
# Replace with your actual domain
WEBHOOK_URL="https://klumit-online.co.il/api/family/telegram-webhook"

echo "Setting up Telegram webhook for Family Schedule bot..."
echo "Webhook URL: $WEBHOOK_URL"

curl -s "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}" | jq .

echo ""
echo "Checking webhook info..."
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | jq .
